---
name: Peace Wishlist
description: LINEで届く共有URLから、少人数の「今度やりたい」を静かに共同編集するモバイルファーストUI
colors:
  canvas: "#f6f8f7"
  surface: "#ffffff"
  surface-soft: "#f0f4f3"
  ink: "#263436"
  ink-soft: "#5c6b6e"
  ink-faint: "#657573"
  line: "#dbe3e1"
  line-strong: "#b8c6c3"
  accent: "#356f68"
  accent-hover: "#295c57"
  mint: "#72bfb4"
  rose: "#d28fa3"
  violet: "#8176bd"
  error: "#913449"
  error-soft: "#fff1f3"
  focus: "#2a7770"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Hiragino Sans, Yu Gothic UI, Noto Sans JP, Meiryo, sans-serif"
    fontSize: "clamp(40px, 4vw, 58px)"
    fontWeight: 760
    lineHeight: 1.18
    letterSpacing: "-0.055em"
  group-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Hiragino Sans, Yu Gothic UI, Noto Sans JP, Meiryo, sans-serif"
    fontSize: "clamp(32px, 6vw, 48px)"
    fontWeight: 760
    lineHeight: 1.2
    letterSpacing: "-0.05em"
  panel-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Hiragino Sans, Yu Gothic UI, Noto Sans JP, Meiryo, sans-serif"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: "normal"
    letterSpacing: "-0.035em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Hiragino Sans, Yu Gothic UI, Noto Sans JP, Meiryo, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "normal"
  list-item:
    fontFamily: "-apple-system, BlinkMacSystemFont, Hiragino Sans, Yu Gothic UI, Noto Sans JP, Meiryo, sans-serif"
    fontSize: "15px"
    fontWeight: 650
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Hiragino Sans, Yu Gothic UI, Noto Sans JP, Meiryo, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "normal"
    letterSpacing: "normal"
  metadata:
    fontFamily: "-apple-system, BlinkMacSystemFont, Hiragino Sans, Yu Gothic UI, Noto Sans JP, Meiryo, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
rounded:
  skeleton: "7px"
  compact: "8px"
  subtle: "9px"
  control: "10px"
  input-edge: "11px"
  small-panel: "12px"
  panel: "16px"
  state-panel: "18px"
  large-panel: "20px"
  circle: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "16px"
  2xl: "20px"
  3xl: "24px"
  4xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
    height: "48px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "20px"
---

# Design System: Peace Wishlist

## Overview

**Creative North Star: "Iridescent Cloud Edge"**

Peace Wishlist is an Operate-mode, mobile-first shared list for trusted small groups. Its primary journey begins when a URL arrives in LINE: the recipient recognizes the group, enters a display name, and adds the first idea without an account, installation, or product tutorial. The creator journey is equally short: enter a group name and display name, create the group, share the generated URL, then add to the same list.

The chosen catalog direction is **Iridescent Cloud Edge**, adapted as an **Iridescent Edge** system without literal cloud imagery. Concept seed: `d6f186f7`. The world is a calm near-white field with slate ink, restrained rules, familiar controls, and spectral mint/rose/violet color appearing only at an active or meaningful edge. It deliberately avoids a stack of generic white cards and keeps the wishlist as one continuous, shared plane.

The experience is friendly but not childish, polished but not luxurious, and collaborative without the rigid tone of a business tool. The finish reviewer verdict for the shipped implementation is **SHIP**.

**Key Characteristics:**

- Mobile and LINE are the primary operating context; desktop expands the same journey rather than replacing it.
- Near-white canvas, white working surfaces, slate text, and fine gray-green dividers establish the quiet base.
- The iridescent palette is scarce and structural: it marks the brand, focused input edge, panel seam, empty-state mark, and the one-time item-arrival sweep.
- Account-free access and equal editing rights remain visible in the copy instead of being hidden in settings.
- Every asynchronous action names its current state and reports a clear result.

**The Active Edge Rule.** Iridescence belongs to the edge of attention or arrival, never to large decorative fills, gradient text, or ambient background decoration.

## Colors

The palette uses cool whites and desaturated green-slate neutrals for almost the entire interface. Accent green carries action and identity; mint, rose, and violet form the restrained spectral edge.

### Primary

- **Quiet Teal:** The `accent` token is the primary action, inviter text, profile avatar, and mark stroke. Use `accent-hover` only for primary-button hover.
- **Accessible Focus Teal:** The `focus` token is reserved for visible keyboard focus rings and the focused input halo.

### Secondary

- **Edge Mint:** The first spectral stop and the soft collaborative cue.
- **Edge Rose:** The warm midpoint of the iridescent edge.
- **Edge Violet:** The final spectral stop. It is not a standalone CTA color.

### Neutral

- **Cool Canvas:** `canvas` is the page field and browser theme color.
- **Clear Surface:** `surface` is used for inputs, panels, popovers, dialogs, and the continuous list.
- **Soft Surface:** `surface-soft` is the hover, count badge, and read-only-field support layer.
- **Slate Ink:** `ink` is primary text; `ink-soft` is explanatory copy; `ink-faint` is metadata and tertiary guidance.
- **Quiet Line:** `line` separates nearby content; `line-strong` defines input rest edges and the continuous list boundary.

### Semantic

- **Deep Rose Error:** `error` is error text, destructive action, destructive menu text, and error notice background. `error-soft` is the inline error surface.

The shipped combinations retain WCAG AA contrast for normal text: `ink` on `canvas` is 12.10:1, `ink-soft` on `surface` is 5.55:1, `ink-faint` on `surface` is 4.83:1, `surface` text on `accent` is 5.79:1, and `surface` text on `error` is 7.52:1. The `focus` ring against `canvas` is 4.96:1. Preserve or improve these ratios when changing tokens.

**The Spectral Scarcity Rule.** Mint, rose, and violet work as a three-stop set at a thin boundary. Do not promote any one of them into a large fill or scatter the trio across unrelated controls.

## Typography

**Display and Body Font:** Native Japanese-capable system sans stack, in this order: Apple system, BlinkMacSystemFont, Hiragino Sans, Yu Gothic UI, Noto Sans JP, Meiryo, then generic sans-serif.

**Character:** The typography is direct, compact, and native to the device. Tight display tracking gives group names and the creation promise personality; body text remains relaxed and readable. `font-synthesis` is disabled and legibility rendering is requested.

### Hierarchy

- **Creation display:** The largest promise on the create screen. On very narrow screens it resolves to 39px; under 820px it uses `clamp(40px, 10.8vw, 58px)`.
- **Group title:** A tightly tracked, heavy title that wraps anywhere for long user-entered names. Under 600px it resolves to 34px.
- **Join title:** `clamp(30px, 8vw, 42px)`, weight inherited from the heading, line-height 1.25, letter-spacing -0.045em; it also wraps anywhere.
- **Panel title:** Used for the creation panel heading; secondary section titles use 17–25px according to context.
- **Body:** 14px is the dominant explanatory size, generally with line-height from 1.7 to 1.8. The create-page intro is the one 16px, 1.9 body treatment on wide screens and becomes 14px under 420px.
- **List item:** 15px, weight 650, line-height 1.65 for user-entered wish content.
- **Label:** 13–14px at weight 700–750 for fields, buttons, and compact headings.
- **Metadata:** 11–13px for authorship, counts, privacy notes, and field hints. Never use faint color below the shipped contrast floor.

**The Native Clarity Rule.** Do not introduce a display face, monospace accent, all-caps navigation, or editorial serif. The character comes from weight, tracking, and spacing within the native Japanese sans stack.

## Layout

The minimum supported viewport width is **320px**. Pages use a single calm field rather than a card grid; content width and gutters create the hierarchy.

- The group top bar is sticky, 62px minimum height, with a blurred 90%-opaque canvas layer. Its inner container is capped at 840px.
- The group workspace is capped at 800px with 20px side gutters on wide screens and 16px side gutters under 600px.
- The create screen is capped at 1080px. Above 820px it is a two-column layout: flexible narrative plus a 360–440px form panel, with a responsive 48–76px gap.
- The join flow is a centered 480px column. Loading/error standalone panels are capped at 460px.
- The wishlist is a continuous list bounded by strong top and bottom rules; each row is at least 88px tall on wide screens and 82px under 600px. Rows are separated by one quiet divider rather than isolated cards.
- User-entered group names and wish content use aggressive wrapping so they cannot force horizontal overflow.

### Responsive breakpoints

- **820px:** The create page changes from two columns to one flow; narrative spacing compresses and the form panel caps at 520px.
- **600px:** Group gutters become 16px, the title becomes 34px, the share guide stacks its action, the quick-add field and action stack, delete confirmation becomes vertical, notices span the bottom gutter, and join/state panels tighten.
- **420px:** The brand wordmark hides in compact mode, the share button becomes an icon-only 44px control, create benefits stack, the create panel tightens, and field labels/hints become a vertical group.

**The One-Plane Rule.** Keep related wishlist items in a shared list plane. Do not convert each row into a floating card, masonry tile, or dashboard module.

## Elevation & Depth

The system is flat by default and uses borders and tonal layering before shadows. Shadows appear only where separation from the current plane is functionally useful:

- **Create panel:** `18px 22px 54px rgba(49, 72, 70, 0.07)`.
- **Join panel:** `14px 18px 42px rgba(49, 72, 70, 0.06)`.
- **Menu popover:** `0 14px 34px rgba(37, 55, 53, 0.13)`.
- **Notice:** `0 12px 28px rgba(25, 51, 48, 0.18)`.
- **Share fallback dialog:** `0 20px 54px rgba(25, 39, 38, 0.2)` with a dark translucent native backdrop.
- **Sticky top bar:** Depth comes from a 14px backdrop blur, transparency, and a fine bottom rule, not a drop shadow.

**The Functional Elevation Rule.** A shadow must communicate overlay, persistence, or focus. Do not add heavy ambient shadows to list rows, buttons, quick-add, or ordinary content sections.

## Shapes

Controls are gently rounded and compact. Standard buttons and input interiors use the `control` radius; the 1px input wrapper uses the slightly larger `input-edge` radius so the boundary stays even. Compact notices, errors, and menu actions range from the `compact` through `small-panel` radii. Major create/join panels use `large-panel`; dialog and quick-add surfaces use `panel`.

Circles are reserved for the 28px brand mark, 48px empty-state mark, 44px profile/menu targets, and not used as generic decoration. Borders are normally 1px. The newly added item edge is intentionally 2px so its brief arrival can be seen without turning the row into a card.

The brand mark is a circular 1px conic spectral rim around a white center with a simple teal check-like stroke. Icons use inline SVG with a 24×24 view box, 1.8px rounded strokes, and current text color; they are decorative to assistive technology and rely on adjacent text or an accessible control label.

## Components

### Brand lockup

The 28px mark and “Peace Wishlist” wordmark form one 14px, weight-750 lockup with an 11px gap. Compact mode keeps the full lockup until 420px, then hides only the wordmark. When the lockup is inside a home action, the button supplies the accessible label.

### Buttons

- **Primary:** Filled teal with white text, 44px minimum height, and a 10px radius. Hover deepens the teal; active press moves down 1px.
- **Secondary/share:** White with a strong neutral border. Hover uses the soft surface; active press moves down 1px.
- **Text:** Transparent and muted at rest, with soft-surface hover. It still has a 44px minimum height.
- **Danger:** Deep rose with white text and an explicit trash icon in destructive confirmation.
- **Icon-only:** Exactly 44px wide or larger, centered, and always supplied with an `aria-label` when its purpose is not visible in text.
- **Disabled/busy:** Keeps its label but changes it to an in-progress phrase such as “作成しています…”, “追加中…”, “保存中…”, “削除中…”, or “共有中…”. Disabled controls use reduced opacity and a not-allowed cursor.

All button, summary, and input focus states remain visible. Ordinary controls use a 3px `focus` outline with a 3px offset.

### Inputs and fields

Every field has a visible label. Optional guidance sits beside the label on normal widths and stacks beneath 420px. Inputs have a 48px minimum height and never rely on placeholder text as the label.

At rest, the input is wrapped in a 1px `line-strong` edge. On `focus-within`, that 1px edge becomes a 105-degree mint-to-rose-to-violet gradient and gains a 3px `focus` halo. The inner input suppresses its duplicate outline only because the wrapper provides the complete focus indicator.

Validation trims whitespace before submission. Empty and network errors appear directly with the affected form using `role="alert"`; join, add, and edit inputs also set `aria-invalid` and connect the error using `aria-describedby`.

### Iridescent panel seam

Create, join, and quick-add surfaces share one signature seam: a 1px top line inset 24px from both sides, fading from transparent through mint, rose, and violet back to transparent. It is structural punctuation, not a full panel border treatment.

### Continuous wishlist

Rows display the wish content, author or last updater, and a 44px details/summary menu. Editing happens inline in the same row with an auto-focused input and explicit Cancel/Save actions. Cancel returns focus to that row’s menu trigger.

Deletion also replaces the row inline. It states both the action and its irreversibility, moves focus to “やめる”, and returns focus to the row menu if cancelled. Successful edits/deletes produce a polite status notice; delete failures use an error notice.

### One-time item-add signature motion

A newly created item receives a 2px top edge with transparent endpoints and spectral stops at mint 28%, rose 57%, and violet 78%. It scales once from left to right and fades using `edge-arrival` for 900ms with `cubic-bezier(0.2, 0.8, 0.2, 1)`. The “new” state is cleared after 1100ms. Never loop this motion or apply it during initial list loading.

With `prefers-reduced-motion: reduce`, all animations and transitions resolve in 0.01ms with a single iteration. The signature remains an effectively static state change rather than a sweep.

### Loading, error, empty, and feedback states

- **Loading:** The group shell uses title, subtitle, form, and row skeletons with `aria-busy="true"` and a screen-reader-only “読み込んでいます”. The pulse is 1.4s alternating opacity and is neutral, not iridescent.
- **Load error/invalid URL:** A centered state panel explains that the group could not be opened, offers retry, and offers a path to create a new group.
- **Join gate:** If no local display name exists for the group, the UI shows the inviter, group name, one display-name field, and one participation action. It explicitly says there is no account and that the name is stored only on the device.
- **Empty list:** A spectral-ring plus mark, direct “まだ何もありません” heading, one sentence reducing first-contribution anxiety, and a button that focuses quick-add.
- **Creation guide:** Immediately after group creation, a compact next-step region asks the creator to share via LINE and can be dismissed.
- **Transient feedback:** Success/error notices use `role="status"` and `aria-live="polite"`, remain for 3.6 seconds, and sit above content at the viewport edge.

### Share and fallback behavior

Sharing prefers the native Web Share sheet with the group name, invitation copy, and current fragment-token URL. Cancelling the native sheet is silent. If Web Share is unavailable or fails, copy using the Clipboard API; if needed, try the legacy copy command. If both copying paths fail, open a native modal `dialog` containing a read-only URL and instructions for long-press copying into LINE.

The fallback uses `showModal()` so the browser supplies modal semantics and native focus containment. After opening, focus and selection move to the URL input. Escape is handled through the dialog’s cancel event, closing returns focus to the previously active share trigger, and the explicit close icon has an accessible label. Do not replace this behavior with a visually similar non-modal `div`.

### Accessibility invariants

- Keep interactive targets at least 44×44px; text inputs remain at least 48px high.
- Keep keyboard focus visible, including `summary` triggers and the share dialog’s open/close path.
- Preserve native semantic elements: forms, labels, buttons, details/summary menus, lists, status regions, and dialog.
- Keep text/background contrast at WCAG AA or better and preserve the shipped pairings documented in Colors.
- Keep meaningful text visible; icon-only controls require accessible names, while inline SVG icons stay `aria-hidden`.
- Preserve reduced-motion behavior and never make animation the only indication that an item was added.
- Keep `lang="ja"`, the responsive viewport meta tag, and the 320px minimum-width guarantee.

## Do's and Don'ts

### Do:

- **Do** design and test the complete LINE journey first: shared URL, group recognition, display-name entry, first item, visible confirmation.
- **Do** keep iridescence on a fine edge at focus, creation, arrival, brand, or empty-state moments.
- **Do** keep the next action adjacent to the content it affects and label it with concise, familiar Japanese.
- **Do** use action-state copy instead of a generic spinner: “追加中…” rather than “処理中”.
- **Do** distinguish validation, connection failure, destructive confirmation, and success with specific recovery language.
- **Do** state trust-model facts plainly: anyone with the URL can edit, there is no account, and the display name is local to the device.
- **Do** preserve 320px resilience, 44px targets, focus return, native dialog behavior, and reduced-motion support in every extension.

### Don't:

- **Don't** add literal clouds, cloud illustrations, atmospheric blobs, or cloudy blur as a visual explanation of “Cloud Edge”.
- **Don't** use decorative page gradients, gradient text, or large iridescent fills. The gradient is an edge material.
- **Don't** turn wishlist rows into card-per-item layouts or bento/dashboard modules.
- **Don't** add heavy shadows, glass-heavy surfaces, ornamental depth, or a rigid enterprise-tool aesthetic.
- **Don't** hide labels behind placeholders, shrink icon targets to the glyph, remove focus rings, or rely on color/motion alone for feedback.
- **Don't** use emoji or a mismatched icon library in place of the shipped 1.8px rounded inline SVG language.
- **Don't** obscure sharing failure. Preserve the native share → clipboard → legacy copy → selectable dialog sequence.
- **Don't** invent accounts, roles, per-item ownership controls, or permission claims that the implemented equal-rights shared-URL model does not provide.
