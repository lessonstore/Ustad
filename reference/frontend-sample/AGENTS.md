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

- Full lesson content lives in a server-only module and is returned only after authenticated ownership verification; public lesson loaders provide catalog metadata only.
- Preview, editing, PDF and sharing must all use the purchased-content path; never restore a browser-side content generator.
- Header subtitle overflow is measured with ResizeObserver so scrolling is conditional, not tied to a viewport breakpoint.
