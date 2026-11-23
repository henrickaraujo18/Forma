import {test,expect} from "@playwright/test";
test.beforeEach(async({page})=>{
 await page.goto("/",{waitUntil:"networkidle"});
 const gate=page.locator("#auth-gate");
 if(await gate.isVisible())await page.locator("#offline-button").click();
});
test("todos os exercícios da sessão exibem demonstrações e zoom funciona",async({page})=>{
 await page.locator("#side-nav button[data-page=train]").click();
 await page.locator(".routine-card").first().locator('[data-action="start"]').click();
 const cards=page.locator(".exercise-card");
 await expect(cards).toHaveCount(8);
 await expect(cards.locator(".exercise-demo")).toHaveCount(8);
 await expect(cards.first().locator(".demo-animation")).toBeVisible();
 await cards.first().locator('[data-action="watchDemo"]').click();
 await expect(page.locator("#modal-backdrop")).toBeVisible();
 await expect(page.locator("#modal h2")).toContainText("Crucifixo inclinado");
 await expect(page.locator("#modal .demo-large")).toBeVisible();
 await page.locator("#modal [data-action=closeModal]").click();
 await expect(page.locator("#modal-backdrop")).toBeHidden();
});
test("vídeos MP4 têm loading preguiçoso e controles em janela ampliada",async({page})=>{
 await page.locator("#side-nav button[data-page=train]").click();
 await page.locator(".routine-card").nth(1).locator('[data-action="start"]').click();
 await expect(page.locator(".exercise-card")).toHaveCount(6);
 const player=page.locator(".exercise-card").nth(2).locator("video.demo-video");
 await expect(player).toHaveAttribute("data-demo-src",/bent-over-row\.mp4$/);
 await page.locator(".exercise-card").nth(2).locator('[data-action="watchDemo"]').click();
 await expect(page.locator("#modal video")).toHaveAttribute("controls","");
 await expect(page.locator("#modal .demo-counter")).toContainText("VÍDEO");
});
test("gráficos SVG exibem classes de movimento após registros",async({page})=>{
 await page.locator("#side-nav button[data-page=body]").click();
 await page.locator('#body-form [name=weight]').fill("90");
 await page.locator('#body-form button[type=submit]').click();
 await expect(page.locator(".chart-dot")).toHaveCount(1);
 await page.locator('#body-form [name=weight]').fill("89");
 await page.locator('#body-form button[type=submit]').click();
 await expect(page.locator(".chart-trace")).toBeVisible();
 await expect(page.locator(".chart-dot")).toHaveCount(2);
});
test("acessibilidade: respeita preferencia por movimento reduzido",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.locator("#side-nav button[data-page=train]").click();
 await page.locator(".routine-card").first().locator('[data-action=start]').click();
 const first=page.locator(".demo-first").first();
 await expect(first).toBeVisible();
 const motion=await first.evaluate(el=>getComputedStyle(el).animationDuration);
 expect(["0.000001s","1e-06s","0s"]).toContain(motion);
});
