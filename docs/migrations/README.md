# Migrations de base de données

Les migrations écrites hors de Lovable sont rangées ici. Deux façons de les appliquer :

1. **Sans crédit** : Lovable → Plus → Cloud → **SQL editor**, coller le fichier, Run
   (l'avertissement « DELETE » vient de `on delete restrict` : aucune donnée n'est supprimée).
2. Ou dans le chat Lovable :

> Applique exactement, sans la modifier, la migration SQL du fichier `docs/migrations/<fichier>.sql`
> sur la base Lovable Cloud, puis régénère `src/integrations/supabase/types.ts`. Ne change aucun autre fichier.

| Fichier | Contenu | Appliquée |
| --- | --- | --- |
| `0002_commandes.sql` | Rôles pdg / gestionnaire, tables `orders`, `order_items`, `order_status_logs`, journal d'audit par trigger | oui, le 2026-10-09 via SQL editor |
| `0003_statuts_atelier.sql` | `set_order_status()` (étapes, motif d'annulation obligatoire, historique), table `meat_availability` et `set_meat_availability()` | oui, le 2026-10-11 via SQL editor |
| `0004_jawan28_paiements.sql` | Wave, décision Jawan 28, `jawan28_schedules`, `payment_transactions`, `decide_jawan28()`, `record_payment()` | oui, le 2026-10-11 via SQL editor |
| `0005_livraisons.sql` | Livreurs, code de réception, `assign_courier()`, `confirm_delivery()`, « Livrée » réservé à la remise confirmée | oui, le 2026-10-11 via SQL editor |
