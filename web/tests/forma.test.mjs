import test from "node:test";
import assert from "node:assert/strict";
import {STARTER_PROFILES,STARTER_ROUTINES,CARDIO_GUIDANCE} from "../data.js";
import {e1rm,bmi,statsSession,weekStart,fmt,num,validateImport} from "../core.js";
test("duas fichas independentes e nove divisões",()=>{
 assert.equal(STARTER_PROFILES.length,2);
 assert.equal(STARTER_ROUTINES.henrick.length,5);
 assert.equal(STARTER_ROUTINES.cecilia.length,4);
 assert.equal(STARTER_ROUTINES.henrick[0].exercises.length,8);
 assert.equal(STARTER_ROUTINES.cecilia[0].exercises.length,8);
});
test("preserva protocolos warm-up, feeder, working e top",()=>{
 const supino=STARTER_ROUTINES.henrick[0].exercises.find(e=>e.name==="Supino reto");
 assert.deepEqual(supino.sets.map(x=>x.type),["Aquecimento","Feeder","Trabalho","Trabalho","Top"]);
 assert.equal(supino.sets[2].target,"6-8");
 const mesa=STARTER_ROUTINES.cecilia[1].exercises[0];
 assert.equal(mesa.sets.filter(x=>x.type==="Top").length,1);
});
test("métricas não inventam peso, calculam IMC e 1RM",()=>{
 assert.equal(bmi(80,180).toFixed(1),"24.7");
 assert.equal(bmi("",180),null);
 assert.equal(e1rm(100,6),120);
 assert.equal(e1rm(100,13),null);
});
test("tonelagem exclui aquecimento e feeder",()=>{
 const routine=STARTER_ROUTINES.henrick[0].exercises[1];
 const session={exercises:[{...routine,sets:routine.sets.map((s,i)=>({...s,done:true,weight:i<2?20:50,reps:8}))}]};
 assert.equal(statsSession(session).volume,1200);
});
test("fronteira da semana inicia segunda e números pt-BR",()=>{
 assert.equal(weekStart("2026-11-23"),"2026-11-23");
 assert.equal(weekStart("2026-11-29"),"2026-11-23");
 assert.equal(fmt(1234,1),"1.234,0");
 assert.equal(num("97,5"),97.5);
});
