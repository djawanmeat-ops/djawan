# Catalogue « Nos Box » avec panier

## Ce qui change pour le client
- La section Nos Box devient un vrai catalogue avec les **14 viandes** de la grille : hachée, sans graisse, beef steak, côte de bœuf, viande avec os, foie et cœur, rognon, os de viande, mouton, filet de bœuf, poulet entier, blanc, cuisse et aile de poulet.
- Les viandes sont rangées par famille, avec des filtres : Bœuf, Mouton, Abats et os, Poulet, Mélange.
- Chaque fiche montre une photo, le prix au kg et 4 formats à choisir : Découverte 5 kg, Familiale 10 kg, Conviviale 15 kg, Festive 20 kg. Le prix de la box s'affiche selon le format choisi, avec un bouton « Ajouter au panier ».
- **Box Mélange** : le client choisit d'abord un format, puis répartit ses viandes kilo par kilo. Le total se calcule tout seul. Le bouton d'ajout n'est actif que si le poids est exactement atteint, par exemple 5/5 kg.
- **Panier** : il s'ouvre en panneau latéral depuis l'icône du menu, qui affiche le nombre d'articles. On peut y changer les quantités, retirer un article et voir le total en FCFA. Le panier reste enregistré si on recharge la page.
- **Valider** : le bouton envoie le panier sur WhatsApp dans un message déjà rempli, avec le détail, les poids, les prix et le total.
- Les prix sont affichés au format « 30 000 FCFA », exactement selon la grille, sans aucun frais ajouté.

## Photos
- 14 photos, une par viande, toujours selon la règle de la cliente : les paquets sous vide étiquetés sont posés dans le carton kraft Djawan, et la viande n'est jamais posée sur une table. Plus une photo pour la Box Mélange.
- Les anciennes Box Découverte, Family, Conviviale et Festin deviennent les 4 formats : Découverte, Familiale, Conviviale, Festive.

## Autres ajustements
- La règle « ne jamais afficher de prix » est remplacée par « afficher les prix de la grille officielle » dans la mémoire du projet.
- Les mentions de la FAQ et de l'Avatar Crédit sont mises à jour avec les nouveaux noms de formats.

## Détails techniques
- `src/data/djawan.ts` : `meats` (id, nom, catégorie, prix/kg, image), `formats` (nom, kg) et les fonctions de calcul du prix.
- Un contexte panier côté navigateur, enregistré dans localStorage et lu après hydratation. Les lignes du panier sont soit une box d'une seule viande, soit une box Mélange avec sa composition.
- Nouveaux composants : `ProductCard`, `CategoryFilter`, `MixBuilder`, `CartDrawer` (avec le Sheet de shadcn), `CartButton` dans le Header.
- Le message WhatsApp est construit à partir du panier avec la fonction `whatsappUrl()` existante. Le numéro officiel n'est toujours pas renseigné.
- Le site reste une seule page, avec l'ancre `#box`.
