import {STARTER_PROFILES,STARTER_ROUTINES} from "./data.js";
const KEY="forma.fitness.v1";
const clone=x=>JSON.parse(JSON.stringify(x));
export const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
export const dateAt=s=>new Date((s||today()).slice(0,10)+"T12:00:00");
export const id=()=>typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():"f-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
export const num=v=>{if(v==null||String(v).trim()==="")return null;const n=Number(String(v).replace(",","."));return Number.isFinite(n)?n:null};
export const fmt=(n,d=0)=>Number.isFinite(n)?n.toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}):"—";
export const niceDate=(s,opts={day:"2-digit",month:"short"})=>dateAt(s).toLocaleDateString("pt-BR",opts);
export const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const attr=v=>esc(v);
export const cssSafe=v=>String(v||"").replace(/[^#a-z0-9]/gi,"");
const initial=()=>({version:1,profiles:clone(STARTER_PROFILES),routines:clone(STARTER_ROUTINES),sessions:[],measurements:[],cardio:[],active:null,preferences:{autoTimer:true,excludeWarmupFromVolume:true}});
export function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw)return initial();
    const val=JSON.parse(raw);
    if(!val||!Array.isArray(val.profiles)||!Array.isArray(val.sessions))throw new Error("Estrutura inválida");
    const base=initial();
    return {...base,...val,profiles:val.profiles.length?val.profiles:base.profiles,
      routines:{...base.routines,...(val.routines||{})},
      sessions:val.sessions||[],measurements:val.measurements||[],cardio:val.cardio||[],
      preferences:{...base.preferences,...(val.preferences||{})}};
  }catch(e){console.warn("Forma: backup local inválido",e);return initial();}
}
export function save(store){
  try{localStorage.setItem(KEY,JSON.stringify(store));return true;}
  catch(e){console.error(e);return false;}
}
export const sorted=(a,field="date")=>[...a].sort((x,y)=>String(y[field]||"").localeCompare(String(x[field]||"")));
export const sessionsFor=(s,p)=>s.sessions.filter(x=>x.profile===p);
export const measurementsFor=(s,p)=>sorted(s.measurements.filter(x=>x.profile===p));
export const cardioFor=(s,p)=>sorted(s.cardio.filter(x=>x.profile===p));
export const completedSets=session=>session.exercises?.flatMap(e=>(e.sets||[]).filter(s=>s.done).map(s=>({exercise:e,...s})))||[];
export const e1rm=(kg,reps)=>kg>0&&reps>0&&reps<=12?kg*(1+reps/30):null;
export function statsSession(session,excludeWarmup=true){
  let volume=0,sets=0,reps=0,top=0,minutes=0;
  for(const ex of session.exercises||[])for(const set of ex.sets||[]){
    if(!set.done)continue;
    const w=num(set.weight)||0,r=num(set.reps)||0;
    if(!excludeWarmup||["Trabalho","Top"].includes(set.type)){volume+=w*r;sets++;reps+=r;}
    if(set.type==="Top")top++;
  }
  if(session.finishedAt&&session.startedAt)minutes=Math.max(0,Math.round((new Date(session.finishedAt)-new Date(session.startedAt))/60000));
  return {volume,sets,reps,top,minutes};
}
export function latestMeasure(s,p){return measurementsFor(s,p)[0]||null}
export function bmi(weight,height){const w=num(weight),h=num(height);return w&&h&&h>0? w/((h/100)**2):null}
export function leanMass(weight,fat){const w=num(weight),f=num(fat);return w&&f!=null&&f>=0&&f<=100?w*(1-f/100):null}
export function waistHeight(waist,height){const w=num(waist),h=num(height);return w&&h?w/h:null}
export function groupVolume(s,profile){
 const by={};for(const ses of sessionsFor(s,profile))for(const ex of ses.exercises||[])for(const set of ex.sets||[]){
  if(!set.done||!["Trabalho","Top"].includes(set.type))continue;
  const w=num(set.weight)||0,r=num(set.reps)||0;
  by[ex.muscle]=(by[ex.muscle]||0)+w*r;
 }
 return Object.entries(by).sort((a,b)=>b[1]-a[1]);
}
export function weekStart(d){let x=dateAt(d);let day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")}
export function lastWeekData(s,profile,count=8){
 const starts=[];const base=dateAt(weekStart(today()));
 for(let i=count-1;i>=0;i--){const d=new Date(base);d.setDate(d.getDate()-7*i);starts.push(todayFrom(d));}
 const sessions=sessionsFor(s,profile);
 return starts.map(start=>{const arr=sessions.filter(x=>weekStart(x.date)===start);return {date:start,label:niceDate(start),count:arr.length,volume:arr.reduce((a,x)=>a+statsSession(x).volume,0),minutes:arr.reduce((a,x)=>a+statsSession(x).minutes,0)}});
}
export const todayFrom=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
export function records(s,profile){
 const best={};for(const ses of sorted(sessionsFor(s,profile),"date").reverse())for(const ex of ses.exercises||[])for(const set of ex.sets||[]){
  if(!set.done||!["Trabalho","Top"].includes(set.type))continue;
  const w=num(set.weight)||0,r=num(set.reps)||0,v=w*r,rm=e1rm(w,r)||0,k=ex.id||ex.name;
  if(!best[k])best[k]={id:k,name:ex.name,muscle:ex.muscle,load:0,rm:0,volume:0,mostReps:0,date:""};
  const b=best[k];if(w>b.load){b.load=w;b.date=ses.date;}if(rm>b.rm)b.rm=rm;if(v>b.volume)b.volume=v;if(r>b.mostReps)b.mostReps=r;
 }
 return Object.values(best).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
}
export function exerciseProgress(s,profile,exerciseId){
 const result=[];for(const ses of [...sessionsFor(s,profile)].sort((a,b)=>a.date.localeCompare(b.date))) {
   for(const ex of ses.exercises||[])if((ex.id||ex.name)===exerciseId){
     const sets=(ex.sets||[]).filter(z=>z.done&&["Trabalho","Top"].includes(z.type));
     if(!sets.length)continue;
     const loads=sets.map(z=>num(z.weight)||0),reps=sets.map(z=>num(z.reps)||0);
     result.push({date:ses.date,label:niceDate(ses.date),load:Math.max(0,...loads),volume:sets.reduce((a,z)=>a+(num(z.weight)||0)*(num(z.reps)||0),0),rm:Math.max(0,...sets.map(z=>e1rm(num(z.weight)||0,num(z.reps)||0)||0)),reps:reps.reduce((a,b)=>a+b,0)});
   }
 }
 return result;
}
export function recentPRs(s,p){
 const recordsByExercise={};const events=[];
 for(const session of [...sessionsFor(s,p)].sort((a,b)=>a.date.localeCompare(b.date))){
  for(const ex of session.exercises||[]){
   const valid=(ex.sets||[]).filter(z=>z.done&&["Trabalho","Top"].includes(z.type));
   if(!valid.length)continue;
   const max=Math.max(...valid.map(z=>num(z.weight)||0));const key=ex.id||ex.name;
   if(max>0&&max>(recordsByExercise[key]||0)){events.push({date:session.date,name:ex.name,value:max});recordsByExercise[key]=max;}
  }
 }
 return events.reverse();
}
export function bodySeries(s,p,field){
 return [...measurementsFor(s,p)].reverse().filter(x=>num(x[field])!=null).map(x=>({date:x.date,label:niceDate(x.date),value:num(x[field])}));
}
export function hasRecordedDate(s,p,date){return sessionsFor(s,p).some(x=>x.date===date)}
export function csvCell(v){const s=String(v??"");const safe=/^[=+@-]/.test(s)? "'"+s:s;return '"'+safe.replace(/"/g,'""')+'"'}
export function download(filename,content,type){
 const blob=new Blob([content],{type});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
export function csvSessions(store,profile){
 const rows=[["Data","Atleta","Treino","Exercício","Grupo","Série","Tipo","Carga (kg)","Repetições","RPE","Concluída"]];
 for(const s of sessionsFor(store,profile))for(const ex of s.exercises||[])for(const [i,z] of (ex.sets||[]).entries()) rows.push([s.date,s.profile,s.routineName,ex.name,ex.muscle,i+1,z.type,z.weight,z.reps,z.rpe,z.done?"Sim":"Não"]);
 return "\ufeff"+rows.map(row=>row.map(csvCell).join(";")).join("\r\n");
}
export function csvMeasurements(store,profile){
 const cols=["date","weight","fat","waist","hip","chest","arm","thigh","calf","restHr","sleep","notes"];
 const rows=[["Data","Peso (kg)","Gordura (%)","Cintura (cm)","Quadril (cm)","Peito (cm)","Braço (cm)","Coxa (cm)","Panturrilha (cm)","FC repouso (bpm)","Sono (h)","Observações"]];
 for(const x of measurementsFor(store,profile))rows.push(cols.map(k=>x[k]??""));
 return "\ufeff"+rows.map(row=>row.map(csvCell).join(";")).join("\r\n");
}
export function validateImport(x){
 if(!x||typeof x!=="object"||!Array.isArray(x.profiles)||!Array.isArray(x.sessions)||!x.routines||!Array.isArray(x.measurements)||!Array.isArray(x.cardio))throw new Error("Arquivo inválido: estrutura de backup não reconhecida.");
 if(x.sessions.length>200000||x.measurements.length>200000)throw new Error("Arquivo grande demais.");
 return x;
}
