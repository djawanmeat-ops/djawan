# Migrations de base de données

La base Lovable Cloud ne peut être modifiée que par Lovable. Les migrations écrites hors de Lovable
sont rangées ici, puis appliquées en demandant à Lovable, dans son chat :

> Applique exactement, sans la modifier, la migration SQL du fichier `docs/migrations/<fichier>.sql`
> sur la base Lovable Cloud, puis régénère `src/integrations/supabase/types.ts`. Ne change aucun autre fichier.

| Fichier | Contenu | Appliquée |
| --- | --- | --- |
| `0002_commandes.sql` | Rôles pdg / gestionnaire, tables `orders`, `order_items`, `order_status_logs`, journal d'audit par trigger | à faire |
