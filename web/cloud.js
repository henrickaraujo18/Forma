import {CLOUD_CONFIG} from "./cloud-config.js";
import {STARTER_PROFILES,STARTER_ROUTINES} from "./data.js";
const BASE=CLOUD_CONFIG.url.replace(/\/$/,"");
const APIKEY=CLOUD_CONFIG.publishableKey;
const SESSION_KEY="forma.cloud.session.v1",LAST_WORKSPACE="forma.cloud.workspace.v1";
const clone=x=>JSON.parse(JSON.stringify(x));
const meaningful=s=>(s?.sessions?.length||0)+(s?.measurements?.length||0)+(s?.cardio?.length||0)>0;
const initial=()=>({version:1,profiles:clone(STARTER_PROFILES),routines:clone(STARTER_ROUTINES),sessions:[],measurements:[],cardio:[],active:null,activeSessions:{},deleted:{sessions:[],measurements:[],cardio:[]},preferences:{autoTimer:true,excludeWarmupFromVolume:true}});
function readJSON(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
function writeJSON(key,data){try{localStorage.setItem(key,JSON.stringify(data))}catch{}}
function getToken(){return readJSON(SESSION_KEY)}
const cacheKey=workspace=>"forma.cloud.cache."+workspace;
const unique=(arr=[])=>[...new Set(arr)];
function unionById(remote=[],local=[],deleted=[]){
 const by=new Map();
 for(const row of remote)if(row?.id)by.set(String(row.id),row);
 for(const row of local)if(row?.id){
  const old=by.get(String(row.id));
  if(!old||String(row.updatedAt||row.createdAt||"")>=String(old.updatedAt||old.createdAt||""))by.set(String(row.id),row);
 }
 return [...by.values()].filter(row=>!deleted.includes(String(row.id)));
}
export function mergeStores(remote={},local={}){
 const r={...initial(),...(remote||{})},l={...initial(),...(local||{})};
 const deleted={
  sessions:unique([...(r.deleted?.sessions||[]),...(l.deleted?.sessions||[])]),
  measurements:unique([...(r.deleted?.measurements||[]),...(l.deleted?.measurements||[])]),
  cardio:unique([...(r.deleted?.cardio||[]),...(l.deleted?.cardio||[])])
 };
 const profiles=unionById(r.profiles,l.profiles);
 const routines={...r.routines};
 for(const [key,items] of Object.entries(l.routines||{}))routines[key]=unionById(routines[key]||[],items||[]);
 const result={
  ...r,...l,version:1,
  profiles,routines,
  sessions:unionById(r.sessions,l.sessions,deleted.sessions),
  measurements:unionById(r.measurements,l.measurements,deleted.measurements),
  cardio:unionById(r.cardio,l.cardio,deleted.cardio),
  deleted,
  active:null,
  activeSessions:{...(r.activeSessions||{}),...(l.activeSessions||{})},
  preferences:{...(r.preferences||{}),...(l.preferences||{})}
 };
 if(r.active?.profile&&!result.activeSessions[r.active.profile])result.activeSessions[r.active.profile]=r.active;
 if(l.active?.profile)result.activeSessions[l.active.profile]=l.active;
 return result;
}
function apiError(res,data){
 const msg=data?.msg||data?.message||data?.error_description||data?.error||"Falha de conexão com o servidor";
 return Object.assign(new Error(String(msg)+" (HTTP "+res.status+")"),{status:res.status,body:data});
}
async function send(path,{method="GET",body,token,headers={},retry=true}={}){
 const h={apikey:APIKEY,Accept:"application/json",...headers};
 if(token)h.Authorization="Bearer "+token;
 if(body!==undefined)h["Content-Type"]="application/json";
 let response;
 try{response=await fetch(BASE+path,{method,headers:h,body:body!==undefined?JSON.stringify(body):undefined,cache:"no-store"});}
 catch{throw new Error("Sem conexão com a nuvem. Os registros locais continuam disponíveis.");}
 const raw=await response.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data={message:raw.slice(0,200)}}
 if(!response.ok)throw apiError(response,data);
 return data;
}
export class FormaCloud{
 constructor({onData=()=>{},onStatus=()=>{},getInitialData=()=>initial()}={}){
  this.onData=onData;this.onStatus=onStatus;this.getInitialData=getInitialData;this.session=getToken();this.user=null;
  this.workspace=null;this.role=null;this.revision=null;this.workspaces=[];
  this.pending=null;this.writing=false;this.syncTimer=null;this.pollTimer=null;
 }
 get signedIn(){return !!this.user&&!!this.session?.access_token}
 get status(){return this.workspace?"online":this.signedIn?"loading":"offline"}
 tell(status,message=""){this.onStatus(status,message)}
 async authorized(path,options={}){
  let token=await this.accessToken();
  try{return await send(path,{...options,token});}
  catch(e){if(e.status===401&&this.session?.refresh_token){await this.refresh();token=this.session.access_token;return send(path,{...options,token});}throw e;}
 }
 async accessToken(){
  if(!this.session?.access_token)throw new Error("Faça login para continuar.");
  const remaining=(this.session.expires_at||0)-Math.floor(Date.now()/1000);
  if(remaining<90)await this.refresh();
  return this.session.access_token;
 }
 setSession(data){
  if(!data?.access_token||!data?.refresh_token)throw new Error("O servidor não retornou uma sessão válida.");
  this.session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600)};
  writeJSON(SESSION_KEY,this.session);
  this.user=data.user||this.user;
 }
 async refresh(){
  if(!this.session?.refresh_token)throw new Error("Sessão expirada. Entre novamente.");
  const data=await send("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:{refresh_token:this.session.refresh_token}});
  this.setSession(data);return data;
 }
 async restore(){
  if(!this.session)return false;
  try{
   await this.accessToken();
   this.user=await this.authorized("/auth/v1/user");
   await this.open(null,this.getInitialData());
   return true;
  }catch(e){
   this.tell("error","Sessão em nuvem indisponível: "+e.message);
   this.user=null;return false;
  }
 }
 async login(email,password){
  const response=await send("/auth/v1/token?grant_type=password",{method:"POST",body:{email,password}});
  this.setSession(response);
  this.user=response.user||await this.authorized("/auth/v1/user");
  await this.open(null,this.getInitialData());
  return this.user;
 }
 async register(email,password){
  const result=await send("/auth/v1/signup",{method:"POST",body:{email,password}});
  if(result?.access_token&&result?.refresh_token){
    this.setSession(result);this.user=result.user||await this.authorized("/auth/v1/user");await this.open(null,this.getInitialData());
    return {loggedIn:true};
  }
  return {loggedIn:false,message:"Cadastro recebido. Se a confirmação de e-mail estiver ativada, confirme sua conta e depois entre pelo Forma."};
 }
 async logout(){
  try{await this.flush();}catch{}
  if(this.session?.access_token)await send("/auth/v1/logout",{method:"POST",token:this.session.access_token}).catch(()=>{});
  if(this.workspace)try{localStorage.removeItem(cacheKey(this.workspace));}catch{}
  try{localStorage.removeItem(SESSION_KEY);localStorage.removeItem(LAST_WORKSPACE);}catch{}
  this.session=null;this.user=null;this.workspace=null;this.role=null;this.workspaces=[];
  this.revision=null;this.pending=null;clearTimeout(this.syncTimer);clearInterval(this.pollTimer);
  this.tell("offline","Sessão encerrada.");
 }
 async listWorkspaces(){
  const list=await this.authorized("/rest/v1/forma_members?select=workspace_id,role&user_id=eq."+encodeURIComponent(this.user.id));
  this.workspaces=Array.isArray(list)?list:[];
  return this.workspaces;
 }
 async createWorkspace(localData){
  const rows=await this.authorized("/rest/v1/forma_workspaces?select=id",{method:"POST",body:{owner_id:this.user.id},headers:{Prefer:"return=representation"}});
  const workspace=rows?.[0]?.id;
  if(!workspace)throw new Error("Não foi possível criar o espaço de treinamento.");
  await this.authorized("/rest/v1/forma_members",{method:"POST",body:{workspace_id:workspace,user_id:this.user.id,role:"owner"},headers:{Prefer:"return=minimal"}});
  await this.authorized("/rest/v1/forma_data",{method:"POST",body:{workspace_id:workspace,document:localData||initial(),revision:0,updated_by:this.user.id},headers:{Prefer:"return=minimal"}});
  return workspace;
 }
 async open(preferred=null,seed=null){
  this.tell("syncing","Conectando ao seu histórico...");
  const memberships=await this.listWorkspaces();
  let chosen=preferred||(()=>{try{return localStorage.getItem(LAST_WORKSPACE)}catch{return null}})();
  if(!memberships.length){
   chosen=await this.createWorkspace(seed||initial());
   await this.listWorkspaces();
  } else if(!memberships.some(x=>x.workspace_id===chosen))chosen=memberships[0].workspace_id;
  await this.selectWorkspace(chosen);
 }
 async selectWorkspace(workspace){
  if(!this.workspaces.some(x=>x.workspace_id===workspace))throw new Error("Você não tem acesso a este espaço.");
  if(this.pending&&this.workspace&&this.workspace!==workspace)await this.flush();
  this.workspace=workspace;this.role=this.workspaces.find(x=>x.workspace_id===workspace)?.role||"member";
  try{localStorage.setItem(LAST_WORKSPACE,workspace)}catch{}
  const record=await this.fetchState();
  this.revision=record.revision;
  const local=readJSON(cacheKey(workspace));
  const merged=local?mergeStores(record.document,local):record.document;
  this.onData(merged);
  if(local&&JSON.stringify(local)!==JSON.stringify(record.document))this.queue(merged);
  else writeJSON(cacheKey(workspace),record.document);
  this.tell("online","Sincronizado com a nuvem.");
  this.startPolling();
  return merged;
 }
 async fetchState(){
  if(!this.workspace)throw new Error("Nenhum espaço selecionado.");
  const rows=await this.authorized("/rest/v1/forma_data?select=document,revision&workspace_id=eq."+encodeURIComponent(this.workspace));
  if(!rows?.length)throw new Error("Espaço criado sem estado: verifique as permissões.");
  return {document:rows[0].document||initial(),revision:Number(rows[0].revision)};
 }
 queue(data){
  if(!this.workspace||!this.signedIn)return;
  this.pending=clone(data);
  writeJSON(cacheKey(this.workspace),this.pending);
  this.tell("pending","Alterações aguardando sincronização.");
  clearTimeout(this.syncTimer);
  this.syncTimer=setTimeout(()=>this.flush().catch(()=>{}),900);
 }
 async flush(){
  if(!this.pending||this.writing||!this.workspace)return;
  this.writing=true;
  try{
   let tries=0;
   while(this.pending&&tries<5){
    tries++;
    let snapshot=this.pending;this.pending=null;
    // Sempre compara versão no servidor para evitar perda silenciosa de registros simultâneos.
    const current=await this.fetchState();
    if(current.revision!==this.revision){
      snapshot=mergeStores(current.document,snapshot);
      this.revision=current.revision;
    }
    const nextRevision=current.revision+1;
    const endpoint="/rest/v1/forma_data?select=revision&workspace_id=eq."+encodeURIComponent(this.workspace)+"&revision=eq."+current.revision;
    const rows=await this.authorized(endpoint,{
      method:"PATCH",
      body:{document:snapshot,revision:nextRevision,updated_at:new Date().toISOString(),updated_by:this.user.id},
      headers:{Prefer:"return=representation"}
    });
    if(!rows?.length){
       const latest=await this.fetchState();
       this.revision=latest.revision;
       this.pending=mergeStores(latest.document,mergeStores(snapshot,this.pending||{}));
       continue;
    }
    this.revision=nextRevision;
    const next=this.pending?mergeStores(snapshot,this.pending):snapshot;
    writeJSON(cacheKey(this.workspace),next);
    if(!this.pending)this.tell("online","Sincronizado com a nuvem.");
   }
   if(this.pending)this.tell("pending","Houve alterações concorrentes. Nova tentativa de sincronização será feita.");
  }catch(e){
   this.tell("error",e.message||"Não foi possível sincronizar.");
  }finally{
   this.writing=false;
   if(this.pending){
    clearTimeout(this.syncTimer);
    this.syncTimer=setTimeout(()=>this.flush().catch(()=>{}),4000);
   }
  }
 }
 startPolling(){
  clearInterval(this.pollTimer);
  this.pollTimer=setInterval(()=>this.pull().catch(()=>{}),30000);
 }
 async pull(){
  if(!this.signedIn||!this.workspace||this.writing||this.pending||document.hidden)return;
  const latest=await this.fetchState();
  if(latest.revision!==this.revision){
   this.revision=latest.revision;
   const local=readJSON(cacheKey(this.workspace));
   const merged=local?mergeStores(latest.document,local):latest.document;
   this.onData(merged);
   if(local&&JSON.stringify(merged)!==JSON.stringify(latest.document))this.queue(merged);
   else writeJSON(cacheKey(this.workspace),merged);
   this.tell("online","Dados atualizados de outro dispositivo.");
  }
 }
 async invite(){
  if(this.role!=="owner"||!this.workspace)throw new Error("Somente o responsável pode convidar outra pessoa.");
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  const code=Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(code))),x=>x.toString(16).padStart(2,"0")).join("");
  await this.authorized("/rest/v1/forma_invites",{method:"POST",body:{token_hash:hash,workspace_id:this.workspace,created_by:this.user.id},headers:{Prefer:"return=minimal"}});
  return code;
 }
 async join(code){
  if(!this.signedIn)throw new Error("Entre na sua conta antes de usar um convite.");
  const workspace=await this.authorized("/rest/v1/rpc/forma_accept_invite",{method:"POST",body:{invite_token:code.trim()}});
  await this.listWorkspaces();
  await this.selectWorkspace(workspace);
  return workspace;
 }
}
