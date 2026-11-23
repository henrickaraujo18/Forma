import {test,expect} from "@playwright/test";
test("login e sincronização exercitam o fluxo de API, sem expor chave administrativa",async({page})=>{
 const uid="11111111-1111-4111-8111-111111111111",wid="22222222-2222-4222-8222-222222222222";
 let workspaceCreated=false,revision=0,cloudDoc=null,patches=0;
 const auth={access_token:"fake-test-jwt",refresh_token:"fake-refresh-token",expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:uid,email:"teste@forma.local"}};
 await page.route("https://rtkygaiajkmvxngaokmy.supabase.co/**",async route=>{
  const req=route.request(),url=new URL(req.url()),method=req.method(),path=url.pathname,body=method==="POST"||method==="PATCH"?req.postDataJSON():null;
  const reply=(data,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(data)});
  if(path==="/auth/v1/token"&&method==="POST")return reply(auth);
  if(path==="/auth/v1/user")return reply(auth.user);
  if(path==="/auth/v1/logout")return reply({});
  if(path==="/rest/v1/forma_members"&&method==="GET")return reply(workspaceCreated?[{workspace_id:wid,role:"owner"}]:[]);
  if(path==="/rest/v1/forma_workspaces"&&method==="POST"){workspaceCreated=true;return reply([{id:wid}],201);}
  if(path==="/rest/v1/forma_members"&&method==="POST")return reply(null,201);
  if(path==="/rest/v1/forma_data"&&method==="POST"){cloudDoc=body.document;revision=body.revision;return reply(null,201);}
  if(path==="/rest/v1/forma_data"&&method==="GET")return reply([{document:cloudDoc,revision}]);
  if(path==="/rest/v1/forma_data"&&method==="PATCH"){
   if(url.searchParams.get("revision")!=="eq."+revision)return reply([]);
   patches++;cloudDoc=body.document;revision=body.revision;return reply([{revision}]);
  }
  throw new Error("Chamada inesperada: "+method+" "+url.pathname);
 });
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/",{waitUntil:"networkidle"});
 await expect(page.locator("#auth-gate")).toBeVisible();
 await page.locator('#auth-form [name=email]').fill("teste@forma.local");
 await page.locator('#auth-form [name=password]').fill("senha-teste-12345");
 await page.locator('#auth-submit').click();
 await expect(page.locator("#auth-gate")).toBeHidden();
 await expect(page.locator("#cloud-indicator")).toContainText("Sincronizado");
 await page.locator("#side-nav button[data-page=body]").click();
 await page.locator('#body-form [name=weight]').fill("96");
 await page.locator('#body-form button[type=submit]').click();
 await expect.poll(()=>patches,{timeout:10000}).toBeGreaterThan(0);
 expect(cloudDoc.measurements).toHaveLength(1);
 expect(cloudDoc.measurements[0].weight).toBe("96");
 expect(errors).toEqual([]);
});
