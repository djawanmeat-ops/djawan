<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the marketing site as one anchored landing page (nav links use `/#anchor`); the only separate pages are `/promo`, `/auth` and `/admin`, because promotions and their back-office need their own URLs.
- Promo activation is stored in the `promos` table and toggled by admins only; the public read goes through `get_public_promos()` so inactive offer text never reaches the browser. Hijri dates (`src/lib/promo.ts`) are only an admin reminder.
- AI cut recommendations run in a server function (`src/lib/advisor.functions.ts`) so the gateway key never reaches the browser.
- Store product-box content in `src/data/djawan.ts` so commercial content remains editable independently from presentation.
