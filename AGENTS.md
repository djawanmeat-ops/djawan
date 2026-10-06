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

- Keep the marketing site as one anchored landing page (nav links use `/#anchor`); the only separate page is `/promo`, because promotions open and close on their own schedule.
- Compute festival promo windows client-side from the Hijri calendar (`src/lib/promo.ts`) because dates move every year and must update without manual edits.
- AI cut recommendations run in a server function (`src/lib/advisor.functions.ts`) so the gateway key never reaches the browser.
- Store product-box content in `src/data/djawan.ts` so commercial content remains editable independently from presentation.
