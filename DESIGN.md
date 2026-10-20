---
name: Peace Wishlist
description: 写真と簡潔な操作で、やりたいことと思い出を共有するClear Sky UI
colors:
  canvas: "#f5faff"
  collection-canvas: "#f7fafc"
  surface: "#ffffff"
  surface-soft: "#edf6ff"
  ink: "#172a3a"
  ink-soft: "#465f73"
  ink-faint: "#5b7285"
  line: "#dcebf7"
  line-strong: "#b9d3e6"
  accent: "#0d6eb8"
  accent-hover: "#075a99"
  sky: "#70c4f4"
  sky-ink: "#10344c"
  control-line: "#c9dce9"
  control-hover: "#edf6fc"
  control-hover-line: "#a9cce2"
  collection-line: "#dce5eb"
  photo-surface: "#e7eef2"
  note-surface: "#e8f1f7"
  viewer: "#101b24"
  error: "#913449"
  error-soft: "#fff1f3"
  focus: "#1676bc"
typography:
  headline:
    fontFamily: "Hiragino Sans, Yu Gothic UI, Noto Sans JP, -apple-system, BlinkMacSystemFont, system-ui, Meiryo, sans-serif"
    fontSize: "clamp(30px, 3.6vw, 44px)"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.035em"
  detail-title:
    fontFamily: "Hiragino Sans, Yu Gothic UI, Noto Sans JP, -apple-system, BlinkMacSystemFont, system-ui, Meiryo, sans-serif"
    fontSize: "clamp(28px, 3.5vw, 42px)"
    fontWeight: 680
    lineHeight: 1.45
    letterSpacing: "-0.03em"
  card-title:
    fontFamily: "Hiragino Sans, Yu Gothic UI, Noto Sans JP, -apple-system, BlinkMacSystemFont, system-ui, Meiryo, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.6
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Hiragino Sans, Yu Gothic UI, Noto Sans JP, -apple-system, BlinkMacSystemFont, system-ui, Meiryo, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "Hiragino Sans, Yu Gothic UI, Noto Sans JP, -apple-system, BlinkMacSystemFont, system-ui, Meiryo, sans-serif"
    fontSize: "14px"
    fontWeight: 700
  button:
    fontFamily: "Hiragino Sans, Yu Gothic UI, Noto Sans JP, -apple-system, BlinkMacSystemFont, system-ui, Meiryo, sans-serif"
    fontSize: "14px"
    fontWeight: 720
    letterSpacing: "0.015em"
  metadata:
    fontFamily: "Hiragino Sans, Yu Gothic UI, Noto Sans JP, -apple-system, BlinkMacSystemFont, system-ui, Meiryo, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  album: "10px"
  control: "12px"
  input-edge: "13px"
  photo: "14px"
  panel: "16px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  gutter-mobile: "20px"
  lg: "24px"
  xl: "32px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-primary-hover:
    backgroundColor: "{colors.control-hover}"
    textColor: "{colors.accent-hover}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  photo-card:
    backgroundColor: "{colors.photo-surface}"
    rounded: "{rounded.photo}"
  album-photo:
    backgroundColor: "{colors.photo-surface}"
    rounded: "{rounded.album}"
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent}"
    rounded: "{rounded.control}"
    width: "44px"
    height: "44px"
---

# Design System: Peace Wishlist

## Overview

**Creative North Star: "Clear Sky UI"**

Peace Wishlist keeps the established Clear Sky UI: pale blue fields, white controls, deep blue-gray text, and the native Japanese sans stack. Friends and family use it mainly on phones; labels and placement carry the operation, with supporting copy reserved for consequences, permissions, and recovery.

Photographs now lead the collections. Rounded image windows sit above unboxed captions; generous gutters separate entries. The interface remains quiet around user content. Uploaded memories and URL previews supply the imagery; decorative stock or generated photographs are not part of the product.

**Key Characteristics:**

- White action controls with blue text.
- Photographs above unboxed captions.
- Native Japanese typography and plain labels.
- Visible focus, generous touch targets, and responsive photo grids.

## Colors

The palette combines cool pale canvases, white controls, and blue action text. Frontmatter records the final rendered palette, not superseded declarations earlier in the stylesheet.

### Primary

`accent` and `accent-hover` identify actions and links; `focus` identifies keyboard focus. `sky` remains in the circular brand mark, not as an action fill.

### Neutral

`canvas` serves creation, participation, and legal routes; `collection-canvas` serves collections, detail, and returning visits. `surface` serves controls, fields, menus, and legal documents. `ink`, `ink-soft`, and `ink-faint` establish content hierarchy. `line` and `line-strong` structure forms and documents; the control and collection line tokens describe their quieter edges. `photo-surface` preserves image geometry while loading or unavailable; `note-surface` holds an entry without a photo. `viewer` is the dark full-screen photo plane.

### Feedback

`error` and `error-soft` communicate errors and deletion confirmation. They do not define a filled destructive-button variant.

**The White Action Rule.** Action controls use white backgrounds and blue text. Destructive actions use explicit labels and confirmation; error messages retain their own error palette.

## Typography

**Body and heading font:** the native Japanese sans stack in frontmatter, inherited throughout. Existing platform typography is retained; no separate decorative display face is introduced.

The hierarchy moves from fluid user-content headings to compact captions and metadata. Collection titles use `headline`; details use `detail-title`. At mobile widths, collection titles become 28px (25px at the narrowest breakpoint), and detail titles become 27px. Card titles reduce from 17px to 14px; memory captions use 21px on desktop and 19px on mobile. The body token describes reading text, not a universal font-size reset. Detail comments use 15px with line-height 2, reducing to 14px on mobile. Form entry text in the item editor is 16px. Labels stay visible, and metadata uses 11–12px with a readable blue-gray tone.

**The Plain Label Rule.** Use direct Japanese labels. Remove subtitles that repeat a screen or action; preserve consent, permissions, irreversible consequences, and recovery guidance.

## Layout

Use centered content widths with generous outer gutters. Collections have a 1144px outer maximum and 32px desktop gutters; detail has a 1000px maximum; editors narrow to 740px. Legal and recent-group content use 820px. At 820px, collection and detail gutters reduce to 24px; at 600px they reduce to 20px; at 360px they reduce to 16px. The minimum supported page width is 320px.

Wishlist collections use three columns, then two at 820px. Memories use two columns, then one at 600px. Album thumbnails use three columns, then two at 600px. Wishlist images change from 4:3 to square on mobile; memories retain 3:2. Detail covers use 16:10 on desktop and 4:3 on mobile. Keep the caption outside the image boundary.

On mobile, detail titles occupy their own full-width row and the edit action sits below, right aligned. Long content wraps rather than squeezing the title beside its action. Legal content remains one continuous reading plane with a 70ch measure; detail comments use up to 65ch. The shared footer stacks on mobile.

## Elevation & Depth

The photo collection is flat: image cropping, spacing, background tones, and dividers establish hierarchy. Controls have no shadows or hover lift. The existing join panel uses a soft blue-gray ambient shadow, while menus use a stronger shadow to indicate a floating layer. The circular brand retains its small ambient halo. Focus rings communicate interaction state, not elevation.

**The Quiet Chrome Rule.** Collections and action controls have no resting shadow. Reserve elevation for floating UI and the incumbent join surface.

Exact shadow, focus, motion, and breakpoint values live in the sidecar. Photo hover gently scales the image to 1.035 inside its clip; collection transitions last 340ms and album transitions 280ms. Hover zoom applies only to hover-capable pointers. Reduced-motion preference suppresses animation and transitions.

## Shapes

Controls and inner fields use the control radius; the input wrapper is one pixel larger. Photo windows and popovers use the photo radius, with mobile collection photos using the control radius. Covers and document panels use the panel radius; album thumbnails use the smaller album radius. Profile and image-removal controls are circular. The full-screen viewer has square image edges. These are role-based shapes, not a requirement to round every container.

## Components

### Buttons

White surfaces, blue text, a quiet one-pixel control border, and a minimum 44px height define the action family, including share, edit, delete, upload, and viewer controls. Primary and secondary differ in placement and padding, not filled color. Hover uses the control-hover palette without lift; disabled controls reduce opacity and use the disabled cursor. Keyboard focus uses a 3px outline with 3px offset. Icon-only controls require accessible names; use the incumbent inline SVG stroke vocabulary.

### Inputs / Fields

White fields sit inside a one-pixel blue-gray wrapper. Focus changes the wrapper to focus blue and adds a translucent ring. Inputs are at least 48px high; textareas start at 156px and resize vertically. Preserve visible labels, example-only placeholders, short asynchronous feedback, and error alerts.

### Navigation

Collections use two text tabs with counts, a dark underline for the current route, and a shared bottom divider. The wishlist has one add action to the right of these tabs; the memories view reserves that position without an active add action. The sticky top bar is opaque on collection and detail routes. Recent groups are divided text rows with a separate removal control.

### Photo collections and albums

Each collection entry is a single accessible target with a cropped photo and an unboxed caption. Entries without a photo use a pale note tile with the title; failed images keep their geometry and expose a readable unavailable message. Memory image counts sit on a small dark translucent badge. Do not style that informational badge as an action.

Memory details place a large cover above comments, state actions, and the uploaded-photo album. The album accepts multiple uploads and shows progress and capacity beside a plain heading. Thumbnails open a full-screen dark viewer with white/blue controls; close and previous/next actions have accessible names. Photo and item removal require explicit confirmation.

### Creation and reading surfaces

The new-item form starts visibly with URL; a screen-reader-only heading preserves the document structure. URL preview can populate a name and photo while manual entry remains available. Existing items open in read mode with the item name as the heading and a separate edit action. Initial group creation is a plain form; the returning view starts with recent groups. Legal documents keep semantic headings, quiet separators, and direct navigation back.

## Do's and Don'ts

### Do:

- Do keep field labels visible and mark optional fields with `任意`.
- Do preserve the native Japanese sans stack and wrap long user content.
- Do keep controls at least 44px high, text inputs at least 48px high, and visible keyboard focus.
- Do use user uploads or URL previews for photos, with an accessible unavailable state.
- Do respect reduced motion and retain semantic headings, forms, navigation, status regions, and dialogs.

### Don't:

- Don’t add poetic slogans or explanations that repeat the visible controls.
- Don’t restore filled blue action buttons, glossy highlights, or lifted button hover states.
- Don’t frame photo captions in white cards or substitute decorative imagery for user content.
- Don’t add gradients, literal clouds, decorative blobs, pill-shaped primary actions, or heavy shadows.
- Don’t remove permission, consent, deletion, or recovery information to make a screen sparse.
