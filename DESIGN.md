---
name: Peace Wishlist
description: 説明を読ませず、青空のように明快な操作で使えるモバイルファーストの共有リスト
colors:
  canvas: "#f5faff"
  surface: "#ffffff"
  surface-soft: "#edf6ff"
  ink: "#172a3a"
  ink-soft: "#465f73"
  ink-faint: "#5b7285"
  line: "#dcebf7"
  line-strong: "#b9d3e6"
  accent: "#0d6eb8"
  accent-hover: "#075a99"
  sky-light: "#bdeaff"
  sky: "#70c4f4"
  sky-deep: "#3ca2e2"
  sky-ink: "#10344c"
  cloud: "#fafdff"
  error: "#913449"
  error-soft: "#fff1f3"
  focus: "#1676bc"
typography:
  fontFamily: "Hiragino Sans, Yu Gothic UI, Noto Sans JP, -apple-system, BlinkMacSystemFont, system-ui, Meiryo, sans-serif"
  displaySize: "clamp(40px, 4vw, 56px)"
  groupTitleSize: "clamp(32px, 6vw, 48px)"
  bodySize: "14px"
  labelSize: "14px"
  metadataSize: "11px"
rounded:
  control: "13px"
  input: "12px"
  panel: "16px"
  circle: "50%"
---

# Design System: Peace Wishlist

## Direction

**Creative North Star: “Clear Sky UI”**

Peace Wishlist is an Operate-mode product used mainly from LINE on a phone. The interface should work before it is explained: visible labels, familiar icons, clear placement, and immediate feedback carry the interaction. Supporting text appears only when it changes a decision or helps recovery.

The visual world comes from a clear blue sky with a small amount of white cloud. Pale blue is the page field, white is the working surface, deep blue-gray carries text, and the sky gradient identifies primary actions. The result should feel light and current, not childish, glossy, or corporate.

## Copy policy

- Do not repeat what the current screen, field, or button already makes clear.
- New-item screens begin with the form; they do not need an instructional page title.
- Existing-item screens use the item name as the heading.
- Keep visible field labels. Placeholders are examples only.
- Keep facts that are not visible in the interface: shared-URL permissions, local device storage, irreversible deletion, and recovery instructions.
- Keep errors and asynchronous results short, specific, and actionable.
- Show character counts only near the limit.

## Color and material

- `canvas` is the calm pale-sky field used across all routes.
- `surface` is reserved for forms, dialogs, menus, and the continuous list.
- Primary buttons use a diagonal transition from cloud-white blue through `sky` to `sky-deep`. Their text is `sky-ink`, not white, so the button stays bright while retaining contrast.
- `accent` is used for links, focus, arrows, sharing controls, and small interactive details.
- Destructive actions remain deep rose and never adopt the sky treatment.
- Shadows are soft blue-gray and only communicate lift or persistence. Ordinary list rows remain flat.

## Typography

Use the native Japanese sans stack, preferring Hiragino Sans and Yu Gothic UI. Character comes from controlled weight and spacing rather than a decorative display font.

- Marketing display: weight 730, tracking `-0.04em`, line-height 1.2.
- Group and item titles: weight 730, tracking from `-0.02em` to `-0.035em`.
- Labels and buttons: 14px, weight 600–720.
- List items: 15px, weight 620, line-height 1.65.
- Metadata: 11–12px with sufficient contrast; never use pale gray for meaningful text.

Only user content and the creation promise may use large type. Instructional headings do not.

## Components

### Buttons

- Primary buttons are at least 46px high with a 13px radius, clear-sky gradient, one fine blue border, and a soft downward shadow.
- Hover lifts the button by 1px and slightly increases saturation; active press moves it down and shortens the shadow.
- Secondary buttons use cloud-white surfaces, blue text, a light blue border, and much less elevation.
- Text buttons are transparent and blue. Icon-only controls stay at least 44×44px and always have an accessible name.
- Busy labels name the real operation: `追加中…`, `保存中…`, `共有中…`.

### Inputs

Inputs remain white with a quiet blue-gray edge. Focus changes the 1px wrapper to a light-to-deep sky gradient and adds a translucent blue focus ring. Text fields remain at least 48px high. Labels are always visible; optional fields are marked `任意`.

### Panels and lists

Create and join panels are white 16px surfaces with a soft blue shadow and no duplicate border. Detail forms use a quiet border without a large shadow. The wishlist stays one continuous plane with dividers instead of becoming a stack of cards.

### Brand and icons

The circular brand edge uses the sky gradient around a white center. Inline SVG icons use a consistent 24×24 view box, 1.8px rounded strokes, and current text color. Do not substitute emoji or miscellaneous icon styles.

## Screen behavior

- Group creation retains the short product promise and the two non-obvious facts: no account and share by URL.
- The join gate shows the inviter, group name, display-name field, action, and the local-storage fact. It does not explain what the visible form already implies.
- The group screen shows its name, one `追加` action, the shared list, and sharing/profile controls.
- The new-item screen starts directly with the form.
- Existing items show their name as the page heading and remain editable immediately.
- Empty lists name the empty state and offer the same add action without motivational copy.
- Errors, deletion consequences, and manual-copy instructions remain explicit.

## Accessibility and responsiveness

- Maintain WCAG AA text contrast and a visible focus state.
- Keep interactive targets at least 44×44px and text inputs at least 48px high.
- Preserve native forms, buttons, lists, details/summary, status regions, and dialog semantics.
- Support 320px width, long Japanese names, 200% zoom, keyboard navigation, and reduced motion.
- Mobile is the primary composition; desktop expands spacing without changing the interaction model.

## Avoid

- Explanatory subtitles that restate the screen or button.
- Literal cloud illustrations, decorative blobs, gradient text, or highly glossy controls.
- Pill-shaped primary actions, heavy shadows, glass effects, and card-per-item layouts.
- Removing safety, privacy, permission, or recovery text merely to make a screen sparse.
