import test from "node:test";
import assert from "node:assert/strict";
import {STARTER_PROFILES,STARTER_ROUTINES} from "../data.js";
import {view} from "../ui.js";
const athlete=STARTER_PROFILES[0],snapshot=()=>({
 profiles:STARTER_PROFILES,routines:STARTER_ROUTINES,sessions:[],measurements:[],cardio:[],
 active:null,preferences:{autoTimer:true,excludeWarmupFromVolume:true}
});
for(const page of ["dashboard","train","body","analytics","history","plan","settings"]){
 test("tela "+page+" renderiza sem exceção",()=>{
  const output=view(snapshot(),athlete,{page,weekOffset:0,bodyMetric:"weight",exerciseMetric:"load"});
  assert.ok(output.length>100);
  assert.ok(!output.includes("undefined</"));
 });
}
test("tela de sessão renderiza séries dos PDFs",()=>{
 const store=snapshot();store.active={profile:"henrick",id:"t1",routineId:"h-a",routineName:"Treino A",date:"2026-11-23",startedAt:"2026-11-23T12:00:00",notes:"",exercises:structuredClone(STARTER_ROUTINES.henrick[0].exercises)};
 const html=view(store,athlete,{page:"session"});
 assert.ok(html.includes('data-session-field="weight"'));
 assert.ok(html.includes("Supino reto"));
 assert.ok(html.includes("Tríceps francês"));
});
