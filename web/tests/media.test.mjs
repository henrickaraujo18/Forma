import test from "node:test";
import assert from "node:assert/strict";
import {STARTER_ROUTINES} from "../data.js";
import {MEDIA_MAP,demoFor,mediaCount,validVideoUrl} from "../media.js";
import {demoMarkup,lineChart,barChart} from "../ui.js";

const all=Object.values(STARTER_ROUTINES).flat().flatMap(r=>r.exercises);
const unique=[...new Map(all.map(e=>[e.name,e])).values()];

test("todos os 44 exercícios das duas fichas têm demonstração audiovisual distinta",()=>{
 assert.equal(unique.length,44);
 assert.equal(Object.keys(MEDIA_MAP).length,44);
 for(const ex of unique){
  const m=demoFor(ex);
  assert.ok(m,"Sem demonstração: "+ex.name);
  assert.equal(m.duration,8,"Duração diferente: "+ex.name);
  assert.match(m.src||m.start,/^https:\/\//,"Endereço inseguro: "+ex.name);
  if(m.type==="motion"){
   assert.equal(m.end,m.start.replace("/start.webp","/end.webp"));
   assert.equal(m.source,"https://github.com/MarvinNazari/exercise-images");
  }else{
   assert.match(m.src,/\.mp4$/);
   assert.equal(m.source,"https://github.com/namnq/workout-free-videos");
  }
 }
});
test("contagens de clipes reais e animações consistentes",()=>{
 assert.deepEqual(mediaCount(),{total:44,videos:12,animations:32});
});
test("não confunde uma variação com a prescrição exata",()=>{
 const ex=unique.find(e=>e.name==="Panturrilha unilateral no leg press");
 const m=demoFor(ex);assert.match(m.variant,/bilateral/);
 assert.match(demoMarkup(ex),/VARIAÇÃO/);
});
test("a demonstração é renderizada e interativa para todo exercício",()=>{
 for(const e of unique){
  const html=demoMarkup(e);
  assert.match(html,/exercise-demo/);
  assert.match(html,/watchDemo/);
  assert.match(html,/data-demo-name=/);
  assert.ok(html.includes(e.name.replace(/&/g,"&amp;")),"Exercício não identificado: "+e.name);
 }
});
test("editor de vídeos aceita somente mídia HTTPS .mp4 ou .webm",()=>{
 assert.ok(validVideoUrl("https://media.exemplo.com/video.mp4"));
 assert.ok(validVideoUrl("https://media.exemplo.com/video.webm?token=abc"));
 assert.equal(validVideoUrl("javascript:alert(1)"),false);
 assert.equal(validVideoUrl("http://inseguro.exemplo.com/video.mp4"),false);
 assert.equal(validVideoUrl("https://exemplo.com/invalido.svg"),false);
 const ex={name:"Teste Personalizado",videoUrl:"https://exemplo.com/video.mp4"};
 assert.equal(demoFor(ex).type,"video");
});
test("linhas e barras dos gráficos contêm parâmetros de animação",()=>{
 assert.match(lineChart([{value:1,label:"A"},{value:2,label:"B"}]),/chart-trace/);
 assert.match(lineChart([{value:1,label:"A"}]),/chart-dot/);
 assert.match(barChart([{count:1,label:"A"},{count:2,label:"B"}],"count"),/--bar-index/);
});
