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
- Signed-in-only pages live under src/routes/_authenticated/ (client-side gate redirects to /auth?redirect=…); why: one place protects the editor and future private pages.
- Sales-page hero parallax writes CSS variables from one rAF loop instead of React state; why: avoids re-rendering on every mouse/scroll event.
