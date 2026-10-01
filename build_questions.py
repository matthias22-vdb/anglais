"""Rebuild the reviewed 500-question bank, preserving the published 200 items."""
import json, random
from pathlib import Path
grammar=[]
expressions=[]
def G(topic,options,notes,hint,rule,rows):
    for row in rows.strip().splitlines():
        q,tr=row.split('|')
        grammar.append(dict(category='Grammaire',topic=topic,sentence=q,translation=tr,options=options.split('/'),notes=notes,hint=hint,rule=rule))
def E(topic,options,hint,rule,rows):
    opts=options.split('/')
    for row in rows.strip().splitlines():
        q,tr=row.split('|')
        notes=[rule]+[f'« {w} » ne complète pas cette expression. '+rule for w in opts[1:]]
        expressions.append(dict(category='Expression professionnelle',topic=topic,sentence=q,translation=tr,options=opts,notes=notes,hint=hint,rule=rule))
G('Obligation','wear/wears/wearing/wore',[
'Après must, on garde le verbe simple : wear. Le sujet ne change pas cette règle.',
'Wears porte un s. Après must, on garde wear sans s.',
'Wearing porte -ing. Cette forme ne suit pas directement must.',
'Wore est au passé. Après must, il faut la forme simple wear.'],
'Repère must : le verbe juste après garde sa forme simple.','Must + verbe simple : must wear = devoir porter.', '''
Factory visitors must _____ safety glasses.|Les visiteurs de l’usine doivent porter des lunettes de protection.
Kitchen staff must _____ clean uniforms every day.|Le personnel de cuisine doit porter une tenue propre chaque jour.
All cyclists must _____ helmets on the company tour.|Tous les cyclistes doivent porter un casque pendant la sortie de l’entreprise.
Construction workers must _____ protective boots on this site.|Les ouvriers doivent porter des chaussures de protection sur ce chantier.
''')
G('Passif au passé, pluriel','were/was/are/have',[
'Were convient : il y en a plusieurs et l’action a eu lieu dans le passé.',
'Was accompagne une seule chose. Le sujet est au pluriel.',
'Are est au présent. Le moment indiqué est passé.',
'Have ne forme pas le passif ici. Les objets reçoivent l’action.'],
'Regarde le sujet pluriel et le moment passé.','They were + participe passé : ils ont été…', '''
The invoices _____ checked by the accountant yesterday.|Les factures ont été vérifiées par le comptable hier.
The chairs _____ delivered to the office last Monday.|Les chaises ont été livrées au bureau lundi dernier.
The windows _____ cleaned by a contractor two days ago.|Les fenêtres ont été nettoyées par un prestataire il y a deux jours.
The invitations _____ printed by our assistant last week.|Les invitations ont été imprimées par notre assistant la semaine dernière.
''')
G('Passif au passé, singulier','was/were/is/has',[
'Was convient pour une seule chose, dans le passé.',
'Were accompagne notamment they. Ici, il s’agit d’une seule chose.',
'Is est au présent. La phrase indique un moment passé.',
'Has ne forme pas le passif ici. Le sujet reçoit l’action.'],
'Une seule chose reçoit l’action à un moment passé.','It was + participe passé : cela a été…', '''
The parcel _____ delivered by the courier yesterday.|Le colis a été livré par le coursier hier.
The contract _____ signed by both directors last Friday.|Le contrat a été signé par les deux directeurs vendredi dernier.
The meeting _____ cancelled by the organiser last night.|La réunion a été annulée par l’organisateur hier soir.
The machine _____ repaired by a technician two days ago.|La machine a été réparée par un technicien il y a deux jours.
''')
G('Chaque personne','has/have/having/are',[
'Each ou every présente une personne à la fois : on utilise has.',
'Have ne convient pas avec ce sujet singulier.',
'Having seul ne fait pas un verbe conjugué complet.',
'Are veut dire sont. Il ne convient ni au singulier ni au sens.'],
'Chaque personne : on les prend une par une.','Each / every + nom singulier → has.', '''
Each employee _____ a personal access code.|Chaque employé possède un code d’accès personnel.
Every visitor _____ a temporary badge.|Chaque visiteur possède un badge temporaire.
Each manager _____ a separate office.|Chaque responsable possède un bureau séparé.
Every customer _____ a unique account number.|Chaque client possède un numéro de compte unique.
''')
G('Manière de faire','carefully/careful/care/careless',[
'Carefully explique comment faire l’action : avec attention.',
'Careful décrit une personne ou une chose. Ici, on décrit une action.',
'Care est un nom ou un verbe ; il ne signifie pas avec attention ici.',
'Careless décrit quelqu’un de peu soigneux. Il ne décrit pas l’action sous cette forme.'],
'Le mot répond à la question : comment faire cette action ?','Verbe + carefully = faire quelque chose avec attention.', '''
Please read the instructions _____ before using the machine.|Lis les instructions attentivement avant d’utiliser la machine.
The accountant checked the figures _____.|Le comptable a vérifié les chiffres avec attention.
Our driver packed the fragile equipment _____.|Notre chauffeur a emballé le matériel fragile avec soin.
The assistant listened _____ to the client’s request.|L’assistant a écouté attentivement la demande du client.
''')
G('Décrire une chose','reliable/reliably/reliability/rely',[
'Reliable décrit la chose : elle est fiable, on peut compter dessus.',
'Reliably décrit comment on fait une action, pas directement une chose.',
'Reliability est le nom fiabilité. Ici, on cherche une qualité.',
'Rely est un verbe : compter sur. Ici, il faut une qualité.'],
'Le trou se trouve devant la chose qu’on décrit.','Reliable + nom = une chose fiable.', '''
We need a _____ supplier for our new shop.|Nous avons besoin d’un fournisseur fiable pour notre nouvelle boutique.
The team chose a _____ delivery service.|L’équipe a choisi un service de livraison fiable.
The office requires a _____ internet connection.|Le bureau a besoin d’une connexion Internet fiable.
Our company uses a _____ booking system.|Notre entreprise utilise un système de réservation fiable.
''')
G('Nom après plusieurs','applications/apply/applicable/applying',[
'Applications est un nom au pluriel : des candidatures.',
'Apply est un verbe : postuler. Ici, il faut ce qu’on a reçu ou examiné.',
'Applicable décrit quelque chose qui peut s’appliquer. Ce n’est pas une candidature.',
'Applying est une forme du verbe postuler. Il faut ici un nom pluriel.'],
'On parle de plusieurs candidatures. Il faut un nom au pluriel.','Application = candidature ; applications = candidatures.', '''
We received several _____ for the position.|Nous avons reçu plusieurs candidatures pour le poste.
The recruiter reviewed ten _____ this morning.|Le recruteur a examiné dix candidatures ce matin.
Only three _____ arrived before the deadline.|Seules trois candidatures sont arrivées avant la date limite.
The company rejected two incomplete _____.|L’entreprise a rejeté deux candidatures incomplètes.
''')
G('Depuis un point de départ','since/for/during/until',[
'Since indique quand la période a commencé.',
'For sert à donner une durée, comme for three years.',
'During veut dire pendant. Il ne marque pas ici le début de la période.',
'Until indique une fin. Ici, on indique le début d’une période encore en cours.'],
'La phrase donne le début de la période, pas sa durée.','Since + point de départ = depuis.', '''
She has worked here _____ 2021.|Elle travaille ici depuis 2021.
The shop has been closed _____ Monday.|La boutique est fermée depuis lundi.
We have used this software _____ January.|Nous utilisons ce logiciel depuis janvier.
The supplier has been our partner _____ 2018.|Le fournisseur est notre partenaire depuis 2018.
''')
G('Pendant une durée','for/since/during/from',[
'For introduit la durée : combien de temps cela dure.',
'Since introduit un début précis, comme since Monday.',
'During se place devant une période identifiée, comme during the meeting ; pas cette durée seule.',
'From donne un départ. Ici, la phrase donne une durée.'],
'La phrase dit combien de temps, et non depuis quelle date.','For + durée : for two weeks = depuis ou pendant deux semaines.', '''
She has managed this department _____ five years.|Elle dirige ce service depuis cinq ans.
We have been waiting _____ two hours.|Nous attendons depuis deux heures.
The technician has been on site _____ thirty minutes.|Le technicien est sur place depuis trente minutes.
They have rented this office _____ six months.|Ils louent ce bureau depuis six mois.
''')
G('Après décider','to open/open/opening/opened',[
'Decide to open veut dire décider d’ouvrir.',
'Il manque to entre decided et open.',
'Opening ne suit pas directement decided dans cette construction.',
'Opened est une forme passée. Après decided, on utilise ici to open.'],
'On dit décider de faire quelque chose : decide to…','Decide to + verbe simple.', '''
The company decided _____ a new branch.|L’entreprise a décidé d’ouvrir une nouvelle agence.
The director has decided _____ the meeting with a short speech.|Le directeur a décidé d’ouvrir la réunion par un petit discours.
The owners decided _____ a second restaurant.|Les propriétaires ont décidé d’ouvrir un deuxième restaurant.
The bank has decided _____ its offices on Saturday mornings.|La banque a décidé d’ouvrir ses bureaux le samedi matin.
''')
G('Après une préposition','leaving/leave/left/leaves',[
'Après before ou after sans nouveau sujet, leaving convient.',
'Leave pourrait suivre un sujet : before you leave. Ce sujet manque ici.',
'Left est au passé. Cette forme ne convient pas directement ici.',
'Leaves aurait besoin d’un sujet, par exemple she leaves.'],
'Il n’y a pas de nouveau sujet après before ou after.','Before / after + verbe en -ing.', '''
Turn off the lights before _____ the office.|Éteins les lumières avant de quitter le bureau.
Check your bag before _____ the train.|Vérifie ton sac avant de quitter le train.
Please return your badge before _____ the building.|Rends ton badge avant de quitter le bâtiment.
She called the client after _____ the conference.|Elle a appelé le client après avoir quitté la conférence.
''')
G('Comparaison','more efficient/most efficient/efficient/efficiently',[
'More efficient than veut dire plus efficace que.',
'Most efficient veut dire le plus efficace. Ici, than demande une comparaison.',
'Efficient seul ne forme pas cette comparaison avec than.',
'Efficiently décrit une action. Ici, on compare la qualité de deux choses.'],
'Than annonce une comparaison.','More + adjectif long + than : plus… que.', '''
The new system is _____ than the old one.|Le nouveau système est plus efficace que l’ancien.
This delivery method is _____ than our previous method.|Cette méthode de livraison est plus efficace que la précédente.
The updated process is _____ than the original process.|Le processus modifié est plus efficace que le processus initial.
Our new printer is _____ than the model we replaced.|Notre nouvelle imprimante est plus efficace que celle que nous avons remplacée.
''')
G('Assez + qualité','enough/very/too/much',[
'Enough se place après la qualité : assez grand, assez rapide…',
'Very se place avant la qualité, pas après.',
'Too se place avant la qualité, pas après.',
'Much ne convient pas directement après cet adjectif.'],
'On décrit une qualité suffisante pour faire quelque chose.','Adjectif + enough + to : assez… pour.', '''
The room is large _____ to seat twenty guests.|La salle est assez grande pour accueillir vingt invités assis.
The connection is fast _____ to upload the file.|La connexion est assez rapide pour envoyer le fichier.
The box is strong _____ to hold the equipment.|La boîte est assez solide pour contenir le matériel.
The instructions are clear _____ to understand without help.|Les instructions sont assez claires pour être comprises sans aide.
''')
G('Quantité indénombrable','much/many/several/a few',[
'Much accompagne ce qu’on ne compte pas directement, comme le temps ou l’argent.',
'Many accompagne des choses comptables au pluriel, comme many files.',
'Several accompagne un nom comptable au pluriel, comme several minutes.',
'A few accompagne un nom comptable au pluriel, comme a few chairs.'],
'On ne compte pas directement ce nom : on utilise une quantité.','Not much + nom indénombrable = pas beaucoup de…', '''
We do not have _____ time before the meeting.|Nous n’avons pas beaucoup de temps avant la réunion.
The company does not have _____ money for advertising.|L’entreprise n’a pas beaucoup d’argent pour la publicité.
There is not _____ information in this report.|Il n’y a pas beaucoup d’informations dans ce rapport.
We do not need _____ furniture for this small office.|Nous n’avons pas besoin de beaucoup de meubles pour ce petit bureau.
''')
G('Leur, leurs','their/they/them/theirs',[
'Their se place devant ce qui appartient aux personnes : leurs coordonnées, leurs idées…',
'They veut dire ils ou elles et sert de sujet.',
'Them remplace des personnes après un verbe ou une préposition, pas devant ce nom.',
'Theirs remplace déjà ce qui leur appartient. On n’ajoute pas de nom juste après.'],
'Le mot indique à qui appartient la chose placée juste après.','Their + nom = leur ou leurs.', '''
Employees should update _____ contact details.|Les employés doivent mettre leurs coordonnées à jour.
The visitors left _____ coats at reception.|Les visiteurs ont laissé leurs manteaux à l’accueil.
The managers presented _____ plans to the board.|Les responsables ont présenté leurs projets au conseil.
Customers can track _____ orders online.|Les clients peuvent suivre leurs commandes en ligne.
''')
G('Possession, une entreprise','its/it’s/it/itself',[
'Its indique ce qui appartient à l’entreprise ou à la chose.',
'It’s veut dire it is ou it has. Ce n’est pas son ou sa.',
'It remplace une chose mais n’indique pas la possession devant un nom.',
'Itself veut dire lui-même ou elle-même. Ce n’est pas son ou sa.'],
'La chose qui suit appartient au sujet de la phrase.','Its + nom = son, sa ou ses, pour une chose ou une organisation.', '''
The company will update _____ website next week.|L’entreprise mettra son site à jour la semaine prochaine.
The hotel has reopened _____ swimming pool.|L’hôtel a rouvert sa piscine.
The restaurant changed _____ menu last month.|Le restaurant a changé sa carte le mois dernier.
The museum extended _____ opening hours.|Le musée a prolongé ses heures d’ouverture.
''')
G('Qui, une personne','who/which/whose/whom',[
'Who reprend une personne qui fait l’action juste après.',
'Which reprend généralement une chose. Ici, c’est une personne.',
'Whose indique à qui appartient quelque chose ; il faudrait ici un nom après.',
'Whom reçoit l’action. Ici, la personne fait l’action : on utilise who.'],
'La personne dont on parle fait l’action juste après le trou.','Personne + who + verbe = la personne qui…', '''
The employee _____ organised the event won an award.|L’employé qui a organisé l’événement a reçu une récompense.
The customer _____ called yesterday wants a refund.|Le client qui a appelé hier souhaite un remboursement.
The engineer _____ designed this machine works in Brussels.|L’ingénieur qui a conçu cette machine travaille à Bruxelles.
The assistant _____ booked the tickets is on holiday.|L’assistant qui a réservé les billets est en vacances.
''')
G('Cause devant un nom','because of/because/although/so that',[
'Because of veut dire à cause de et peut être suivi de cette chose.',
'Because veut dire parce que : il faudrait dire ce qui se passe, avec un sujet et un verbe.',
'Although veut dire bien que et demande ici une phrase avec un sujet et un verbe.',
'So that veut dire pour que ; il faudrait un sujet et un verbe après.'],
'Après le trou, il y a une chose, pas une phrase complète.','Because of + chose ; because + sujet + verbe.', '''
The event was cancelled _____ the storm.|L’événement a été annulé à cause de la tempête.
The delivery was delayed _____ heavy traffic.|La livraison a été retardée à cause de la circulation dense.
The office closed early _____ a power failure.|Le bureau a fermé tôt à cause d’une panne de courant.
The price increased _____ higher transport costs.|Le prix a augmenté à cause de frais de transport plus élevés.
''')
G('Accord au présent','works/work/working/to work',[
'Le sujet est une seule personne : au présent, on ajoute s à work.',
'Work sans s convient notamment avec they, pas avec ce sujet singulier.',
'Working seul ne constitue pas un verbe conjugué complet.',
'To work n’est pas le verbe conjugué nécessaire ici.'],
'Une seule personne et une habitude au présent.','He / she + works : le s marque le présent au singulier.', '''
Our receptionist _____ from eight to four every weekday.|Notre réceptionniste travaille de huit à seize heures chaque jour de semaine.
The accountant usually _____ from home on Fridays.|Le comptable travaille généralement chez lui le vendredi.
My colleague _____ in the marketing department.|Mon collègue travaille au service marketing.
The director _____ closely with the design team.|Le directeur travaille en étroite collaboration avec l’équipe de conception.
''')
G('Action passée terminée','visited/visits/has visited/visiting',[
'Visited est au passé. Le moment indiqué est terminé.',
'Visits est au présent. La phrase situe l’action dans le passé.',
'Has visited ne s’utilise pas ici avec ce moment passé terminé.',
'Visiting seul n’est pas un verbe conjugué complet.'],
'Repère le moment terminé : yesterday, last… ou ago.','Moment passé terminé → past simple : visited.', '''
The CEO _____ our factory last Tuesday.|Le PDG a visité notre usine mardi dernier.
Our supplier _____ the warehouse yesterday.|Notre fournisseur a visité l’entrepôt hier.
The inspector _____ the restaurant two days ago.|L’inspecteur a visité le restaurant il y a deux jours.
The manager _____ our Paris office last month.|Le responsable a visité notre bureau parisien le mois dernier.
''')
G('Condition future','will send/sent/sending/has sent',[
'Will send indique ce qui se passera si la condition se réalise.',
'Sent est au passé. Ici, le résultat attendu est futur.',
'Sending seul n’est pas un verbe conjugué complet.',
'Has sent dit que l’envoi a déjà eu lieu ; ici, on attend la condition.'],
'Si la condition se réalise, que fera la personne ensuite ?','If + présent, puis will + verbe pour ce résultat futur.', '''
If you confirm today, I _____ the contract tomorrow.|Si tu confirmes aujourd’hui, j’enverrai le contrat demain.
If the payment arrives, we _____ your order tomorrow.|Si le paiement arrive, nous enverrons ta commande demain.
If you provide your address, the assistant _____ the brochure next week.|Si tu donnes ton adresse, l’assistant enverra la brochure la semaine prochaine.
If the director agrees, she _____ the invitation tomorrow.|Si le directeur est d’accord, elle enverra l’invitation demain.
''')
G('Sans aide, eux-mêmes','themselves/their/they/theirs',[
'By themselves veut dire eux-mêmes, sans aide.',
'Their doit être suivi d’un nom, comme their work.',
'They sert de sujet et ne vient pas après by ici.',
'Theirs veut dire le leur ou les leurs. Il ne veut pas dire eux-mêmes.'],
'Les personnes ont tout fait sans aide.','By themselves = seuls, sans aide.', '''
The employees built the display by _____, without outside help.|Les employés ont construit le présentoir eux-mêmes, sans aide extérieure.
The managers organised the event by _____, without an agency.|Les responsables ont organisé l’événement eux-mêmes, sans agence.
The trainees completed the task by _____, without a supervisor.|Les stagiaires ont terminé la tâche eux-mêmes, sans superviseur.
The owners decorated the shop by _____, without a designer.|Les propriétaires ont décoré la boutique eux-mêmes, sans décorateur.
''')
G('Nom : approbation','approval/approve/approves/approved',[
'Approval est un nom : l’accord ou l’approbation.',
'Approve est un verbe : approuver. Ici, on cherche une chose.',
'Approves est un verbe conjugué. Ici, il faut un nom.',
'Approved signifie approuvé. Ce mot ne désigne pas l’accord lui-même.'],
'On cherche le nom de l’autorisation donnée.','Approval = accord, approbation.', '''
We need the director’s _____ before signing.|Nous avons besoin de l’accord du directeur avant de signer.
The project cannot start without official _____.|Le projet ne peut pas commencer sans approbation officielle.
Please obtain written _____ for this expense.|Merci d’obtenir un accord écrit pour cette dépense.
The manager gave her _____ yesterday.|La responsable a donné son accord hier.
''')
G('Action prévue avec will','arrive/arrives/arriving/arrived',[
'Après will, on garde la forme simple : arrive.',
'On n’ajoute pas de s au verbe après will.',
'Arriving ne suit pas directement will ; il faudrait une autre construction.',
'Arrived est au passé. Après will, on garde arrive.'],
'Le mot juste avant le trou est will.','Will + verbe simple : will arrive = arrivera.', '''
The delivery will _____ before noon.|La livraison arrivera avant midi.
Our guests will _____ at six o’clock.|Nos invités arriveront à six heures.
The replacement parts will _____ next week.|Les pièces de rechange arriveront la semaine prochaine.
The new employee will _____ on Monday.|Le nouvel employé arrivera lundi.
''')
G('Après enjoy','working/work/worked/to work',[
'Après enjoy, on utilise ici working : aimer travailler.',
'Work seul ne suit pas enjoy dans cette construction.',
'Worked est au passé et ne convient pas après enjoy ici.',
'Enjoy ne se construit pas avec to work. On utilise working.'],
'Après enjoy, le verbe prend une terminaison particulière.','Enjoy + verbe en -ing : enjoy working.', '''
Our employees enjoy _____ together.|Nos employés aiment travailler ensemble.
She enjoys _____ with international clients.|Elle aime travailler avec des clients internationaux.
The designer enjoys _____ on creative projects.|Le designer aime travailler sur des projets créatifs.
I enjoy _____ in a small team.|J’aime travailler dans une petite équipe.
''')

E('Respecter une échéance','meet/attend/join/arrive','L’équipe veut finir à temps.','Meet a deadline = respecter une échéance.','''
We must _____ the deadline for the annual report.|Nous devons respecter la date limite du rapport annuel.
The team worked late to _____ the deadline.|L’équipe a travaillé tard pour respecter l’échéance.
''')
E('Passer une commande','place/spend/borrow/attend','On veut commander quelque chose.','Place an order = passer une commande.','''
Please _____ an order for twenty chairs.|Merci de passer une commande de vingt chaises.
We will _____ an order with our usual supplier.|Nous passerons une commande auprès de notre fournisseur habituel.
''')
E('Demander à obtenir','for/at/with/on','Repère apply : on demande à obtenir quelque chose.','Apply for something = faire une demande pour obtenir quelque chose.','''
You can apply _____ a refund on our website.|Tu peux demander un remboursement sur notre site.
She plans to apply _____ the manager’s position.|Elle prévoit de postuler au poste de responsable.
''')
E('Responsable de','for/at/with/by','La phrase indique la tâche dont la personne est responsable.','Responsible for = responsable de.','''
Our assistant is responsible _____ booking flights.|Notre assistant est responsable de la réservation des vols.
The supervisor is responsible _____ checking the equipment.|Le superviseur est responsable de la vérification du matériel.
''')
E('Participer à','take/make/do/give','On invite les personnes à participer.','Take part in = participer à.','''
All staff can _____ part in the training.|Tout le personnel peut participer à la formation.
We hope you will _____ part in the survey.|Nous espérons que tu participeras à l’enquête.
''')
E('À jour','date/day/year/hour','Il faut garder les informations actuelles.','Up to date = à jour.','''
Please keep your contact details up to _____.|Merci de garder tes coordonnées à jour.
Our customer database is now up to _____.|Notre base de données clients est maintenant à jour.
''')
E('Gratuit','charge/price/salary/fee','Le client ne doit rien payer.','Free of charge = gratuit, sans frais.','''
Delivery is free of _____ for orders over fifty euros.|La livraison est gratuite pour les commandes de plus de cinquante euros.
The hotel provides breakfast free of _____.|L’hôtel propose le petit-déjeuner gratuitement.
''')
E('Sous garantie','warranty/invoice/receipt/purchase','Le fabricant couvre encore les réparations.','Under warranty = sous garantie.','''
The printer is still under _____.|L’imprimante est encore sous garantie.
Repairs are free while the device is under _____.|Les réparations sont gratuites tant que l’appareil est sous garantie.
''')
E('Au nom de','behalf/purpose/regard/side','Une personne parle pour tout un groupe.','On behalf of = au nom de.','''
On _____ of the team, thank you for your help.|Au nom de l’équipe, merci pour ton aide.
She signed the letter on _____ of the director.|Elle a signé la lettre au nom du directeur.
''')
E('À l’avance','advance/ahead/early/front','L’action doit se faire avant la date prévue.','In advance = à l’avance.','''
Please book your room in _____.|Merci de réserver ta chambre à l’avance.
Participants must pay two weeks in _____.|Les participants doivent payer deux semaines à l’avance.
''')
E('Être chargé de','charge/duty/task/role','La personne organise ou dirige l’activité.','In charge of = chargé de, responsable de.','''
Who is in _____ of the sales team?|Qui est responsable de l’équipe commerciale ?
She is in _____ of organising the event.|Elle est chargée d’organiser l’événement.
''')
E('Suivre quelque chose','track/care/attention/part','On veut savoir où en sont les dossiers.','Keep track of = suivre, tenir le suivi de.','''
This tool helps us keep _____ of all orders.|Cet outil nous aide à suivre toutes les commandes.
Please keep _____ of your travel expenses.|Merci de tenir le suivi de tes frais de déplacement.
''')
E('Peu de préavis','notice/news/message/warning','La personne a été prévenue peu de temps avant.','At short notice = avec peu de préavis.','''
Thank you for coming at such short _____.|Merci d’être venu avec si peu de préavis.
It is difficult to find a replacement at short _____.|Il est difficile de trouver un remplaçant avec peu de préavis.
''')
E('Par écrit','writing/write/wrote/written','La confirmation doit être écrite.','In writing = par écrit.','''
Please confirm the agreement in _____.|Merci de confirmer l’accord par écrit.
All complaints must be submitted in _____.|Toutes les plaintes doivent être envoyées par écrit.
''')
E('Voyage d’affaires','trip/route/traffic/transport','La personne voyage pour son travail.','Business trip = voyage d’affaires.','''
He is on a business _____ in Madrid.|Il est en voyage d’affaires à Madrid.
The company paid for her business _____.|L’entreprise a payé son voyage d’affaires.
''')
E('De suite','row/line/queue/rank','Les périodes se suivent sans interruption.','In a row = de suite, consécutivement.','''
Sales increased for the fourth month in a _____.|Les ventes ont augmenté pour le quatrième mois de suite.
Our hotel won the award three years in a _____.|Notre hôtel a remporté le prix trois années de suite.
''')
E('Rupture de stock','stock/sale/invoice/receipt','Il n’en reste plus à vendre ; de nouveaux exemplaires arrivent bientôt.','Out of stock = en rupture de stock.','''
This model is out of _____; more units will arrive tomorrow.|Ce modèle est en rupture de stock ; d’autres exemplaires arriveront demain.
The paper is out of _____, so we must wait for the next delivery.|Le papier est en rupture de stock, nous devons donc attendre la prochaine livraison.
''')
E('Appareil en panne','order/stock/sequence/arrangement','L’appareil ne fonctionne plus.','Out of order = en panne.','''
The lift is out of _____; please use the stairs.|L’ascenseur est en panne ; merci d’utiliser les escaliers.
This coffee machine is out of _____ and needs repair.|Cette machine à café est en panne et doit être réparée.
''')
E('Conformément à','accordance/according/accordingly/accorded','Respecter une règle : in … with.','In accordance with = conformément à.','''
Payments must be made in _____ with the contract.|Les paiements doivent être faits conformément au contrat.
The equipment was installed in _____ with safety rules.|Le matériel a été installé conformément aux règles de sécurité.
''')
E('Selon','to/with/for/at','Repère according : quel petit mot vient avec lui ?','According to = selon.','''
According _____ the report, sales are rising.|Selon le rapport, les ventes augmentent.
The shop closes at six, according _____ its website.|La boutique ferme à six heures, selon son site.
''')
E('Attendre avec plaisir','to/for/at/on','On se réjouit de ce qui va arriver.','Look forward to + nom ou -ing = attendre avec plaisir.','''
We look forward _____ welcoming you.|Nous nous réjouissons de t’accueillir.
I look forward _____ hearing from you.|J’attends ta réponse avec plaisir.
''')
E('Se conformer aux règles','with/to/for/on','Respecter des règles se dit comply…','Comply with = se conformer à.','''
All drivers must comply _____ safety regulations.|Tous les conducteurs doivent respecter les règles de sécurité.
Our products comply _____ international standards.|Nos produits sont conformes aux normes internationales.
''')
E('Compter sur','on/at/with/for','Rely signifie compter sur quelqu’un.','Rely on = compter sur.','''
We rely _____ our suppliers to deliver on time.|Nous comptons sur nos fournisseurs pour livrer à temps.
You can rely _____ our support team.|Tu peux compter sur notre équipe d’assistance.
''')
E('S’occuper de demandes','with/at/for/on','Deal… signifie ici traiter ou gérer.','Deal with = traiter, s’occuper de.','''
Our team will deal _____ your complaint.|Notre équipe traitera ta réclamation.
The receptionist deals _____ customer enquiries.|Le réceptionniste traite les demandes des clients.
''')
E('Faire attention','pay/make/do/hold','On demande d’être attentif.','Pay attention to = faire attention à.','''
Please _____ attention to the safety instructions.|Merci de faire attention aux consignes de sécurité.
Drivers must _____ attention to the road signs.|Les conducteurs doivent faire attention aux panneaux routiers.
''')
E('Prendre contact','touch/reach/call/speak','Une expression pour contacter quelqu’un : get in…','Get in touch with = prendre contact avec.','''
Please get in _____ with our office.|Merci de prendre contact avec notre bureau.
The supplier will get in _____ with you tomorrow.|Le fournisseur prendra contact avec toi demain.
''')
E('Effectuer','carry/turn/put/bring','Il faut réaliser une inspection ou un contrôle.','Carry out = effectuer, réaliser.','''
The engineer will _____ out a safety inspection.|L’ingénieur effectuera une inspection de sécurité.
We must _____ out regular checks on the machine.|Nous devons effectuer des contrôles réguliers sur la machine.
''')
E('Organiser une réunion','set/take/give/break','L’expression avec up signifie organiser.','Set up = organiser, mettre en place.','''
Can you _____ up a meeting with the client?|Peux-tu organiser une réunion avec le client ?
Our assistant will _____ up a video conference.|Notre assistant organisera une visioconférence.
''')
E('Reporter','put/take/turn/set','La date est repoussée à plus tard.','Put off = reporter à plus tard.','''
We have to _____ off the meeting until Friday.|Nous devons reporter la réunion à vendredi.
They decided to _____ off the launch until next month.|Ils ont décidé de reporter le lancement au mois prochain.
''')
E('Refuser une offre','down/off/into/out','Turn… signifie ici refuser.','Turn down = refuser une offre ou une demande.','''
She turned _____ the job offer because the salary was too low.|Elle a refusé l’offre d’emploi car le salaire était trop bas.
The bank turned _____ our loan application.|La banque a refusé notre demande de prêt.
''')
E('Remplir les informations','fill/come/break/set','On complète ce qui manque sur un document.','Fill in = remplir, compléter.','''
Please _____ in the missing details on the form.|Merci de compléter les informations manquantes sur le formulaire.
You must _____ in your name and address in the spaces below.|Tu dois inscrire ton nom et ton adresse dans les espaces ci-dessous.
''')
E('Ne plus avoir','out/away/over/through','Le stock est épuisé : run… of.','Run out of = ne plus avoir, épuiser son stock de.','''
We have run _____ of printer paper.|Nous n’avons plus de papier pour l’imprimante.
The restaurant ran _____ of coffee this morning.|Le restaurant n’avait plus de café ce matin.
''')
E('Licencier du personnel','lay/pick/resign/remove','L’entreprise doit supprimer des emplois : … off.','Lay off = licencier, souvent pour des raisons économiques.','''
The factory may _____ off workers because of falling sales.|L’usine pourrait licencier des ouvriers à cause de la baisse des ventes.
The company had to _____ off ten employees.|L’entreprise a dû licencier dix employés.
''')
E('Examiner un problème','into/after/forward/between','L’équipe va chercher ce qui ne fonctionne pas.','Look into = examiner, enquêter sur.','''
The manager will look _____ the cause of the delay.|Le responsable examinera la cause du retard.
Our team is looking _____ the billing error.|Notre équipe examine l’erreur de facturation.
''')
E('Annuler','off/away/down/over','Call… signifie ici annuler complètement.','Call off = annuler.','''
They had to call _____ the outdoor event because of the storm.|Ils ont dû annuler l’événement extérieur à cause de la tempête.
The organisers will call _____ the concert if it is unsafe.|Les organisateurs annuleront le concert si les conditions sont dangereuses.
''')
E('Réduire','cut/make/take/give','On veut réduire une consommation : … down on.','Cut down on = réduire sa consommation de.','''
We should _____ down on unnecessary printing.|Nous devrions réduire les impressions inutiles.
The office wants to _____ down on electricity use.|Le bureau veut réduire sa consommation d’électricité.
''')
E('Proposer une idée','come/make/bring/send','Trouver une idée se dit … up with.','Come up with = trouver, proposer une idée.','''
We need to _____ up with a better solution.|Nous devons trouver une meilleure solution.
Can you _____ up with a name for the new product?|Peux-tu trouver un nom pour le nouveau produit ?
''')
E('Provisoirement','being/been/be/was','Il s’agit d’une solution pour le moment.','For the time being = pour le moment.','''
We will use the old system for the time _____.|Nous utiliserons l’ancien système pour le moment.
For the time _____, the office will remain closed.|Pour le moment, le bureau restera fermé.
''')
E('Dès que possible','as/than/like/so','As soon… possible signifie dès que possible.','As soon as possible = dès que possible.','''
Please reply as soon _____ possible.|Merci de répondre dès que possible.
The technician will visit as soon _____ possible.|Le technicien passera dès que possible.
''')
E('Au plus tard','than/that/then/as','No later… indique la dernière date possible.','No later than = au plus tard.','''
Send your application no later _____ Friday.|Envoie ta candidature au plus tard vendredi.
Payment must arrive no later _____ the fifth of May.|Le paiement doit arriver au plus tard le cinq mai.
''')
E('À côté de','to/with/at/for','Next… indique ce qui se trouve juste à côté.','Next to = à côté de.','''
The meeting room is next _____ reception.|La salle de réunion est à côté de l’accueil.
Our new shop is next _____ the station.|Notre nouvelle boutique est à côté de la gare.
''')
E('En plus de','addition/additional/additionally/added','L’expression introduit une chose supplémentaire.','In addition to = en plus de.','''
In _____ to her salary, she receives a bonus.|En plus de son salaire, elle reçoit une prime.
We offer training in _____ to technical support.|Nous proposons une formation en plus de l’assistance technique.
''')
E('En raison de','due/owed/owing/because','Le mot suivant le trou est to.','Due to = en raison de. Owing s’utilise avec to, mais pas owed : attention aux choix.','''
The flight was delayed _____ to fog.|Le vol a été retardé en raison du brouillard.
The office is closed _____ to renovation work.|Le bureau est fermé en raison de travaux de rénovation.
''')
E('À la demande','request/ask/requested/requesting','L’expression signifie si quelqu’un le demande.','On request = sur demande.','''
Further information is available on _____.|Des informations complémentaires sont disponibles sur demande.
We can provide a printed copy on _____.|Nous pouvons fournir un exemplaire papier sur demande.
''')
E('À temps','time/hour/clock/minute','On arrive avant qu’il ne soit trop tard : in…','In time = à temps.','''
The parcel arrived just in _____ for the exhibition.|Le colis est arrivé juste à temps pour l’exposition.
We finished the repairs in _____ for the reopening.|Nous avons terminé les réparations à temps pour la réouverture.
''')
E('D’avance sur le planning','ahead/before/early/front','La tâche est finie plus tôt que prévu : … of schedule.','Ahead of schedule = en avance sur le planning.','''
The team completed the project _____ of schedule.|L’équipe a terminé le projet en avance sur le planning.
The renovation is running _____ of schedule.|La rénovation avance plus vite que prévu.
''')
E('Dans les limites du budget','within/among/between/along','Les dépenses ne dépassent pas la somme prévue.','Within budget = dans les limites du budget.','''
We must keep the project _____ budget.|Nous devons garder le projet dans les limites du budget.
The repairs were completed _____ budget.|Les réparations ont été terminées sans dépasser le budget.
''')
E('En cas de','case/event/situation/condition','Une consigne pour une éventuelle urgence : in… of.','In case of = en cas de.','''
In _____ of fire, use the stairs.|En cas d’incendie, utilise les escaliers.
Call this number in _____ of an emergency.|Appelle ce numéro en cas d’urgence.
''')
E('Changer d’avis','mind/thought/idea/brain','La personne ne veut plus la même chose : change one’s…','Change your mind = changer d’avis.','''
Let us know if you change your _____.|Préviens-nous si tu changes d’avis.
The customer changed her _____ and chose another colour.|La cliente a changé d’avis et choisi une autre couleur.
''')
E('Être en congé','leave/left/leaving/leaves','La personne ne travaille pas pendant quelques jours.','On leave = en congé.','''
Our manager is on annual _____ this week.|Notre responsable est en congé annuel cette semaine.
Please contact her assistant while she is on _____.|Merci de contacter son assistant pendant son congé.
''')

# Carefully remove alternatives that would produce another correct expression.
for q in expressions:
    if q['topic']=='Gratuit':
        q['options'][3]='invoice'
    if q['topic']=='Changer d’avis':
        q['options'][2]='minded'
    if q['topic']=='En raison de':
        q['options'][2]='cause'
        q['rule']='Due to = en raison de.'
        q['notes']=[q['rule']]+[f'« {w} to » ne convient pas ici. Due to = en raison de.' for w in q['options'][1:]]
    if q['topic']=='En cas de':
        q['options'][1]='happens'
        q['notes']=[q['rule']]+[f'« In {w} of » ne forme pas cette expression. '+q['rule'] for w in q['options'][1:]]

from feedback_notes import expression_notes
for q in expressions:
    if q['topic'] in expression_notes:
        details=expression_notes[q['topic']]
        q['notes']=[q['rule']]+[details[w] for w in q['options'][1:]]

assert len(grammar)==100, len(grammar)
assert len(expressions)==100, len(expressions)
bank=[]
# Interleave topics across the bank, not four near-identical rules in a row.
grammar=[grammar[t*4+v] for v in range(4) for t in range(25)]
expressions=[expressions[t*2+v] for v in range(2) for t in range(50)]
for g,e in zip(grammar,expressions):
    bank.extend([g,e])
for i,q in enumerate(bank):
    permutation=list(range(4))
    random.Random(931+i).shuffle(permutation)
    q['answer']=permutation.index(0)
    q['options']=[q['options'][j] for j in permutation]
    q['feedback']=[q['notes'][j] for j in permutation]
    del q['notes']
    q['id']=f'q{i+1:03}'
# These published questions keep their IDs AND option order so existing answers remain valid.
published=json.loads(Path('questions-reviewed.json').read_text())
assert len(published) >= 200
for i,q in enumerate(published):
    if i >= 200:
        break
    assert q['id']==bank[i]['id'] and q['sentence']==bank[i]['sentence']
    bank[i]=q

def load_extra(path, category, expected_topics, rows_per_topic):
    groups=[]
    current=None
    for raw in Path(path).read_text().splitlines():
        line=raw.strip()
        if not line:
            continue
        if line.startswith('# '):
            current={'topic':line[2:],'rows':[]}
            groups.append(current)
            continue
        assert current is not None and line.count('|')==1, (path,line)
        sentence,translation=line.split('|')
        current['rows'].append((sentence,translation))
    assert len(groups)==expected_topics, (path,len(groups))
    assert all(len(g['rows'])==rows_per_topic for g in groups), [(g['topic'],len(g['rows'])) for g in groups]
    templates={q['topic']:q for q in bank[:200] if q['category']==category}
    assert set(g['topic'] for g in groups)==set(templates), (path,set(templates)-set(g['topic'] for g in groups))
    # Spread repeated rules apart: one new example of every topic, then the next example.
    result=[]
    for variant in range(rows_per_topic):
        for group in groups:
            base=templates[group['topic']]
            sentence,translation=group['rows'][variant]
            result.append(dict(category=category,topic=group['topic'],sentence=sentence,
                translation=translation,options=list(base['options']),hint=base['hint'],
                rule=base['rule'],answer=base['answer'],feedback=list(base['feedback'])))
    return result

extra_grammar=load_extra('extra_grammar.tsv','Grammaire',25,6)
extra_expressions=load_extra('extra_expressions.tsv','Expression professionnelle',50,3)
assert len(extra_grammar)==len(extra_expressions)==150
for g,e in zip(extra_grammar,extra_expressions):
    bank.extend([g,e])
for i,q in enumerate(bank[200:],start=200):
    permutation=list(range(4))
    random.Random(1931+i).shuffle(permutation)
    old_answer=q['answer']
    q['answer']=permutation.index(old_answer)
    q['options']=[q['options'][j] for j in permutation]
    q['feedback']=[q['feedback'][j] for j in permutation]
    q['id']=f'q{i+1:03}'
assert len(bank)==500
duplicates=[]
seen=set()
for q in bank:
    if q['sentence'] in seen:
        duplicates.append(q['sentence'])
    seen.add(q['sentence'])
assert not duplicates, duplicates
for q in bank:
    assert q['sentence'].count('_____')==1
    assert len(set(q['options']))==4
    assert all(q['feedback']) and q['translation'] and q['hint']
Path('public/student/questions.js').write_text('window.TOEIC_QUESTIONS = '+json.dumps(bank,ensure_ascii=False,separators=(',',':'))+';\n')
Path('questions-reviewed.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n')
print(f'{len(bank)} questions: 250 grammar, 250 professional expressions.')
