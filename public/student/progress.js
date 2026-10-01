(() => {
'use strict';
const $ = id => document.getElementById(id);
function clean(value) {
  const result = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const [month, count] of Object.entries(value)) {
    if (/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month) && count &&
        Number.isSafeInteger(count.total) && count.total > 0 &&
        Number.isSafeInteger(count.errors) && count.errors >= 0 && count.errors <= count.total) {
      result[month] = { total: count.total, errors: count.errors };
    }
  }
  return result;
}
const rate = c => c.errors / c.total * 100;
const pct = c => rate(c).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %';
const label = m => new Date(Number(m.slice(0,4)), Number(m.slice(5))-1, 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
function render(monthly) {
  const months = Object.keys(monthly).sort();
  const rows = $('history-rows'); rows.replaceChildren();
  const chart = $('history-chart'); chart.replaceChildren();
  $('history-message').textContent = months.length === 0
    ? 'Ta première réponse fera apparaître ton premier point.'
    : months.length === 1 ? 'Premier mois enregistré ! La comparaison apparaîtra dès un deuxième mois travaillé.'
    : 'Voici tes résultats enregistrés. Une hausse peut aussi venir d’exercices plus difficiles : continue à ton rythme.';
  for (const month of months) {
    const c = monthly[month], row = document.createElement('tr');
    for (const value of [label(month), c.total, c.errors, pct(c)]) {
      const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
    }
    rows.append(row);
  }
  if (!months.length) return;
  // Show twelve calendar months at most, with real gaps for inactive months.
  const last = months[months.length-1];
  const end = Number(last.slice(0,4))*12 + Number(last.slice(5))-1;
  const first = Number(months[0].slice(0,4))*12 + Number(months[0].slice(5))-1;
  const start = Math.max(first, end-11), span = end-start;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox','0 0 600 240'); svg.setAttribute('role','img');
  svg.setAttribute('aria-label','Pourcentage d’erreurs par mois, de 0 à 100 %. Les chiffres détaillés sont disponibles sous la courbe. Jusqu’à douze mois affichés.');
  function shape(tag, attrs, text) {
    const el = document.createElementNS('http://www.w3.org/2000/svg',tag);
    for (const [k,v] of Object.entries(attrs)) el.setAttribute(k,String(v));
    if (text !== undefined) el.textContent = text;
    svg.append(el); return el;
  }
  for (const value of [0,50,100]) {
    const y = 190-value*1.5;
    shape('line',{x1:58,x2:570,y1:y,y2:y,stroke:'#dce5f0'});
    shape('text',{x:48,y:y+5,'text-anchor':'end',fill:'#51677f','font-size':14},value+' %');
  }
  let previous = null;
  for (let n=start; n<=end; n++) {
    const m = Math.floor(n/12)+'-'+String(n%12+1).padStart(2,'0');
    const x = span ? 72+(n-start)/span*478 : 310;
    const c = monthly[m];
    if (n===start || n===end || (span>5 && n===Math.floor((start+end)/2)))
      shape('text',{x,y:222,'text-anchor':'middle',fill:'#51677f','font-size':14},label(m));
    if (!c) { previous=null; continue; }
    const y = 190-rate(c)*1.5;
    if (previous) shape('line',{x1:previous.x,y1:previous.y,x2:x,y2:y,stroke:'#155ad7','stroke-width':3});
    const point=shape('circle',{cx:x,cy:y,r:5,fill:'#155ad7'});
    const title=document.createElementNS('http://www.w3.org/2000/svg','title');
    title.textContent=label(m)+': '+c.errors+' erreurs sur '+c.total+' réponses ('+pct(c)+')'; point.append(title);
    previous={x,y};
  }
  chart.append(svg);
}
window.PocketProgress = { clean, render };
})();
