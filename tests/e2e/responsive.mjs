// Horizontal-overflow audit: no page may scroll sideways at any supported
// width. Catches fixed-column grids and nav bars that outgrow the viewport.
//
//   npm run test:responsive        (needs the dev server running)
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const BASE=process.env.BASE_URL||'http://localhost:4321';const PORT=9350;
const prof=mkdtempSync(join(tmpdir(),'r-'));
const ch=spawn('google-chrome',['--headless=new','--disable-gpu','--no-sandbox',`--remote-debugging-port=${PORT}`,`--user-data-dir=${prof}`,'about:blank'],{stdio:'ignore'});
const clean=()=>{ch.kill();try{rmSync(prof,{recursive:true,force:true})}catch{}};process.on('exit',clean);
const wait=async(f,l)=>{for(let i=0;i<60;i++){try{return await f()}catch{await new Promise(r=>setTimeout(r,500))}}throw new Error(l)};
await wait(()=>fetch(`http://127.0.0.1:${PORT}/json/version`).then(r=>r.ok||Promise.reject()),'chrome');
const t=await(await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r));
let id=0;const p=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&p.has(m.id)){p.get(m.id)(m);p.delete(m.id)}});
const send=(m,params={})=>new Promise(res=>{const n=++id;p.set(n,res);ws.send(JSON.stringify({id:n,method:m,params}))});
await send('Page.enable');await send('Runtime.enable');
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:`JSON.stringify(${x})`,awaitPromise:true,returnByValue:true});return JSON.parse(r.result.result.value)};
const go=async u=>{await send('Page.navigate',{url:BASE+u});for(let i=0;i<80;i++){if(await ev('document.readyState')==='complete')break;await new Promise(r=>setTimeout(r,100))}await new Promise(r=>setTimeout(r,350))};
const PAGES=['/?onboarded=1','/progress?onboarded=1','/learn?onboarded=1','/projects?onboarded=1','/playground?onboarded=1','/learn/python-101/normal/lessons/01-printing?onboarded=1'];
const WIDTHS=[320,375,768,1024,1440];
let bad=0;
for(const w of WIDTHS){
  await send('Emulation.setDeviceMetricsOverride',{width:w,height:900,deviceScaleFactor:1,mobile:w<768});
  for(const pg of PAGES){
    await go(pg);
    const r=await ev(`(() => {
      const de=document.documentElement;
      const over=de.scrollWidth-de.clientWidth;
      const wide=[...document.querySelectorAll('*')].filter(el=>{
        const r=el.getBoundingClientRect();
        return r.width>0 && (r.right>de.clientWidth+1||r.left<-1) && getComputedStyle(el).position!=='fixed';
      }).slice(0,4).map(el=>(el.className&&typeof el.className==='string'?el.className:el.tagName)+' w='+Math.round(el.getBoundingClientRect().width));
      return {over, wide};
    })()`);
    if(r.over>1){bad++;console.log(`  ${w}px ${pg}  overflow ${r.over}px`);r.wide.forEach(x=>console.log(`        ${x}`));}
  }
}
console.log(bad?`\n${bad} overflow issue(s)`:'\nno horizontal overflow at any width');
ws.close();clean();process.exit(bad?1:0);
