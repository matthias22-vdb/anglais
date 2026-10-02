const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const bank = JSON.parse(fs.readFileSync('questions-reviewed.json'));
const initial = JSON.parse(fs.readFileSync('questions-stage1.json'));
assert.deepEqual(bank.slice(0,20), initial);
assert.equal(bank.length,500);
assert.equal(new Set(bank.map(q=>q.sentence)).size,500);
bank.forEach((q,i)=>{
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
const context={window:{TOEIC_QUESTIONS:bank},confirm:()=>true,document:{getElementById:id=>{assert.ok(els[id],id);return els[id]},createElement:t=>new Element(t),createTextNode:s=>{const n=new Element();n.textContent=s;return n},body:new Element()},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),get length(){return storage.size},key:i=>[...storage.keys()][i]}};
for(const name of ['config','hints','app'])vm.runInNewContext(fs.readFileSync(`public/student/${name}.js`,'utf8'),context);
return {els,storage,answer:i=>els.options.querySelectorAll('button')[i].click()};
}
const a=boot();assert.equal(a.els.options.children.length,4);a.els['hint-button'].click();assert.ok(a.els.hint.textContent.includes(bank[0].rule));
a.answer((bank[0].answer+1)%4);assert.equal(a.els.feedback.hidden,false);assert.ok(a.els.verdict.textContent.includes(bank[0].options[bank[0].answer]));
const b=boot(a.storage);assert.equal(b.els.feedback.hidden,false);b.els.review.click();b.answer(bank[0].answer);b.els.next.click();assert.equal(b.els.quiz.hidden,true);
b.els.learn.click();b.els['series-list'].children[1].click();assert.match(b.els.position.textContent,/Question 21/);
const c=boot();for(let i=0;i<500;i++){assert.equal(c.els.options.children.length,4);c.answer(bank[i].answer);c.els.next.click();}assert.equal(c.els.quiz.hidden,true);
const old=new Map([['toeic-pocket-stage1-v1:user:old',JSON.stringify({cursor:12,answers:{q001:{choice:bank[0].answer}}})]]);const d=boot(old);assert.equal(d.els.feedback.hidden,true);assert.equal(d.els['saved-list'].children.length,1);d.els['saved-list'].children[0].click();assert.match(d.els.position.textContent,/Question 13/);assert.ok(old.has('toeic-pocket-stage1-v1:user:old'));
assert.doesNotMatch(html, /login-screen|practice-grade|sync.js|auth.js|game-panel/);
console.log('PASS: 500 questions preserved, hints, correction, review, reload, series, full course and explicit legacy recovery.');
