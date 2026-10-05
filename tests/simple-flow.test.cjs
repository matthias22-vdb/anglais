const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const original = JSON.parse(fs.readFileSync('questions-reviewed.json'));
const dataWindow = {TOEIC_QUESTIONS:original};
vm.runInNewContext(fs.readFileSync('public/student/part5.js','utf8'), {window:dataWindow});
const bank = dataWindow.TOEIC_QUESTIONS;
const initial = JSON.parse(fs.readFileSync('questions-stage1.json'));
assert.deepEqual(original.slice(0,20), initial);
assert.equal(bank.length,600);
assert.equal(new Set(bank.map(q=>q.id)).size,600);
assert.equal(new Set(bank.map(q=>q.sentence)).size,600);
assert.deepEqual(bank.filter(q=>q.id.startsWith('q')), original);
assert.equal(bank.filter(q=>q.id.startsWith('part5-')).length,100);
for(let i=0;i<100;i++)assert.equal(bank[i*6+5].id,`part5-${String(i+1).padStart(3,'0')}`);
original.forEach((q,i)=>{
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
const context={window:dataWindow,confirm:()=>true,fetch:async()=>({status:401,json:async()=>({})}),document:{getElementById:id=>{assert.ok(els[id],id);return els[id]},createElement:t=>new Element(t),createTextNode:s=>{const n=new Element();n.textContent=s;return n},body:new Element()},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),get length(){return storage.size},key:i=>[...storage.keys()][i]}};
for(const name of ['config','hints','app'])vm.runInNewContext(fs.readFileSync(`public/student/${name}.js`,'utf8'),context);
return {els,storage,context,answer:i=>els.options.querySelectorAll('button')[i].click()};
}
const a=boot();assert.equal(a.els.options.children.length,4);assert.equal(a.els['practice-grade'].textContent,'—');a.els['hint-button'].click();assert.ok(a.els.hint.textContent.includes(bank[0].rule));
a.answer((bank[0].answer+1)%4);assert.equal(a.els['practice-grade'].textContent,'0,06');assert.equal(a.els.feedback.hidden,false);assert.ok(a.els.verdict.textContent.includes(bank[0].options[bank[0].answer]));
const b=boot(a.storage);assert.equal(b.els.feedback.hidden,false);b.els.review.click();b.answer(bank[0].answer);b.els.next.click();assert.equal(b.els.quiz.hidden,true);
b.els.learn.click();b.els['series-list'].children[1].click();assert.match(b.els.position.textContent,/Question 21/);
const c=boot();for(let i=0;i<bank.length;i++){assert.equal(c.els.options.children.length,4);c.answer(bank[i].answer);c.els.next.click();}assert.equal(c.els.quiz.hidden,true);assert.equal(c.els['practice-grade'].textContent,'20,00');
const old=new Map([['toeic-pocket-stage1-v1:user:old',JSON.stringify({cursor:12,answers:{q001:{choice:bank[0].answer}}})]]);const d=boot(old);assert.equal(d.els.feedback.hidden,true);assert.equal(d.els['saved-list'].children.length,1);d.els['saved-list'].children[0].click();assert.match(d.els.position.textContent,/Question 15/);assert.ok(old.has('toeic-pocket-stage1-v1:user:old'));
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

const extra=boot();assert.equal(extra.els['series-list'].children.length,30);
for (const q of bank.filter(q=>q.id.startsWith('part5-'))) { assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.feedback.length,4);assert.equal(q.sentence.split('_____').length,2);assert.ok(q.translation);assert.ok(q.hint);assert.ok(q.rule);assert.ok(q.answer>=0&&q.answer<4);q.feedback.forEach(s=>assert.ok(s.length)); }
const first20=JSON.parse(fs.readFileSync('part5-original.json'));
first20.forEach((row,i)=>{const q=bank.find(q=>q.id===`part5-${String(i+1).padStart(3,'0')}`);assert.equal(q.sentence,row[0]);assert.deepEqual(Array.from(q.options),row[2]);assert.equal(q.answer,row[3]);});
for(const [cursor,id] of [[148,'q149'],[500,'part5-001'],[519,'part5-020']]){
 const storage=new Map([['english-pocket-simple-v1',JSON.stringify({cursor,answers:{q001:{choice:bank[0].answer},'part5-001':{choice:bank[5].answer}}})]]);
 const migrated=boot(storage);const expected=bank.findIndex(q=>q.id===id);
 assert.equal(migrated.els.position.textContent,`Question ${expected+1} / 600`);
 migrated.answer(bank[expected].answer);
 const saved=JSON.parse(storage.get('english-pocket-simple-v1'));
 assert.equal(saved.cursor,expected);assert.equal(saved.orderVersion,'mixed-600-v1');assert.equal(saved.answers.q001.choice,bank[0].answer);assert.equal(saved.answers['part5-001'].choice,bank[5].answer);
 assert.equal(boot(storage).els.position.textContent,`Question ${expected+1} / 600`);
}
const completed=boot(new Map([['english-pocket-simple-v1',JSON.stringify({cursor:600,orderVersion:'mixed-600-v1',answers:{}})]]));assert.equal(completed.els.quiz.hidden,true);
console.log('PASS: 600 mixed unique questions, previous 520 questions unchanged, cursor migration and reload, 30 series.');

// A revision session contains only actual outstanding mistakes, not the full bank.
const errors64=Object.fromEntries(bank.slice(0,64).map(q=>[q.id,{choice:(q.answer+1)%4,needsReview:true}]));
errors64[bank[100].id]={choice:bank[100].answer,needsReview:false};
errors64[bank[101].id]={choice:bank[101].answer,assisted:true,needsReview:true};
const reviewStorage=new Map([['english-pocket-simple-v1',JSON.stringify({cursor:120,orderVersion:'mixed-600-v1',answers:errors64})]]);
const r=boot(reviewStorage);
assert.equal(r.els['error-count'].textContent,'64');r.els.review.click();
assert.equal(r.els.position.textContent,'Question 1 / 64');assert.equal(r.els.progress.max,64);assert.equal(r.els['series-panel'].hidden,true);
assert.equal(r.els.feedback.hidden,true);assert.equal(r.els.options.children.length,4);
r.answer(bank[0].answer);assert.equal(r.els['error-count'].textContent,'63');assert.match(r.els['review-result'].textContent,/retirée/);assert.equal(r.els.rule.textContent,bank[0].rule);
r.els.next.click();assert.equal(r.els.position.textContent,'Question 2 / 64');assert.equal(r.els.previous.disabled,true);
r.answer((bank[1].answer+1)%4);assert.equal(r.els['error-count'].textContent,'63');
assert.equal(JSON.parse(reviewStorage.get('english-pocket-simple-v1')).answers[bank[1].id].errors,2);
r.els.next.click();r.els.previous.click();assert.equal(r.els.position.textContent,'Question 2 / 64');assert.equal(r.els.feedback.hidden,true);
r.els['hint-button'].click();r.answer(bank[1].answer);assert.equal(r.els['error-count'].textContent,'63');assert.match(r.els['review-result'].textContent,/reste à revoir/);
r.els.review.click();assert.equal(r.els.position.textContent,'Question 1 / 63');
for(let i=1;i<64;i++){r.answer(bank[i].answer);r.els.next.click();}
assert.equal(r.els['error-count'].textContent,'0');assert.equal(r.els.quiz.hidden,true);assert.match(r.els['end-title'].textContent,/Toutes tes erreurs/);
assert.equal(r.els['review-end'].hidden,true);assert.equal(r.els['error-stats-table'].hidden,false);
assert.ok(r.els['error-stats-body'].children.length<=5);
for(const row of r.els['error-stats-body'].children)assert.equal(row.children[2].textContent,'0');
const persisted=boot(reviewStorage);assert.equal(persisted.els['error-count'].textContent,'0');persisted.els.review.click();assert.equal(persisted.els.quiz.hidden,true);
persisted.els.learn.click();assert.equal(persisted.els.position.textContent,'Question 121 / 600');assert.equal(persisted.els['series-panel'].hidden,false);
assert.equal(JSON.parse(reviewStorage.get('english-pocket-simple-v1')).answers[bank[0].id].errors,1);
const emptyStats=boot();assert.equal(emptyStats.els['error-stats-table'].hidden,true);assert.equal(emptyStats.els['error-stats-empty'].hidden,false);
console.log('PASS: 64-error-only queue, live remaining count, corrected-answer synchronization, hints, retry, historical topic stats and persistence.');
