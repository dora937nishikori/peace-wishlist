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
  viewer: "#101b24"
  destructive: "#b42332"
  destructive-hover: "#941b28"
  destructive-line: "#e8b1b8"
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
    fontSize: "20px"
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
  thumbnail-mobile: "8px"
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
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
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
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.surface}"
  button-danger:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  photo-card:
    backgroundColor: "{colors.photo-surface}"
    rounded: "{rounded.control}"
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

Peace Wishlist keeps the established Clear Sky UI: pale blue fields, blue primary actions, white secondary controls, deep blue-gray text, and the native Japanese sans stack. Friends and family use it mainly on phones; labels and placement carry the operation, with supporting copy reserved for consequences, permissions, and recovery.

Collections use a vertical list: text occupies the left half and a wide photograph occupies the right half. The interface remains quiet around user content. User uploads and URL previews supply the imagery; decorative stock or generated photographs are not part of the product.

**Key Characteristics:**

- White/blue secondary controls, blue/white primary controls, red destructive actions.
- Equal text and thumbnail columns within a vertical list.
- Native Japanese typography and plain labels.
- Visible focus, generous touch targets, and the same photo presentation in both statuses.

## Colors

The palette combines cool pale canvases, blue primary actions, white secondary controls, and red deletion actions. Frontmatter records the final rendered palette, not superseded declarations earlier in the stylesheet.

### Primary

`accent` and `accent-hover` fill primary actions and identify secondary action text and links; `focus` identifies keyboard focus. `sky` remains in the circular brand mark.

### Neutral

`canvas` serves creation, participation, and legal routes; `collection-canvas` serves collections, detail, and returning visits. `surface` serves controls, fields, menus, and legal documents. `ink`, `ink-soft`, and `ink-faint` establish content hierarchy. `line` and `line-strong` structure forms and documents; the control and collection line tokens describe their quieter edges. `photo-surface` preserves image geometry while loading or unavailable; `viewer` is the dark full-screen photo plane.

### Feedback

`error` and `error-soft` communicate errors and deletion confirmation. `destructive` and `destructive-hover` define deletion controls; confirmation buttons use red fill and white text, while deletion launchers use red text on white with `destructive-line` borders.

**The Action Hierarchy Rule.** The main action uses blue with white text, secondary actions use white with blue text, and destructive actions use red plus an explicit confirmation.

## Typography

**Body and heading font:** the native Japanese sans stack in frontmatter, inherited throughout. Existing platform typography is retained; no separate decorative display face is introduced.

The hierarchy moves from fluid user-content headings to compact captions and metadata. Collection titles use `headline`; details use `detail-title`. At mobile widths, collection titles become 28px (25px at the narrowest breakpoint), and detail titles become 27px. List titles use 20px with line-height 1.6 on desktop and 15px with line-height 1.65 on mobile, in both wishlist and memories. The body token describes reading text, not a universal font-size reset. Detail comments use 15px with line-height 2, reducing to 14px on mobile. Form entry text in the item editor is 16px. Labels stay visible, and metadata uses 11–12px with a readable blue-gray tone.

**The Plain Label Rule.** Use direct Japanese labels. Remove subtitles that repeat a screen or action; preserve consent, permissions, irreversible consequences, and recovery guidance.

## Layout

Use centered content widths with generous outer gutters. Collections have a 1144px outer maximum and 32px desktop gutters; detail has a 1000px maximum; editors narrow to 740px. Legal and recent-group content use 820px. At 820px, collection and detail gutters reduce to 24px; at 600px they reduce to 20px; at 360px they reduce to 16px. The minimum supported page width is 320px.

Wishlist and memories use the same vertical list. Each row has two equal columns: title and added-by text on the left and an optional 3:1 thumbnail on the right. The column gap is 32px on desktop and 16px on mobile; without a photo, the right half stays blank. Album thumbnails use three columns, then two at 600px. Detail covers use 16:10 on desktop and 4:3 on mobile. Keep the caption outside the image boundary.

On mobile, detail titles occupy their own full-width row and the edit action sits below, right aligned. Long content wraps rather than squeezing the title beside its action. Legal content remains one continuous reading plane with a 70ch measure; detail comments use up to 65ch. The shared footer stacks on mobile.

## Elevation & Depth

The photo collection is flat: image cropping, spacing, background tones, and dividers establish hierarchy. Controls have no shadows or hover lift. The existing join panel uses a soft blue-gray ambient shadow, while menus use a stronger shadow to indicate a floating layer. The circular brand retains its small ambient halo. Focus rings communicate interaction state, not elevation.

**The Quiet Chrome Rule.** Collections and action controls have no resting shadow. Reserve elevation for floating UI and the incumbent join surface.

Exact shadow, focus, motion, and breakpoint values live in the sidecar. Photo hover gently scales the image to 1.035 inside its clip; collection transitions last 340ms and album transitions 280ms. Hover zoom applies only to hover-capable pointers. Reduced-motion preference suppresses animation and transitions.

## Shapes

Controls and inner fields use the control radius; the input wrapper is one pixel larger. List thumbnails use the control radius on desktop and the thumbnail-mobile radius on mobile. Preview windows and popovers use the photo radius. Covers and document panels use the panel radius; album thumbnails use the smaller album radius. Profile and image-removal controls are circular. The full-screen viewer has square image edges. These are role-based shapes, not a requirement to round every container.

## Components

### Buttons

Primary actions use accent blue fill and white text, including group add, creation, save, and the detail status action in either status. Secondary controls, including photo upload, share, edit, and viewer controls, use white fill, blue text, and a quiet one-pixel border. Deletion confirmation uses red fill; deletion launchers use red text on white. Primary hover and active use accent-hover; secondary hover uses the control-hover palette; deletion hover uses destructive-hover. Controls remain at least 44px high without hover lift; disabled controls reduce opacity and use the disabled cursor. Keyboard focus uses a 3px outline with 3px offset. Icon-only controls require accessible names; use the incumbent inline SVG stroke vocabulary.

### Inputs / Fields

White fields sit inside a one-pixel blue-gray wrapper. Focus changes the wrapper to focus blue and adds a translucent ring. Inputs are at least 48px high; textareas start at 156px and resize vertically. Preserve visible labels, example-only placeholders, short asynchronous feedback, and error alerts.

### Navigation

Collections use two text tabs with counts, a dark underline for the current route, and a shared bottom divider. The wishlist has one primary add action beside the group heading, on its own row below the heading on mobile. Tabs occupy a separate row. The sticky top bar is opaque on collection and detail routes. Recent groups are divided text rows with a separate removal control.

### Photo lists and albums

Each collection entry is a single accessible target with a cropped photo and an unboxed caption. Entries without a photo keep the text and an empty right column; failed images keep their geometry and expose a readable unavailable message. Photo counts in either status sit on a small dark translucent badge. Do not style that informational badge as an action.

Wish and memory details share the same cover, comments, state actions and photo album. Switching status preserves the photo appearance. The album accepts multiple uploads and shows progress and capacity beside a plain heading. Thumbnails open a full-screen dark viewer with white/blue controls; close and previous/next actions have accessible names. Photo and item removal require explicit confirmation.

### Creation and reading surfaces

New and edit forms start with title, then optional URL and comment. New items retain a screen-reader-only heading. URL preview can populate a name and photo while manual entry remains available. Existing items open in read mode with the item name as the heading and a separate edit action. Initial group creation is a plain form; the returning view starts with recent groups. Legal documents keep semantic headings, quiet separators, and direct navigation back.

## Do's and Don'ts

### Do:

- Do keep field labels visible and mark optional fields with `任意`.
- Do preserve the native Japanese sans stack and wrap long user content.
- Do keep controls at least 44px high, text inputs at least 48px high, and visible keyboard focus.
- Do use user uploads or URL previews for photos, with an accessible unavailable state.
- Do respect reduced motion and retain semantic headings, forms, navigation, status regions, and dialogs.

### Don't:

- Don’t add poetic slogans or explanations that repeat the visible controls.
- Don’t blur action roles: reserve blue fill for primary actions and red for deletion; avoid glossy highlights or lifted button hover states.
- Don’t replace the linear list with photo-card grids, box the row text, or substitute decorative imagery for user content.
- Don’t add gradients, literal clouds, decorative blobs, pill-shaped primary actions, or heavy shadows.
- Don’t remove permission, consent, deletion, or recovery information to make a screen sparse.
