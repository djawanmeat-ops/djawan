# Page Promo pilotée par back-office + finitions

## 1. Page Promo (/promo)

- Toutes les promotions sont listées : Promo Djawan, Ramadan, Tabaski, Maouloud, Achoura.
- Chaque carte affiche seulement le nom et une courte description premium.
- **Promo active** : carte mise en valeur, détail de l'offre visible, bouton « Profiter de l'offre » vers WhatsApp.
- **Promo inactive** : carte grisée, mention « Indisponible ». Le type et le contenu de l'offre (remise, 1 acheté 1 offert, etc.) sont masqués. Au clic, une notification : « Cette offre n'est pas encore disponible, à très bientôt. »
- Par défaut : Promo Djawan active, toutes les autres désactivées.
- Le bandeau sur l'accueil n'apparaît que lorsqu'une promo fête est activée.

## 2. Back-office administrateur

- Activation de Lovable Cloud (connexion et données).
- Page de connexion réservée à l'administrateur, puis page « Back-office Promos » :
  - interrupteur Activer / Désactiver pour chaque promo ;
  - champs modifiables : description et texte de l'offre.
- Seul un compte ayant le rôle administrateur peut modifier les promos. Les visiteurs ne voient que les informations publiques ; le texte de l'offre n'est jamais envoyé au navigateur tant que la promo est inactive.
- Le premier compte administrateur sera créé avec votre adresse e-mail (à fournir au moment de la création).
- Les dates des fêtes calculées par le calendrier islamique restent affichées en back-office comme rappel (« ouverture conseillée le … »), mais c'est l'administrateur qui décide de l'activation.

## 3. Finitions restantes du lot précédent

- Afficher sur l'accueil le simulateur Jawan 28 (section Avatar Crédit) et le conseiller boucher IA (près du catalogue).
- Vérifier dans le navigateur : page promo, notification « indisponible », back-office, panier avec livraison et découpe, simulateur, conseiller.

4. Possibilité d'ajouter plusieurs produits au panier et pouvoir choisir des quantités différentes.

## Détails techniques

- Table `promos` (id, name, tagline, offer, active, sort) avec données initiales dans la migration (djawan active, autres inactives) ; table `user_roles` + fonction `has_role` ; RLS : lecture publique via une vue/fonction qui renvoie `offer` seulement si `active`, écriture réservée aux admins.
- Server functions : `listPublicPromos` (public, client publishable) et `updatePromo` (requireSupabaseAuth + vérification `has_role`).
- Routes : `/promo` (loader + head), `/auth` (connexion admin), `/_authenticated/admin` (back-office). Mise à jour d'AGENTS.md : la page unique à ancres reste la règle, avec `/promo`, `/auth` et `/admin` comme seules pages séparées.
- `src/data/djawan.ts` garde uniquement les valeurs par défaut ; `src/lib/promo.ts` sert au rappel de dates.
- Notification via sonner (Toaster ajouté dans `__root.tsx`).