# GrowthCrew workspace: design-language brief

The public landing page (client/src/LandingPage.jsx + LandingPage.css) was redesigned. The workspace
screens must now speak the same language. The shared building blocks live in
`client/src/ui/ui.css` (read it fully first) and `client/src/ui/Segmented.jsx`. They are global
classes in a Tailwind v4 `@layer components`, so Tailwind utilities still work for layout
(flex/grid/gap/width/margin/padding/responsive). Use the `ui-*` classes for every visual element.

## The rules (apply to every element you touch)

Surfaces & colour
- Page ground `--ui-bg`; panels `ui-panel` (`--ui-surface`); nested areas `ui-panel-inset` (darker) or
  `ui-panel-raised` (lighter). Separate surfaces by these tone steps.
- Delete: gradients (`bg-gradient-*`, `from-*`, `to-*`, radial backgrounds, `scalora-mesh-bg`),
  glows, `shadow-*` on resting elements, `backdrop-blur-*`, glass (`bg-white/[0.0x]` + border
  combos), decorative borders around panels and cards, hairline dividers (`border-b border-white/..`,
  `h-px` / `w-px` separators). Use space or a tone step instead. Inputs keep their 1px border (`ui-input`).
- Violet (`--ui-accent`, `ui-btn-primary`) only for the single primary action of a view and for
  "selected" states. Lavender (`--ui-lavender`) for links. Body text in `--ui-ink`; secondary in
  `--ui-muted`. Status colours only through `ui-badge-good|warn|bad`.
- Platform brand colours (Instagram pink, LinkedIn blue, etc.) only on the platform glyph itself, never as
  tinted chip backgrounds/borders.
- Legacy classes `scalora-card-glow`, `scalora-btn-primary`, `scalora-pill-tab*`, `scalora-mesh-bg`,
  `font-serif-accent` are being removed: replace every use.

Type
- Hanken Grotesk (default sans) for all UI text. Bricolage (`ui-title`, `ui-panel-title`) only for page
  and panel titles. No other fonts, no monospace except real code/IDs.
- Minimum text size 13px (`text-[13px]` / 0.8125rem). Replace `text-[9px]`, `text-[10px]`, `text-[11px]`,
  `text-xs` (12px) with 13px or larger. Body/control text 14px (`text-sm`).
- No `uppercase` + `tracking-wider` micro labels, no ALL-CAPS buttons, no emoji in UI (🚀 ★ ✕ etc. →
  lucide icons or words). Sentence case everywhere ("Add to queue", not "Add To Queue").
- Field labels use `ui-label`; helper text `ui-hint`.

Shape
- Buttons: `ui-btn` + variant (`ui-btn-primary`, `ui-btn-light`, `ui-btn-ghost`, `ui-btn-danger`) + size
  (`ui-btn-sm`, `ui-btn-lg`, `ui-btn-icon`, `ui-btn-block`). 4px corners.
- Inputs/selects/textareas: `ui-input`, `ui-select`, `ui-textarea` (6px).
- Two/three-way exclusive choices (tone, aspect ratio, mode, presets/upload, filters with ≤4 options):
  `<Segmented>` from `./ui/Segmented.jsx`. Page-level navigation: `ui-tabs` + `ui-tab` with
  `aria-selected` / `aria-current`. Multi-select toggles (channels, ideas): `ui-chip` with `aria-pressed`.
- Statuses: `ui-badge` (+ variant). Pills (`rounded-full`) only for badges, avatars and status dots.
- Panels 12px radius (`ui-panel`). No `rounded-2xl`/`rounded-3xl` on anything.

Motion (Emil Kowalski's rules)
- Press feedback is built into ui-btn/ui-tab/ui-chip (scale .97). Hover is gated to fine pointers in the CSS.
- Never `transition-all`. No `hover:scale-*`, no `animate-pulse`/`animate-bounce` decoration, no
  `group-hover:translate` flourishes. Spinners: `ui-spin` on a lucide `Loader2`.
- Menus/popovers: `ui-menu` (scales from trigger; set `style={{'--ui-origin':'top right'}}` etc.).
  Hover-only menus (opacity on group-hover) must become click-to-open with Escape and click-outside.
- Modals: `ui-scrim` wrapping `ui-dialog`. Toasts: `ui-toast`.
- Results that arrive because of the user's action (generated drafts, new leads, queue rows on first
  load) may use `ui-arrive` with `style={{'--i': index}}`. Switching tabs/views: at most `ui-view`
  (160ms fade). Nothing else animates.

Copy
- Plain, specific, honest. Remove hype ("high-converting", "supercharge", "instant", "1-click",
  "🚀", "AI-powered magic"). Name actions by what they do: "Publish to 7 channels", "Add to queue".
- Never claim behaviour the backend doesn't do. If a label states a capability (sending from the user's
  own inbox, auto-posting to a platform, analytics), check `fastapi-backend/` first. Known facts: lead
  emails are sent from AgentMail sender inboxes that GrowthCrew creates, with Reply-To set to the
  user's central inbox from Settings; by default drafts are sent only after the user approves them;
  replies arrive via an AgentMail webhook and are logged on the lead.

## Hard constraints
- Visual + copy refactor only. Keep every piece of state, handler, effect, API call, prop, conditional
  and data flow working exactly as before. Do not rename exported components or props.
- Keep accessibility: real buttons, labels tied to inputs, visible focus, aria on toggles.
- Edit only the files assigned to you. Do not touch ui.css, LandingPage.*, index.css or other files.
  If you need a new shared class, add a small scoped rule in a comment-marked Tailwind arbitrary
  utility instead, or tell the lead in your final report.
- No git commits, no new dependencies.

## Verify before you finish
- `cd client && npx vite build` passes; `npx oxlint <your files>` shows no new errors.
- `rg -n "gradient|backdrop-blur|shadow-|uppercase|tracking-wider|transition-all|text-\[(9|10|11)px\]|text-xs|rounded-2xl|rounded-3xl|scalora-|font-serif-accent|animate-pulse|animate-bounce" <your files>`
  should return nothing except justified cases you list in your report (e.g. a shadow on a real menu).
- A dev server already runs at http://localhost:5199 (do not start another on that port). To reach the
  workspace: in the browser set `localStorage.growthcrew_auth = '{"email":"aarya@in2peta.com","name":"Aarya","initial":"A","role":"Admin"}'`,
  reload, then click "Social Studio" or "Lead Gen" in the landing nav. The FastAPI backend may be down;
  API errors are expected, layouts should still render.
