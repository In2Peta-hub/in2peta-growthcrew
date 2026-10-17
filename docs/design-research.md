# Design research: avoiding the "AI-generated / templated" look and adding tasteful motion

Scope: a React + Vite SaaS marketing landing page with a dark violet brand. This is a research brief, not code. Sources are primary writings by the designers/design-engineers and the engine docs they reference. Section 1's "tells" are a synthesis of recurring patterns; the remedies are sourced.

## 1. Tells of templated / AI-generated landing pages, and what strong designers do instead

Concrete tells (synthesis of the pattern the sources below argue against):

1. A centered hero with an eyebrow pill badge ("✨ Introducing…"), one huge H1 with a single gradient-tinted word, generic two-line subcopy, a primary + ghost button pair, and a tilted browser-frame screenshot below.
2. Decorative purple/blue "aurora" gradient blobs and glow orbs drifting behind content.
3. Glassmorphism everywhere: `backdrop-blur` cards with `border-white/10` on every surface.
4. A 5–7 cell "bento" feature grid, each cell a sparkle/rocket stock icon plus a one-liner.
5. The same section cadence every time: logo cloud → 3 identical testimonial cards → 4-stat number row → 3-step "How it works" → FAQ accordion → gradient CTA banner.
6. Identical motion on every section: the same `opacity + translateY(~20px)` fade-up with the same duration, easing, and stagger; nothing responds to input.
7. LLM-ism copy: "Elevate", "Supercharge", "Seamless", "Unlock", "Whether you're an X or a Y", stacked em-dash clauses.
8. One typeface at a uniform scale, identical radii and shadows everywhere — no hierarchy decisions.

What strong designers do instead:

- **Build a real color system.** Refactoring UI: most of an interface should be neutral greys (8–10 shades defined up front), with one primary hue and accents used "pretty sparingly" — <https://refactoringui.com/previews/building-your-color-palette/>. For a dark-violet brand: near-neutral dark surfaces, violet reserved for primary actions and emphasis, fixed shades rather than ad-hoc lightening.
- **Reduce noise, align obsessively, differentiate type.** Linear's 2024 redesign did alignment passes, cut visual noise, introduced hierarchy/density, used an LCH-derived palette for perceptually even tones, and paired Inter Display (headings) with Inter (body) — <https://linear.app/blog/how-we-redesigned-the-linear-ui>.
- **Make alignment, shadows, borders, and hue consistent and intentional.** Vercel's Web Interface Guidelines: "every element aligns with something intentionally", layered shadows, crisp semi-transparent borders, hue consistency on tinted backgrounds, tabular numbers for comparisons — <https://vercel.com/design/guidelines> (mirror: <https://github.com/vercel-labs/web-interface-guidelines>).
- **Ship bespoke, narrative effects** tied to the product story, not stock effects. Stripe's Connect page hand-built CSS-3D cubes with per-face lighting driven by requestAnimationFrame, triggered once via IntersectionObserver — <https://stripe.com/blog/connect-front-end-experience>.
- **Sweat invisible details; they compound.** Rauno Freiberg's "Invisible Details of Interaction Design" (<https://rauno.me/craft/interaction-design>) and Emil Kowalski (<https://emilkowal.ski/ui/7-practical-animation-tips>, quoting Paul Graham: "unseen details combine to produce something that's just stunning"). Paco Coursey's craft essays (<https://paco.me>) make the same point.

## 2. Motion principles

- **Purpose first.** Animate to give feedback, show cause-and-effect, and preserve spatial orientation (where did this come from / where did it go). If it clarifies nothing, cut it. Val Head: <https://alistapart.com/article/ui-animation-and-ux-a-not-so-secret-friendship/>; Apple HIG, Motion (use motion to communicate and reinforce realism, never gratuitously): <https://developer.apple.com/design/human-interface-guidelines/motion>; Rachel Nabors, "Communicating Animation": <https://alistapart.com/article/communicating-animation/>.
- **Frequency controls budget.** The more often an animation fires, the shorter and subtler it must be. Rauno removed motion from high-frequency interactions (command menu, list add/remove) because it became "sluggish"; macOS context menus and App Switcher appear with no animation (<https://rauno.me/craft/interaction-design>). Emil: remove animations seen "tens, maybe hundreds of times a day", and never animate keyboard-initiated or rapidly repeated actions (his Raycast example has none) — <https://emilkowal.ski/ui/you-dont-need-animations>. Marketing/hero animations may be longer and more expressive, but each must have a purpose (e.g. explaining a feature). On a landing page, once-per-visit reveals may be longer; hover/press feedback must feel instant.
- **Durations (numbers).** NN/g: most animations 100–500ms; ~100ms for micro-feedback (checkbox/toggle) so it "feels immediate"; 200–300ms for substantial moves like a modal entering; 400ms is a slow maximum and 500ms+ feels like a drag; **entering should be slightly longer than exiting** (e.g. 300ms in / 200–250ms out) — <https://www.nngroup.com/articles/animation-duration/>. Emil's rule of thumb: keep UI animations under 300ms.
- **Easing.** Ease-out for entering elements (fast start, gentle settle — feels responsive), ease-in for exiting, never ease-in on entry (feels sluggish) — Emil tip 4 and NN/g. Concrete curves:
  - ease-out-expo: `cubic-bezier(0.16, 1, 0.3, 1)` (a strong modern default)
  - ease-out-quad: `cubic-bezier(0.25, 1, 0.5, 1)`
  - Material standard (position/color): `cubic-bezier(0.4, 0.0, 0.2, 1)`
  - Material decelerate (entering): `cubic-bezier(0.0, 0.0, 0.2, 1)`
  - Material accelerate (exiting): `cubic-bezier(0.4, 0.0, 1, 1)`
  (Material: <https://m1.material.io/motion/duration-easing.html>, M3: <https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration>). Prefer custom curves over CSS built-ins, which Emil and Stripe both call too weak; avoid `linear` for anything visible (Josh Comeau: <https://www.joshwcomeau.com/animation/css-transitions/>).
- **Springs.** Use spring physics for elements under direct manipulation (dragged or gesture-linked UI — cf. Kowalski's Sonner/Vaul). For one-shot marketing reveals, a strong ease-out bezier is simpler and safer; see Comeau's guide for the transition/spring trade-off.
- **Stagger.** Delay siblings by tens of ms (~40–60ms) and cap the total so the last item lands within roughly 300–400ms of the trigger. Reveal once — never re-stagger on every scroll pass.
- **Enter vs exit asymmetry.** Entries: ease-out, slightly longer. Exits: ease-in, shorter. Hover: fast in (~125ms), slower out (~450ms) feels responsive yet calm — Comeau's "action-driven motion" (<https://www.joshwcomeau.com/animation/css-transitions/>; also Tobias Ahlin: <https://tobiasahlin.com/blog/meaningful-motion-w-action-driven-animation/>).
- **Interruptibility.** Motion should be interruptible mid-flight (CSS transitions reverse naturally) and never block input while completing — Rauno (<https://rauno.me/craft/interaction-design>) and Apple's WWDC "Designing Fluid Interfaces" (<https://developer.apple.com/videos/play/wwdc2018/803/>).

## 3. Concrete, tasteful CSS techniques (2026)

**(a) Scroll-driven reveal with `animation-timeline: view()`** — runs off the main thread, no JS:

```css
@keyframes rise { from { opacity: 0; transform: translateY(24px); } }
@supports (animation-timeline: view()) {
  .reveal {
    animation: rise linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 60%; /* fully visible by 60% of entry */
  }
}
```

Support: Chrome/Edge 115+, Safari 26+, Firefox behind a flag (per the Chrome/Bramus doc). The `@supports` gate leaves content simply visible elsewhere. Keep travel small (16–32px), reveal each element once (NN/g: scroll-triggered effects should fire only on first pass and must not gate the primary text — <https://www.nngroup.com/articles/scroll-animations/>), and don't scrub long timelines across the whole page — that reads as parallax slop. Source: Bramus, <https://developer.chrome.com/docs/css-ui/scroll-driven-animations>; demos <https://scroll-driven-animations.style>; Jhey Tompkins, <https://css-tricks.com/unleash-the-power-of-scroll-driven-animations/>.

**(b) `@starting-style` for enter transitions** of newly inserted (or `display:none` → shown) elements, no JS class toggling:

```css
.toast { transition: transform .25s cubic-bezier(0.16,1,0.3,1), opacity .25s; }
@starting-style { .toast { opacity: 0; transform: translateY(8px); } }
```

Baseline 2024 (Chrome/Edge 117+, Firefox 129+, Safari 17.5+); fallback: content simply appears. <https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style>

**(c) View Transitions for SPA route/section changes**, feature-detected:

```js
if (document.startViewTransition) document.startViewTransition(() => navigate());
else navigate();
```

Chromium 111+, Safari 18+; Firefox is newest — always guard. Keep the default cross-fade or a small shared-element morph; avoid page-wide zooms. <https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API>

**(d) `clip-path: inset()` reveal** for hero media/screenshots (compositor-friendly; from the Bramus image-reveal demo):

```css
@keyframes unveil { from { clip-path: inset(0 0 100% 0); } }
```

**(e) Text reveal by line/word mask** — reserve for the H1, once per page; stagger lines ~40–60ms:

```css
.line { display: inline-block; overflow: hidden; }
.line > span { display: inline-block; transform: translateY(110%);
  animation: up .6s cubic-bezier(0.16,1,0.3,1) forwards; }
@keyframes up { to { transform: none; } }
```

**(f) Tabular numbers** on any counter/stat so digits don't jiggle: `font-variant-numeric: tabular-nums;` (Vercel guidelines). Animate the count once, ~800ms eased, and only under `prefers-reduced-motion: no-preference`.

**(g) Hover gated by capability** so touch devices never stick in a hover state:

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover { transform: translateY(-2px); }
}
```

**(h) Press feedback**: `.btn:active { transform: scale(0.97); }` with a ~100–120ms ease-out — immediate, physical, cheap (Emil tip 1).

**(i) `prefers-reduced-motion`** — reduce, don't necessarily remove; swap movement for a quick fade, never drop information:

```css
@media (prefers-reduced-motion: reduce) {
  .reveal { animation: none; opacity: 1; transform: none; }
  * { transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
```

(Comeau; Val Head, <https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/>; Vercel guidelines.)

## 4. Things to avoid

- **Parallax overload and scroll-jacking** — frustrating and a vestibular trigger (NN/g: <https://www.nngroup.com/articles/scroll-animations/>; Val Head).
- **Bounce/spring easing on everything** — playful springs clash with a serious brand (Val Head's Dots-vs-Apple example). Keep bounce low and rare.
- **Gradient blobs, glow orbs, blanket glassmorphism** — the strongest "AI template" tells (§1).
- **`transition: all`** — accidentally animates layout properties; list only what you intend (typically `transform`, `opacity`) — Vercel guidelines.
- **Animating layout properties** (`width`, `height`, `top`, `left`, margins) — forces reflow and jank; animate only `transform`/`opacity` (Comeau; web.dev: <https://web.dev/articles/animations-guide>; Stripe).
- **Durations >500ms and long delay chains** — they feel like waiting (NN/g; Emil's <300ms rule).
- **Auto-playing carousels** — ignored and can trigger motion sensitivity (NN/g: <https://www.nngroup.com/articles/auto-forwarding/>; Val Head).
- **Animating from `scale(0)`** — start at ~0.9+ so elements don't pop out of nowhere (Emil tip 2).

## 5. Twelve-item checklist (React + Vite, dark violet brand)

1. Palette: 8–10 fixed near-neutral dark greys; violet reserved for primary actions/links/emphasis; no ad-hoc lighten/darken (Refactoring UI).
2. Hero: drop the eyebrow-pill + gradient-word cliché, or keep one subtle gradient use; write a specific headline, never "Elevate/Supercharge".
3. One bespoke visual anchor (product render, live demo, or data viz) instead of a stock tilted screenshot over blobs (Stripe).
4. Glassmorphism/backdrop-blur only where content genuinely scrolls beneath a bar; crisp 1px borders + layered shadows elsewhere (Vercel).
5. Type hierarchy: distinct display vs body faces (Linear's Inter Display / Inter pattern); set `color-scheme: dark` on `<html>` (Vercel).
6. Scroll reveals: one shared `.reveal` (opacity + ≤32px translateY, ease-out-expo `cubic-bezier(0.16,1,0.3,1)`, ~500–700ms total incl. ≤60ms stagger), once per element, via `view()` + `@supports` fallback to visible.
7. Buttons/links: `:active { transform: scale(.97) }` at ~110ms; hover lift 1–2px gated by `@media (hover:hover) and (pointer:fine)`; fast-in / slower-out asymmetry (Comeau).
8. Stats/counters: `font-variant-numeric: tabular-nums`; count once on entry; nothing loops.
9. Only `transform`/`opacity` animate; no `transition: all`; `will-change` only on elements that actually move.
10. `prefers-reduced-motion`: disable reveals/parallax/counters, keep instant state changes; verify via DevTools motion emulation.
11. No scroll-jacking, no multi-speed parallax, no autoplay carousels, no bounce-everything; any ambient loop is muted, non-essential, and stoppable.
12. Screenshot test at 0/50/100% scroll on desktop + mobile: if a section still looks like a template (bento + blobs + centered gradient hero), fix its composition before adding any motion.
