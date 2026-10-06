# Page Promo, livraison, Jawan 28, découpe et conseiller IA

## 1. Page Promo (/promo)
- Nouvelle page séparée « Promotions », avec un lien « Promo » dans le menu et un bandeau discret sur l'accueil quand une promo fête est ouverte.
- **Promo Djawan** : toujours ouverte, 12 mois sur 12.
- **Promos fêtes** : Ramadan, Tabaski, Maouloud, Achoura. Chacune s'ouvre automatiquement **1 mois avant** le jour de la fête et se ferme **48 h après**.
  - Jour retenu : Ramadan = Aïd el-Fitr (fin du Ramadan), Tabaski = Aïd el-Kébir, Maouloud = naissance du Prophète, Achoura = 10 Muharram.
  - Dates calculées automatiquement par le calendrier islamique. Un écart d'un jour avec l'annonce officielle au Mali est possible.
- Chaque promo a sa carte premium : nom, compte à rebours avant la fête ou la fermeture, offre, et bouton « Profiter de l'offre » vers WhatsApp. Les promos fermées affichent « Prochaine ouverture le … ».
- **Contenu des offres** : non fourni. Le site affiche « Offre dévoilée prochainement » jusqu'à ce que vous donniez les remises réelles. Aucune réduction n'est inventée.

## 2. Livraison dans le panier
- Avant « Valider sur WhatsApp » : nom, commune ou quartier, date ou créneau souhaité, remarque. Nom et quartier obligatoires.
- Ces informations sont ajoutées au message WhatsApp.

## 3. Simulateur Jawan 28 / Avatar Crédit
- Dans la section Avatar Crédit : choix d'une box ou du total du panier, puis affichage de 3 parts égales (jour 0, jour 14, jour 28).
- Bouton « Demander l'éligibilité sur WhatsApp » avec message prérempli. Mention « Sous réserve de validation par Djawan ». Aucun frais ajouté.

## 4. Préférence de découpe
- Sur chaque fiche et dans la Box Mélange : choix facultatif (dés pour sauce, grosses pièces, morceaux pour soupe, tranches fines, sans préférence).
- Affiché dans le panier et dans le message WhatsApp. Deux découpes différentes donnent deux articles distincts.

## 5. Conseiller culinaire IA
- Section « Votre boucher conseil » près du catalogue : le client décrit son plat et le nombre de personnes.
- L'assistant propose 2 à 3 viandes du catalogue avec une phrase d'explication et un format conseillé, et un bouton « Ajouter au panier ».
- Il ne recommande que des viandes du catalogue et n'invente ni prix ni promesse.

## Détails techniques
- `src/data/djawan.ts` : `promos` (id, nom, type `permanent` ou fête, mois/jour hégirien, champ `offer` vide par défaut), et `cutOptions`.
- `src/lib/promo.ts` : calcul des dates via `Intl.DateTimeFormat("fr-u-ca-islamic-umalqura")` (recherche du jour grégorien), fenêtre = fête −1 mois → fête +48 h. Statut calculé après hydratation pour éviter les décalages SSR.
- Route `src/routes/promo.tsx` avec son propre `head()`. Lien ajouté dans le Header et le Footer. Ajout de la règle dans AGENTS.md (l'accueil reste une page à ancres, la promo est la seule page séparée).
- Panier : champ `cut` sur chaque ligne (clé de ligne incluant la découpe) ; état livraison dans le contexte panier ; `cartMessage` enrichi.
- IA : activer la clé Lovable AI, `src/lib/advisor.functions.ts` (createServerFn POST, validation zod), helper serveur Responses API, modèle `openai/gpt-6-astra`, streaming consommé côté serveur, sortie JSON stricte avec `meatId` limité aux ids du catalogue. Gestion des erreurs 402/429 avec message clair.
- Vérification dans le navigateur : page promo, formulaire livraison, simulateur, découpe, conseiller.
