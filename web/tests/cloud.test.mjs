import test from "node:test";
import assert from "node:assert/strict";
import {mergeStores} from "../cloud.js";
import {CLOUD_CONFIG} from "../cloud-config.js";
const payload=(o={})=>({version:1,profiles:[{id:"henrick",name:"Henrick"},{id:"cecilia",name:"Cecília"}],
 routines:{henrick:[],cecilia:[]},sessions:[],measurements:[],cardio:[],activeSessions:{},deleted:{sessions:[],measurements:[],cardio:[]},preferences:{},...o});
test("duas pessoas podem manter sessões em andamento simultaneamente",()=>{
 const a=payload({activeSessions:{henrick:{id:"H",profile:"henrick"}}});
 const b=payload({activeSessions:{cecilia:{id:"C",profile:"cecilia"}}});
 const result=mergeStores(a,b);
 assert.equal(result.activeSessions.henrick.id,"H");
 assert.equal(result.activeSessions.cecilia.id,"C");
});
test("a sincronização une registros sem duplicá-los",()=>{
 const a=payload({sessions:[{id:"1",profile:"henrick"},{id:"3",profile:"cecilia"}]});
 const b=payload({sessions:[{id:"1",profile:"henrick"},{id:"2",profile:"cecilia"}]});
 const result=mergeStores(a,b);
 assert.deepEqual(result.sessions.map(s=>s.id).sort(),["1","2","3"]);
});
test("exclusões impedem ressurgimento de medições antigas",()=>{
 const remote=payload({measurements:[{id:"med1",profile:"henrick",weight:"96"}]});
 const local=payload({deleted:{sessions:[],measurements:["med1"],cardio:[]}});
 assert.equal(mergeStores(remote,local).measurements.length,0);
});
test("chave de frontend é publicável, nunca chave administrativa",()=>{
 assert.ok(CLOUD_CONFIG.publishableKey.startsWith("sb_publishable_"));
 assert.ok(!JSON.stringify(CLOUD_CONFIG).includes("service_role"));
});
