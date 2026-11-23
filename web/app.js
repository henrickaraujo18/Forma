import {STARTER_ROUTINES} from "./data.js";
import {load,save,id,today,dateAt,dateAt as _dateAt,num,fmt,esc,niceDate,attr,sorted,download,csvSessions,csvMeasurements,validateImport,statsSession,completedSets} from "./core.js";
import {NAV,navigation,mobileNav,view,bodyModal,cardioModal,detailRoutine,sessionDetail,editRoutineModal,exerciseModal,seriesEditRow,confirmModal} from "./ui.js";
let store=load();
let current="henrick";try{current=localStorage.getItem("forma.currentProfile")||"henrick";}catch{}
if(!store.profiles.some(x=>x.id===current))current=store.profiles[0]?.id||"henrick";
let ui={page:store.active&&store.active.profile===current?"session":"dashboard",bodyMetric:"weight",exerciseMetric:"load",exerciseId:"",weekOffset:0};
let pendingImport=null,deferredInstall=null,lastToast=0,toastTimer=0;
const $=id=>document.getElementById(id);
function profile(){return store.profiles.find(x=>x.id===current)||store.profiles[0]}
function commit(){if(!save(store))notify("Armazenamento cheio ou indisponível. Faça um backup e libere espaço.");}
function notify(message){const t=$("toast");t.textContent=message;t.classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("visible"),3400);}
function navigate(page){ui.page=page;render();window.scrollTo({top:0,behavior:"instant"});}
function render(){
 const p=profile();if(!p)return;
 document.documentElement.style.setProperty("--lime",p.accent||"#b0ef60");
 $("active-avatar").textContent=(p.name||"F").slice(0,1).toUpperCase();
 $("active-avatar").style.background=p.accent||"#b0ef60";
 $("profile-select").innerHTML=store.profiles.map(x=>`<option value="${attr(x.id)}" ${x.id===current?"selected":""}>${esc(x.name)}</option>`).join("");
 $("today").textContent=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
 const pageName=NAV.find(x=>x[0]===ui.page)?.[1]||"Treino em andamento";
 $("page-name").textContent=pageName;
 $("side-nav").innerHTML=navigation(ui.page);
 $("mobile-nav").innerHTML=mobileNav(ui.page);
 $("view").innerHTML=view(store,p,ui);
 document.title=pageName+" · Forma Fitness";
 tickTimer();
}
function openModal(markup,large=false){
 const modal=$("modal");modal.innerHTML=markup;modal.className="modal"+(large?" large":"");
 $("modal-backdrop").hidden=false;
 const first=modal.querySelector("input:not([type=hidden]),select,button");
 if(first)requestAnimationFrame(()=>first.focus());
}
function closeModal(){$("modal-backdrop").hidden=true;$("modal").innerHTML="";}
function findRoutine(rid){return (store.routines[current]||[]).find(x=>x.id===rid)}
function start(rid){
 const p=profile(),r=findRoutine(rid);
 if(!r){notify("Rotina não encontrada.");return;}
 if(store.active){
  if(store.active.profile===current){closeModal();navigate("session");notify("Sessão em andamento recuperada.");}
  else notify("Existe um treino em andamento no outro perfil. Finalize ou descarte antes de iniciar outro.");
  return;
 }
 const previous=sorted(store.sessions.filter(x=>x.profile===current&&x.routineId===r.id),"date")[0];
 const exercises=JSON.parse(JSON.stringify(r.exercises)).map((e,i)=>({
  ...e,sets:e.sets.map((set,j)=>{
   const prior=previous?.exercises?.[i]?.sets?.[j];
   return {...set,weight:prior?.done?String(prior.weight??""):"",reps:"",rpe:"",done:false};
  })
 }));
 store.active={id:id(),profile:current,routineId:r.id,routineName:r.name,startedAt:new Date().toISOString(),date:today(),exercises,notes:"",restUntil:null};
 commit();closeModal();navigate("session");notify("Treino iniciado. As cargas anteriores foram sugeridas quando disponíveis.");
}
function discard(){
 store.active=null;commit();closeModal();navigate("train");notify("Sessão descartada.");
}
function finishModal(){
 const s=store.active;if(!s)return;
 const n=completedSets(s).length;if(!n){notify("Conclua pelo menos uma série antes de salvar.");return;}
 openModal(`<h2>Finalizar ${esc(s.routineName)}</h2><p>${n} séries foram concluídas. Uma sessão parcial também pode ser salva.</p>
 <form id="finish-form"><div class="form-grid"><label class="field">Esforço da sessão (1-10)<input type="number" name="sessionRpe" min="1" max="10" step="1" placeholder="Opcional"></label><label class="field">Data do treino<input type="date" name="date" value="${attr(s.date)}" required></label></div>
 <label class="field" style="margin-top:13px">Resumo do treino<textarea name="notes">${esc(s.notes||"")}</textarea></label>
 <footer><button class="btn ghost" data-action="closeModal" type="button">Cancelar</button><button type="submit" class="btn primary">✓ Salvar treino</button></footer></form>`);
}
function finish(form){
 const s=store.active;if(!s)return;const data=Object.fromEntries(new FormData(form));
 s.finishedAt=new Date().toISOString();s.date=data.date||today();s.sessionRpe=data.sessionRpe||"";s.notes=data.notes||"";
 delete s.restUntil;store.sessions.push(s);store.active=null;commit();closeModal();navigate("dashboard");notify("Treino salvo com sucesso. Seu histórico foi atualizado.");
}
function startTimer(seconds){
 if(!store.active||!store.preferences.autoTimer||seconds<=0)return;
 store.active.restUntil=Date.now()+seconds*1000;commit();tickTimer();
}
function stopTimer(){if(store.active){store.active.restUntil=null;commit();}tickTimer();}
function tickTimer(){
 const s=store.active,until=s?.restUntil;
 if(!until){$("timer-banner").hidden=true;return;}
 const seconds=Math.max(0,Math.ceil((until-Date.now())/1000));
 if(!seconds){$("timer-banner").hidden=true;s.restUntil=null;commit();return;}
 $("timer-banner").hidden=false;
 $("timer-label").textContent=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
}
setInterval(tickTimer,1000);
function editActiveSet(target,isDone=false){
 const s=store.active;if(!s||s.profile!==current)return;
 const exIndex=Number(target.dataset.ex),setIndex=Number(target.dataset.set),ex=s.exercises[exIndex],z=ex?.sets?.[setIndex];if(!z)return;
 if(isDone){
  const next=target.checked;
  if(next&&(!Number.isFinite(num(z.reps))||num(z.reps)<=0)){target.checked=false;notify("Informe as repetições executadas antes de concluir a série.");return;}
  z.done=next;
  if(next)startTimer(ex.rest||120);
  commit();render();
 }else{
  const key=target.dataset.sessionField;
  if(!["weight","reps","rpe"].includes(key))return;
  const v=target.value;
  if(v!==""&&((num(v)==null)||(num(v)<0)||(key==="rpe"&&num(v)>10)||(key==="reps"&&num(v)%1!==0))){notify("Informe um valor numérico válido.");target.value=z[key]||"";return;}
  z[key]=v;commit();
 }
}
function routineEditor(rid){const r=findRoutine(rid);if(r)openModal(editRoutineModal(r),true);}
function exerciseEditor(rid,index){
 const r=findRoutine(rid);if(!r)return;
 const ex=index==null?null:r.exercises[Number(index)];
 openModal(exerciseModal(r,ex,index),true);
}
function createRoutine(){
 openModal(`<h2>Criar rotina</h2><p>Monte uma nova divisão e acrescente os exercícios prescritos.</p><form id="create-routine-form"><div class="form-grid"><label class="field">Nome<input name="name" required maxlength="80" placeholder="Treino extra"></label><label class="field">Descrição<input name="subtitle" maxlength="150" placeholder="Grupos musculares"></label></div><footer><button class="btn ghost" type="button" data-action="closeModal">Cancelar</button><button class="btn primary" type="submit">Criar rotina</button></footer></form>`);
}
function formValues(form){
 const obj=Object.fromEntries(new FormData(form));
 for(const [k,v] of Object.entries(obj))if(typeof v==="string")obj[k]=v.trim();
 return obj;
}
function storeBody(data,existingId=""){
 if(!data.date||Number.isNaN(dateAt(data.date).getTime())){notify("Informe uma data válida.");return false;}
 for(const k of ["weight","fat","waist","hip","chest","arm","thigh","calf","restHr","sleep"]){
  if(data[k]!==""&&data[k]!=null&&(num(data[k])==null||num(data[k])<0)){notify("Verifique o campo "+k);return false;}
 }
 if(data.fat!==""&&data.fat!=null&&num(data.fat)>100){notify("Percentual de gordura inválido.");return false;}
 if(existingId){const i=store.measurements.findIndex(x=>x.id===existingId&&x.profile===current);if(i>=0)store.measurements[i]={...store.measurements[i],...data};}
 else store.measurements.push({...data,id:id(),profile:current,createdAt:new Date().toISOString()});
 commit();closeModal();render();notify("Avaliação corporal salva.");return true;
}
function storeCardio(data,existingId=""){
 if(!data.date||num(data.minutes)==null||num(data.minutes)<=0){notify("Informe data e duração válida.");return false;}
 if(data.rpe&&((num(data.rpe)||0)>10||(num(data.rpe)||0)<1)){notify("Esforço deve ser entre 1 e 10.");return false;}
 if(existingId){const i=store.cardio.findIndex(x=>x.id===existingId&&x.profile===current);if(i>=0)store.cardio[i]={...store.cardio[i],...data};}
 else store.cardio.push({...data,id:id(),profile:current,createdAt:new Date().toISOString()});
 commit();closeModal();render();notify("Cardio registrado.");return true;
}
function submitExercise(form){
 const r=findRoutine(form.dataset.routine);if(!r)return;
 const vals=formValues(form);if(!vals.name){notify("Informe um nome de exercício.");return;}
 const items=Array.from(form.querySelectorAll("[data-edit-set]")).map(row=>({
  type:row.querySelector('[name="setType"]').value,
  target:row.querySelector('[name="setTarget"]').value.trim()||"8-12",
  weight:"",reps:"",rpe:"",done:false
 }));
 if(!items.length){notify("Adicione pelo menos uma série.");return;}
 const obj={id:vals.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),name:vals.name,muscle:vals.muscle,rest:Math.round(num(vals.rest)||120),notes:vals.notes||"",sets:items};
 const index=form.dataset.ex;if(index!=="")r.exercises[Number(index)]=obj;else r.exercises.push(obj);
 commit();routineEditor(r.id);notify("Exercício atualizado para os próximos treinos.");
}
function confirmAction(action,button){
 const x=button?.dataset.id,rid=button?.dataset.routine,ex=button?.dataset.ex;
 switch(action){
 case "discard":discard();return;
 case "deleteSession":store.sessions=store.sessions.filter(s=>!(s.id===x&&s.profile===current));break;
 case "deleteBody":store.measurements=store.measurements.filter(s=>!(s.id===x&&s.profile===current));break;
 case "deleteCardio":store.cardio=store.cardio.filter(s=>!(s.id===x&&s.profile===current));break;
 case "deleteRoutine":store.routines[current]=store.routines[current].filter(r=>r.id!==rid);break;
 case "deleteExercise":{const r=findRoutine(rid);if(r)r.exercises.splice(Number(ex),1);break;}
 case "erase":localStorage.removeItem("forma.fitness.v1");store=load();current="henrick";localStorage.setItem("forma.currentProfile",current);navigate("dashboard");closeModal();notify("Os dados locais foram apagados.");return;
 case "restore":if(!pendingImport){notify("Nenhum backup para restaurar.");return;}store=validateImport(pendingImport);pendingImport=null;current=store.profiles[0]?.id||"henrick";localStorage.setItem("forma.currentProfile",current);break;
 default:return;
 }
 commit();closeModal();render();notify("Operação concluída.");
}
function handleAction(b){
 const action=b.dataset.action;
 switch(action){
 case "navigate":navigate(b.dataset.page||"dashboard");return;
 case "start":start(b.dataset.routine);return;
 case "resume":navigate("session");return;
 case "closeModal":closeModal();return;
 case "routineDetail":{const r=findRoutine(b.dataset.routine);if(r)openModal(detailRoutine(r),true);return;}
 case "discardSession":openModal(confirmModal("Descartar sessão?","Todas as séries deste treino em andamento serão perdidas. Sessões anteriores não são afetadas.","discard"));return;
 case "finishSession":finishModal();return;
 case "cardioModal":openModal(cardioModal());return;
 case "editCardio":{const x=store.cardio.find(z=>z.id===b.dataset.id&&z.profile===current);if(x)openModal(cardioModal(x));return;}
 case "editBody":{const x=store.measurements.find(z=>z.id===b.dataset.id&&z.profile===current);if(x)openModal(bodyModal(x));return;}
 case "addSet":{const e=store.active?.exercises?.[Number(b.dataset.ex)];if(e){const z=e.sets.at(-1)||{type:"Trabalho",target:"8-12"};e.sets.push({...z,reps:"",rpe:"",done:false});commit();render();}return;}
 case "bodyMetric":ui.bodyMetric=b.dataset.metric;render();return;
 case "exerciseMetric":ui.exerciseMetric=b.dataset.metric;render();return;
 case "weekPrev":ui.weekOffset--;render();return;
 case "weekNext":ui.weekOffset++;render();return;
 case "weekToday":ui.weekOffset=0;render();return;
 case "createRoutine":createRoutine();return;
 case "editRoutine":routineEditor(b.dataset.routine);return;
 case "editExercise":exerciseEditor(b.dataset.routine,b.dataset.ex);return;
 case "addExercise":exerciseEditor(b.dataset.routine,null);return;
 case "addExerciseSet":$("edit-exercise-sets")?.insertAdjacentHTML("beforeend",seriesEditRow({type:"Trabalho",target:"8-12"},0));return;
 case "removeExerciseSet":b.closest("[data-edit-set]")?.remove();return;
 case "deleteSession":openModal(confirmModal("Excluir treino?","O histórico e as métricas referentes a esta sessão serão removidos.","deleteSession",'data-id="'+attr(b.dataset.id)+'"'));return;
 case "deleteBody":openModal(confirmModal("Excluir avaliação?","A medição será removida dos gráficos e do histórico.","deleteBody",'data-id="'+attr(b.dataset.id)+'"'));return;
 case "deleteCardio":openModal(confirmModal("Excluir cardio?","Esta atividade será removida do histórico.","deleteCardio",'data-id="'+attr(b.dataset.id)+'"'));return;
 case "deleteRoutine":openModal(confirmModal("Excluir rotina?","A ficha personalizada será removida. Treinos já realizados serão preservados.","deleteRoutine",'data-routine="'+attr(b.dataset.routine)+'"'));return;
 case "deleteExercise":openModal(confirmModal("Excluir exercício?","O exercício será removido da rotina, sem alterar sessões anteriores.","deleteExercise",'data-routine="'+attr(b.dataset.routine)+'" data-ex="'+attr(b.dataset.ex)+'"'));return;
 case "eraseData":openModal(confirmModal("Apagar TODOS os dados?","Isso apaga os dois perfis, todas as sessões, avaliações e ajustes locais. Faça um backup antes.","erase"));return;
 case "confirm":confirmAction(b.dataset.confirm,b);return;
 case "sessionDetail":{const s=store.sessions.find(z=>z.id===b.dataset.id&&z.profile===current);if(s)openModal(sessionDetail(s),true);return;}
 case "backup":download("forma-fitness-backup-"+today()+".json",JSON.stringify({...store,exportedAt:new Date().toISOString()},null,2),"application/json");notify("Backup completo gerado.");return;
 case "csvSessions":download("forma-series-"+current+"-"+today()+".csv",csvSessions(store,current),"text/csv;charset=utf-8");notify("CSV de séries gerado.");return;
 case "csvBody":download("forma-corpo-"+current+"-"+today()+".csv",csvMeasurements(store,current),"text/csv;charset=utf-8");notify("CSV de avaliações gerado.");return;
 }
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(b){e.preventDefault();handleAction(b);}else if(e.target===$("modal-backdrop"))closeModal();});
document.addEventListener("change",e=>{
 const t=e.target;
 if(t.id==="profile-select"){current=t.value;localStorage.setItem("forma.currentProfile",current);ui.page="dashboard";ui.exerciseId="";render();return;}
 if(t.id==="exercise-select"){ui.exerciseId=t.value;render();return;}
 if(t.dataset.pref){store.preferences[t.dataset.pref]=t.checked;commit();return;}
 if(t.dataset.sessionField){editActiveSet(t);return;}
 if(t.dataset.sessionDone){editActiveSet(t,true);return;}
 if(t.id==="import-file"){const f=t.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{pendingImport=validateImport(JSON.parse(reader.result));openModal(confirmModal("Restaurar backup?","O arquivo substituirá os dados deste navegador. Esta operação não poderá ser desfeita sem outro backup.","restore"));}catch(err){notify("Não foi possível importar: "+err.message);}t.value="";};reader.readAsText(f);return;}
});
document.addEventListener("input",e=>{
 const t=e.target;
 if(t.dataset.sessionNote&&store.active){store.active.notes=t.value;commit();}
});
document.addEventListener("submit",e=>{
 const form=e.target;
 if(!form.id)return;
 e.preventDefault();const data=formValues(form);
 switch(form.id){
 case "profile-form":{const p=profile();if(!data.name){notify("Informe seu nome.");return;}if(data.height&&(!num(data.height)||num(data.height)>260||num(data.height)<80)){notify("Altura inválida. Informe em centímetros.");return;}p.name=data.name;p.height=data.height;p.goal=data.goal;commit();render();notify("Perfil atualizado.");return;}
 case "body-form":storeBody(data);form.reset();return;
 case "edit-body-form":storeBody(data,form.dataset.id);return;
 case "cardio-form":storeCardio(data,form.dataset.id);return;
 case "finish-form":finish(form);return;
 case "create-routine-form":{const r={id:id(),name:data.name,subtitle:data.subtitle||"Personalizada",source:"CRIADA NO FORMA",exercises:[]};if(!data.name){notify("Informe o nome da rotina.");return;}store.routines[current].push(r);commit();exerciseEditor(r.id,null);notify("Rotina criada. Adicione exercícios.");return;}
 case "edit-routine-form":{const r=findRoutine(form.dataset.routine);if(r){r.name=data.name;r.subtitle=data.subtitle;commit();routineEditor(r.id);notify("Rotina atualizada.");}return;}
 case "exercise-form":submitExercise(form);return;
 }
});
$("timer-dismiss").addEventListener("click",stopTimer);
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("install-button").hidden=false;});
$("install-button").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("install-button").hidden=true;});
window.addEventListener("appinstalled",()=>notify("Forma instalado neste dispositivo."));
if("serviceWorker" in navigator&&location.protocol==="https:"){
 let reloading=false;
 navigator.serviceWorker.addEventListener("controllerchange",()=>{
   if(!reloading){reloading=true;location.reload();}
 });
 navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"})
  .then(reg=>reg.update().catch(()=>{}))
  .catch(e=>console.warn("Offline indisponível",e));
}
render();
