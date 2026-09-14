/* The many-into-one assign is new plumbing. Drive it: place a device,
   check it leaves the tray and appears in the slot, take it back out. */
import http from "node:http"; import { readFile } from "node:fs/promises"; import path from "node:path";
const ROOT="/home/user/rafikiscyent888/under-the-hood-labs";
const MIME={".html":"text/html",".js":"text/javascript",".css":"text/css"};
const srv=http.createServer(async(rq,rs)=>{try{const f=path.join(ROOT,decodeURIComponent(rq.url.split("?")[0]));const b=await readFile(f);rs.writeHead(200,{"content-type":MIME[path.extname(f)]||"application/octet-stream"});rs.end(b);}catch{rs.writeHead(404);rs.end("no");}});
await new Promise(r=>srv.listen(0,r)); const PORT=srv.address().port;
const {chromium}=await import("/opt/node22/lib/node_modules/playwright/index.mjs");
const br=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--headless=new","--use-gl=swiftshader","--enable-unsafe-swiftshader"]});
const p=await br.newPage({viewport:{width:1200,height:1400}});
await p.goto(`http://127.0.0.1:${PORT}/verify/preview-power-chain.html?seed=1`,{waitUntil:"networkidle"});
await p.waitForTimeout(800);
const trouble=[];
const count=()=>p.evaluate(()=>({tray:document.querySelectorAll(".tray .chip").length,
  inSlots:document.querySelectorAll(".slot-items .chip").length,
  slots:document.querySelectorAll(".slot-multi").length}));
let c=await count();
if(c.slots!==3) trouble.push(`expected 3 multi-slots, found ${c.slots}`);
if(c.tray!==9) trouble.push(`expected 9 chips in the tray, found ${c.tray}`);
/* hold a device, drop it on the first source */
await p.evaluate(()=>{document.querySelectorAll(".tray .chip")[0].click();
  document.querySelectorAll(".slot-head")[0].click();});
await p.waitForTimeout(200);
c=await count();
if(c.tray!==8) trouble.push(`after one placement the tray has ${c.tray}, expected 8`);
if(c.inSlots!==1) trouble.push(`after one placement the slots hold ${c.inSlots}, expected 1`);
/* put three more on the SAME source — this is the thing the old asker could not do */
for(let i=0;i<3;i++){
  await p.evaluate(()=>{document.querySelectorAll(".tray .chip")[0].click();
    document.querySelectorAll(".slot-head")[0].click();});
  await p.waitForTimeout(120);
}
c=await count();
if(c.inSlots!==4) trouble.push(`four into one source gave ${c.inSlots}, expected 4`);
/* take one back out */
await p.evaluate(()=>document.querySelectorAll(".slot-items .chip")[0].click());
await p.waitForTimeout(200);
c=await count();
if(c.inSlots!==3) trouble.push(`taking one back left ${c.inSlots} in slots, expected 3`);
if(c.tray!==6) trouble.push(`taking one back left ${c.tray} in the tray, expected 6`);
await br.close(); srv.close();
if(trouble.length){trouble.forEach(t=>console.log("  "+t));console.log(`\n${trouble.length} problems`);process.exit(1);}
console.log("many-into-one assign: places, stacks four on one source, and gives them back");
