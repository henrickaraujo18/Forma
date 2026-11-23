import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
 testDir:"./e2e",testMatch:"*.spec.mjs",fullyParallel:false,
 use:{baseURL:"http://127.0.0.1:8765",headless:true,trace:"retain-on-failure",screenshot:"only-on-failure"},
 webServer:{command:"python3 -m http.server 8765 --bind 127.0.0.1",url:"http://127.0.0.1:8765",reuseExistingServer:false,timeout:30000},
 retries:0,timeout:25000,reporter:"list",
 projects:[{name:"chromium",use:{...devices["Desktop Chrome"],viewport:{width:1280,height:800}}}]
});