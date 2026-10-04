const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const bank = JSON.parse(fs.readFileSync('questions-reviewed.json'));
vm.runInNewContext(fs.readFileSync('public/student/part5.js','utf8'), {window:{TOEIC_QUESTIONS:bank}});
const initial = JSON.parse(fs.readFileSync('questions-stage1.json'));
assert.deepEqual(bank.slice(0,20), initial);
assert.equal(bank.length,520);
assert.equal(new Set(bank.map(q=>q.sentence)).size,520);
bank.slice(0,500).forEach((q,i)=>{
 assert.equal(q.id,`q${String(i+1).padStart(3,'0')}`);
 assert.equal(q.category,i%2?'Expression professionnelle':'Grammaire');
 assert.equal(q.options.length,4); assert.equal(new Set(q.options).size,4);
 assert.equal(q.feedback.length,4); assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
 assert.equal(q.sentence.split('_____').length,2);
 for(const key of ['translation','hint','rule'])assert.ok(q[key]?.length);
 q.feedback.forEach(s=>assert.ok(s.length));
});
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.hidden=false;this.disabled=false;this._text='';this.value='';this.classes=new Set();this.classList={add:(k)=>this.classes.add(k),toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)};}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this._text='';this.children=items;}
 setAttribute(k,v){this.attrs[k]=v;}
 querySelectorAll(tag){return this.children.filter(x=>x.tag===tag);}
 focus(){} scrollIntoView(){}
 click(){if(!this.disabled)this.onclick?.();}
}

const html=fs.readFileSync('public/student/index.html','utf8');
function boot(storage=new Map()){
const els=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const context={window:{TOEIC_QUESTIONS:bank},confirm:()=>true,fetch:async()=>({status:401,json:async()=>({})}),document:{getElementById:id=>{assert.ok(els[id],id);return els[id]},createElement:t=>new Element(t),createTextNode:s=>{const n=new Element();n.textContent=s;return n},body:new Element()},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),get length(){return storage.size},key:i=>[...storage.keys()][i]}};
for(const name of ['config','hints','app'])vm.runInNewContext(fs.readFileSync(`public/student/${name}.js`,'utf8'),context);
return {els,storage,context,answer:i=>els.options.querySelectorAll('button')[i].click()};
}
const a=boot();assert.equal(a.els.options.children.length,4);assert.equal(a.els['practice-grade'].textContent,'—');a.els['hint-button'].click();assert.ok(a.els.hint.textContent.includes(bank[0].rule));
a.answer((bank[0].answer+1)%4);assert.equal(a.els['practice-grade'].textContent,'0,06');assert.equal(a.els.feedback.hidden,false);assert.ok(a.els.verdict.textContent.includes(bank[0].options[bank[0].answer]));
const b=boot(a.storage);assert.equal(b.els.feedback.hidden,false);b.els.review.click();b.answer(bank[0].answer);b.els.next.click();assert.equal(b.els.quiz.hidden,true);
b.els.learn.click();b.els['series-list'].children[1].click();assert.match(b.els.position.textContent,/Question 21/);
const c=boot();for(let i=0;i<bank.length;i++){assert.equal(c.els.options.children.length,4);c.answer(bank[i].answer);c.els.next.click();}assert.equal(c.els.quiz.hidden,true);assert.equal(c.els['practice-grade'].textContent,'20,00');
const old=new Map([['toeic-pocket-stage1-v1:user:old',JSON.stringify({cursor:12,answers:{q001:{choice:bank[0].answer}}})]]);const d=boot(old);assert.equal(d.els.feedback.hidden,true);assert.equal(d.els['saved-list'].children.length,1);d.els['saved-list'].children[0].click();assert.match(d.els.position.textContent,/Question 13/);assert.ok(old.has('toeic-pocket-stage1-v1:user:old'));
assert.doesNotMatch(html, /login-screen|sync.js|auth.js|game-panel/);
console.log('PASS: 500 questions preserved, hints, correction, review, reload, series, full course and explicit legacy recovery.');

(async()=>{
const e=boot();await new Promise(resolve=>setImmediate(resolve));e.answer((bank[0].answer+1)%4);
e.context.fetch=async()=>({status:200,ok:true,json:async()=>({state:{cursor:2,answers:{q001:{choice:bank[0].answer},q003:{choice:bank[2].answer}}}})});
e.els['recover-server'].click();await new Promise(resolve=>setImmediate(resolve));
const saved=JSON.parse(e.storage.get('english-pocket-simple-v1'));
assert.equal(saved.answers.q001.choice,(bank[0].answer+1)%4);assert.equal(saved.answers.q003.choice,bank[2].answer);
assert.ok(e.storage.get('english-pocket-before-recovery-v1'));assert.match(e.els['recover-message'].textContent,/2 anciennes réponses/);
console.log('PASS: server recovery preserves new answers and saves a backup.');
})().catch(error=>{console.error(error);process.exitCode=1});

const extra=boot();extra.els['new-part5'].click();assert.match(extra.els.position.textContent,/Question 501/);assert.equal(extra.els.options.children.length,4);assert.equal(extra.els['series-list'].children.length,26);
for (const q of bank.slice(500)) { assert.equal(q.options.length,4);assert.equal(q.feedback.length,4);assert.equal(q.sentence.split('_____').length,2);assert.ok(q.translation);assert.ok(q.hint); }
console.log('PASS: separate Part 5 series, 520 unique questions, existing answers and grade retained.');
