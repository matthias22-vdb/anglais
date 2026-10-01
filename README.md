# ENGLISH POCKET EXAM — 500 questions

Connexion personnelle gérée par l’authentification de la plateforme : l’application ne stocke aucun mot de passe d’élève. Lors de sa première connexion, l’élève saisit le code transmis par son professeur afin de rejoindre sa classe.

Application statique en français pour s’entraîner à la partie 5 : 250 questions de grammaire et 250 expressions professionnelles en alternance. Vingt-cinq séries de vingt, quatre choix corrigés en un toucher, traduction, indice, explications des quatre choix et révision des erreurs. Taille de lecture réglable. La couche ludique ajoute des points, une série de bonnes réponses et une mission quotidienne de dix nouvelles questions.

`python3 build_questions.py` génère `questions-reviewed.json` et `public/student/questions.js`. `feedback_notes.py` contient les explications propres aux expressions. Les 200 premières questions publiées sont conservées à l’identique pour préserver la progression existante et les indices des réponses. Les exemples supplémentaires sont regroupés dans `extra_grammar.tsv` et `extra_expressions.tsv`.

La progression reste sauvegardée localement et un résumé est synchronisé vers une base protégée lorsqu’un élève rattaché à une classe répond. L’espace professeur `/teacher` permet de créer plusieurs classes, fournit un code différent pour chacune et affiche uniquement les élèves appartenant aux classes du professeur connecté. En cas d’indisponibilité du réseau, l’entraînement local continue. Le mode hors ligne complet et l’installation ne sont pas encore implémentés.

Révision éditoriale des phrases, traductions et choix, notamment des expressions pouvant admettre plusieurs compléments. Certaines notions reviennent dans plusieurs contextes. Contenu original non officiel, sans certification ETS ni validation externe par un enseignant.

Vérification : `node tests/quiz-flow.test.cjs` contrôle la banque, la conservation des 200 premières questions et simule le parcours complet, la révision, la sauvegarde et les états d’erreur. `node --check public/student/app.js` et le build complet vérifient la syntaxe et l’intégration de l’espace professeur. Ces contrôles ne remplacent pas un test final sur plusieurs comptes réels.
