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
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.hidden=false;this.disabled=false;this._text='';this.value='';this.classes=new Set();this.classList={toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)};}
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
const LEGACY_KEY='toeic-pocket-stage1-v1';
const USER_ID='test-user';
const KEY=`${LEGACY_KEY}:user:${encodeURIComponent(USER_ID)}`;
function boot(saved=null, broken=false, identity={userId:USER_ID,legacyStorageOwner:false}, initialStorage=null){
 const els=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 const storage=initialStorage || new Map();
 const accountKey=`${LEGACY_KEY}:user:${encodeURIComponent(identity.userId)}`;
 if(saved)storage.set(accountKey,JSON.stringify(saved));
 const body=new Element('body');
 const context={window:{TOEIC_QUESTIONS:bank,confirm:()=>true},document:{getElementById:id=>{if(id==='reading-size')return null;assert.ok(els[id],id);return els[id]},createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),createTextNode:s=>{const n=new Element();n.textContent=s;return n},body},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{assert.equal(k,accountKey);if(broken)throw Error('blocked');storage.set(k,v)}}};
 vm.runInNewContext(fs.readFileSync('public/student/config.js','utf8'),context);
 vm.runInNewContext(fs.readFileSync('public/student/progress.js','utf8'),context);
 vm.runInNewContext(fs.readFileSync('public/student/hints.js','utf8'),context);
 vm.runInNewContext(fs.readFileSync('public/student/app.js','utf8'),context);
 context.window.PocketApp.start(identity);
 return {els,body,storage,state:()=>JSON.parse(storage.get(accountKey)??'null'),answer:i=>els.options.querySelectorAll('button')[i].click()};
}
const app=boot();
for (const q of bank.slice(0,2)) {
  const retryApp = boot({cursor: bank.indexOf(q)});
  const bad = (q.answer + 1) % 4;
  retryApp.answer(bad);
  assert.equal(retryApp.els.feedback.hidden,true);
  assert.equal(retryApp.els.options.querySelectorAll('button')[bad].hidden,true);
  assert.equal(retryApp.els.options.querySelectorAll('button')[q.answer].disabled,false);
  assert.equal(retryApp.els.hint.hidden,false);
  assert.ok(retryApp.els.hint.textContent.includes(q.rule));
  const reloaded = boot(retryApp.state());
  assert.equal(reloaded.els.feedback.hidden,true);
  assert.equal(reloaded.els.options.querySelectorAll('button')[bad].hidden,true);
  const before = JSON.stringify(reloaded.state());
  reloaded.answer(bad);
  assert.equal(JSON.stringify(reloaded.state()),before);
  reloaded.answer(q.answer);
  assert.equal(reloaded.els.feedback.hidden,false);
  assert.equal(reloaded.state().answers[q.id].pending,false);
  assert.equal(reloaded.state().answers[q.id].assisted,true);
  assert.equal(reloaded.state().answers[q.id].needsReview,true);
  assert.equal(Object.values(reloaded.state().monthly).reduce((n,m)=>n+m.errors,0),1);
}
app.els['hint-button'].click();
assert.ok(app.els.hint.textContent.includes(bank[0].rule));
assert.equal(app.els.options.querySelectorAll('button').filter(b=>!b.disabled).length,4);
const hinted=boot({cursor:1});
hinted.els['hint-button'].click();
const hintedReloaded=boot(hinted.state());
assert.equal(hintedReloaded.els.hint.hidden,false);
assert.equal(hintedReloaded.els.options.querySelectorAll('button').filter(b=>!b.disabled).length,2);
hintedReloaded.answer(bank[1].answer);
assert.equal(hintedReloaded.state().answers.q002.assisted,true);
assert.equal(hintedReloaded.state().answers.q002.needsReview,true);
const hintsContext = {window:{}};
vm.runInNewContext(fs.readFileSync('public/student/hints.js','utf8'), hintsContext);
for (const q of bank) {
  const help = hintsContext.window.PocketHints.help(q);
  if(q.category==='Grammaire') {
    assert.ok(help.text.includes(q.rule));
    assert.equal(help.eliminated.length,0);
  } else {
    assert.equal(new Set(help.eliminated).size,2);
    assert.ok(help.eliminated.every(i=>i!==q.answer));
  }
}
assert.equal(app.els['product-name'].textContent,'ENGLISH POCKET EXAM');
assert.match(app.els['trademark-notice'].textContent,/marque déposée d’ETS/);
assert.equal(app.els['practice-grade'].textContent,'—');
assert.equal(app.els['series-list'].children.length,25);
app.els.next.click();assert.match(app.els.position.textContent,/Question 1 /);
for(let i=0;i<500;i++){
 assert.equal(app.els.options.querySelectorAll('button').length,4);
 if(bank[i].category!=='Grammaire') {
   app.els['hint-button'].click();
   const buttons=app.els.options.querySelectorAll('button');
   assert.equal(buttons.filter(b=>!b.disabled).length,2);
   assert.equal(buttons[bank[i].answer].disabled,false);
   const excluded=buttons.find(b=>b.disabled);
   excluded.click();
   assert.equal(app.els.next.hidden,true);
   app.els['hint-button'].click();app.els['hint-button'].click();
   assert.equal(buttons.filter(b=>!b.disabled).length,2);
 }

 app.answer(i===0?(bank[i].answer+1)%4:bank[i].answer);
 if(i===0)assert.equal(app.els['practice-grade'].textContent,'0,06');
 if(i===1)assert.equal(app.els['practice-grade'].textContent,'0,12');
 assert.equal(app.els['done-count'].textContent,String(i+1));
 assert.equal(app.els.next.hidden,false);
 app.els.next.click();
}
assert.equal(app.els.quiz.hidden,true);
assert.equal(app.els['correct-count'].textContent,'249');
assert.equal(app.els['practice-grade'].textContent,'12,97');
assert.equal(app.els['xp-count'].textContent,'3490');
assert.equal(app.els['streak-count'].textContent,'499');
assert.equal(app.els['daily-count'].textContent,'10 / 10');
assert.equal(app.els['daily-goal'].classes.has('done'),true);
const reviewQuestions=bank.filter((q,i)=>i===0||q.category!=='Grammaire');
app.els.review.click();assert.match(app.els.position.textContent,/Révision 1 \/ 251/);
for(const q of reviewQuestions){app.answer(q.answer);app.els.next.click();}
assert.equal(app.els['correct-count'].textContent,'500');assert.equal(app.els['error-count'].textContent,'0');
assert.equal(app.els['practice-grade'].textContent,'20,00');
assert.equal(app.els['xp-count'].textContent,'6000');assert.equal(app.els['streak-count'].textContent,'500');
app.els.review.click();assert.equal(app.els['end-title'].textContent,'Aucune erreur à revoir');
app.els['series-list'].children[4].click();assert.match(app.els.position.textContent,/Question 81 /);
assert.equal(app.els.feedback.hidden,false);
app.els.previous.click();assert.match(app.els.position.textContent,/Question 80 /);
assert.equal(app.els['reading-size'], undefined);
const resumed=boot(app.state());assert.equal(resumed.body.classes.has('comfortable'),false);
assert.equal(resumed.els['done-count'].textContent,'500');
assert.equal(resumed.els['practice-grade'].textContent,'20,00');
assert.equal(resumed.els['daily-count'].textContent,'10 / 10');
resumed.els.redo.click();assert.equal(resumed.els['done-count'].textContent,'0');
assert.equal(resumed.els['practice-grade'].textContent,'—');
assert.equal(resumed.els['xp-count'].textContent,'0');assert.equal(resumed.els['streak-count'].textContent,'0');
const legacy=boot({cursor:20,answers:Object.fromEntries(bank.slice(0,20).map(q=>[q.id,{choice:q.answer,assisted:false}]))});
assert.match(legacy.els.position.textContent,/Question 21 /);assert.equal(legacy.els['done-count'].textContent,'20');
const invalid=boot({cursor:999,answers:{q001:null,q002:{choice:8},bad:{choice:0}}});assert.equal(invalid.els['done-count'].textContent,'0');
const nineOfTen=boot({cursor:10,answers:Object.fromEntries(bank.slice(0,10).map((q,i)=>[q.id,{choice:i===0?(q.answer+1)%4:q.answer,assisted:false}]))});
assert.equal(nineOfTen.els['practice-grade'].textContent,'13,20');
assert.equal(nineOfTen.els['grade-breakdown'].textContent,'Anglais 12,60 / 14 · Bonus d’effort 0,60 / 6');
assert.equal(nineOfTen.els['xp-count'].textContent,'110');
const oneThirtyOfTwoHundred=boot({cursor:200,answers:Object.fromEntries(bank.slice(0,200).map((q,i)=>[q.id,{choice:i<130?q.answer:(q.answer+1)%4,assisted:false}]))});
assert.equal(oneThirtyOfTwoHundred.els['practice-grade'].textContent,'15,10');
assert.equal(oneThirtyOfTwoHundred.els['grade-breakdown'].textContent,'Anglais 9,10 / 14 · Bonus d’effort 6,00 / 6');
assert.equal(oneThirtyOfTwoHundred.els['xp-count'].textContent,'1700');
const blocked=boot(null,true);blocked.answer(bank[0].answer);assert.equal(blocked.els['save-warning'].hidden,false);assert.equal(blocked.els['done-count'].textContent,'1');
const sharedStorage=new Map();
const firstAccount=boot(null,false,{userId:'student-a',legacyStorageOwner:false},sharedStorage);
firstAccount.answer(bank[0].answer);
const secondAccount=boot(null,false,{userId:'student-b',legacyStorageOwner:false},sharedStorage);
assert.equal(secondAccount.els['done-count'].textContent,'0');
const returningAccount=boot(null,false,{userId:'student-a',legacyStorageOwner:false},sharedStorage);
assert.equal(returningAccount.els['done-count'].textContent,'1');
const legacyStorage=new Map([[LEGACY_KEY,JSON.stringify({cursor:1,answers:{q001:{choice:bank[0].answer}}})]]);
const legacyOwner=boot(null,false,{userId:'owner',legacyStorageOwner:true},legacyStorage);
assert.equal(legacyOwner.els['done-count'].textContent,'1');
assert.ok(legacyStorage.has(LEGACY_KEY));
const unrelatedAccount=boot(null,false,{userId:'other',legacyStorageOwner:false},legacyStorage);
assert.equal(unrelatedAccount.els['done-count'].textContent,'0');
const firstDevice=boot();
firstDevice.answer(bank[0].answer);
const secondDevice=boot(null,false,{userId:USER_ID,legacyStorageOwner:false,remoteState:firstDevice.state()},new Map());
assert.equal(secondDevice.els['done-count'].textContent,'1');
assert.equal(secondDevice.state().answers.q001.choice,bank[0].answer);
console.log('PASS: 500 items, balanced grade, effort points, complete quiz, errors review, series navigation, reload, text size, reset, invalid data and unavailable storage. DOM simulation; no real-browser layout validation.');
// Historical mistakes must remain after correcting them, reloading or restarting.
const counts = Object.values(app.state().monthly);
assert.equal(counts.reduce((s,c)=>s+c.total,0),751);
assert.equal(counts.reduce((s,c)=>s+c.errors,0),1);
assert.deepEqual(resumed.state().monthly,app.state().monthly);
const history = boot({monthly:{'2025-01':{total:10,errors:5},'2025-03':{total:100,errors:20},'2025-13':{total:5,errors:1},'2025-04':{total:2,errors:3}}});
history.answer(bank[0].answer);
assert.deepEqual(history.state().monthly['2025-01'],{total:10,errors:5});
assert.deepEqual(history.state().monthly['2025-03'],{total:100,errors:20});
assert.equal(Object.values(history.state().monthly).reduce((s,c)=>s+c.total,0),111);
history.answer(bank[0].answer); // locked response must not add a second entry
assert.equal(Object.values(history.state().monthly).reduce((s,c)=>s+c.total,0),111);
console.log('PASS: monthly error rates, migration without invented dates, historical mistakes, reload, reset preservation, inactive months, invalid data and double-answer prevention.');
