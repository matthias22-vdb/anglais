(() => {
  'use strict';
  // Reviewed teaching choices: retain one plausible confusion per expression.
  const distractors = {
  "meet::arrive|attend|join|meet": "attend",
  "place::attend|borrow|place|spend": "spend",
  "for::at|for|on|with": "with",
  "for::at|by|for|with": "with",
  "take::do|give|make|take": "make",
  "date::date|day|hour|year": "day",
  "charge::charge|invoice|price|salary": "price",
  "warranty::invoice|purchase|receipt|warranty": "receipt",
  "behalf::behalf|purpose|regard|side": "side",
  "advance::advance|ahead|early|front": "ahead",
  "charge::charge|duty|role|task": "duty",
  "track::attention|care|part|track": "care",
  "notice::message|news|notice|warning": "warning",
  "writing::write|writing|written|wrote": "written",
  "trip::route|traffic|transport|trip": "route",
  "row::line|queue|rank|row": "line",
  "stock::invoice|receipt|sale|stock": "sale",
  "order::arrangement|order|sequence|stock": "stock",
  "accordance::accordance|accorded|according|accordingly": "according",
  "to::at|for|to|with": "at",
  "to::at|for|on|to": "for",
  "with::for|on|to|with": "to",
  "on::at|for|on|with": "with",
  "with::at|for|on|with": "for",
  "pay::do|hold|make|pay": "make",
  "touch::call|reach|speak|touch": "reach",
  "carry::bring|carry|put|turn": "bring",
  "set::break|give|set|take": "take",
  "put::put|set|take|turn": "take",
  "down::down|into|off|out": "off",
  "fill::break|come|fill|set": "set",
  "out::away|out|over|through": "away",
  "lay::lay|pick|remove|resign": "remove",
  "into::after|between|forward|into": "after",
  "off::away|down|off|over": "down",
  "cut::cut|give|make|take": "take",
  "come::bring|come|make|send": "bring",
  "being::be|been|being|was": "been",
  "as::as|like|so|than": "like",
  "than::as|than|that|then": "then",
  "addition::added|addition|additional|additionally": "additional",
  "due::because|cause|due|owed": "because",
  "request::ask|request|requested|requesting": "ask",
  "time::clock|hour|minute|time": "minute",
  "ahead::ahead|before|early|front": "before",
  "within::along|among|between|within": "between",
  "case::case|condition|happens|situation": "situation",
  "mind::brain|mind|minded|thought": "thought",
  "leave::leave|leaves|leaving|left": "leaves"
};
  function help(q) {
    if (q.category === 'Grammaire') return {
      text: `La règle à appliquer\n${q.rule}\n\nCompare la forme de chaque proposition avec cette règle.`,
      eliminated: [],
    };
    const keep = q.options.indexOf(distractors[q.options[q.answer] + '::' + [...q.options].sort().join('|')]);
    if (keep < 0 || keep === q.answer) return { text: q.hint, eliminated: [] };
    return {
      text: 'C’est une expression à connaître. Deux mauvaises réponses sont écartées en rouge. Il reste la bonne réponse et un piège : à toi de choisir entre les deux.',
      eliminated: q.options.map((_, i) => i).filter(i => i !== q.answer && i !== keep),
    };
  }
  function retry(q) {
    return q.category === 'Grammaire'
      ? `Pour construire ta réponse\n${q.rule}\n\n${q.feedback[q.answer]}\n\nChoisis maintenant la forme qui respecte cette règle.`
      : `L’expression à retenir\n${q.rule}\n\nRepère le mot manquant dans cette expression, puis sélectionne-le parmi les choix restants.`;
  }
  window.PocketHints = { help, retry };
})();
