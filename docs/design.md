# How screens are built

The app's components come from the open-source shadcn/ui kit for Figma, with UltraStream's colours and Lucide icons. This repo recreates those patterns in plain CSS. See them live in `design-system/index.html`.

## Foundations

| Thing | Value |
|---|---|
| App screen size | 402 wide, framed on desktop and full screen on a phone (`.stage` and `.phone`) |
| Page side margin | 16px |
| Background | `--black` |
| Raised boxes | `--surface-2`, 12px corners |
| Buttons and inputs | 40px tall, 8px corners, 1px white border |
| Chips and action-row buttons | 36px tall. `.btn--sm` is 32px, for tight spots only |
| Thumbnails | 12px corners. Videos 16:9, shorts in the feed 298:364 |
| Avatars | 40px in cards, 56px on the video page |
| Font | Inter (not confirmed against Figma) |

## Colour

- Palette steps are in `assets/css/palette.css`. Step 6 is the base of each brand colour.
- **Main action:** gradient from `brand/red-6` to `brand/orange-dark-6`, with white text (`.btn--primary`).
- **Active tab, warning text:** `brand/orange-6`.
- **Delete, errors:** `--destructive`.
- **Selected tab or chip:** white fill, dark text.
- **Secondary text:** `--text-3` for views and dates, `--text-2` for supporting copy.
- **Gold:** `brand/gold-6` is in the palette for reward moments. Check the reference before using it.

## Icons

Lucide, round version where one exists. These are the ones the app uses:

| Use | Icon |
|---|---|
| Discover, My Feed, Create, Shorts, Profile | `compass`, `user-round-search`, `circle-plus`, `video`, `circle-user-round` |
| Notifications, search | `bell-dot`, `search` |
| Back | `arrow-left` |
| Like, dislike, comments | `thumbs-up`, `thumbs-down`, `message-circle` |
| Reward, share, report | `hand-coins`, `share`, `flag` |
| Live badge, view count | `radio`, `eye` |
| Close, more | `x`, `ellipsis-vertical` |
| Empty content, error, offline | `clapperboard`, `triangle-alert`, `wifi-off` |
| Loading | `loader-circle` with `icon--spin` |
| Notifications off, not available | `bell-off`, `video-off` |

For anything else, pick the closest Lucide icon and list it in your hand-over.

## Common patterns

- **Screen header:** back arrow and title (`.app-header`), with an optional action on the right.
- **Tabs inside a screen:** outlined chips, with the selected one filled white (`.chip` with `aria-pressed`).
- **Empty, error, offline and loading states:** centred icon, title, one line of help and a main action (`.empty-state`). Most screens need these, so include them. Loading has no action unless its reference shows one.
- **Short messages:** `US.toast("Text")`. Text only, with no buttons.
- **Settings-style lists:** `.list-row` inside `.screen-body`.
- **Scrolling feeds:** `.feed` as the container. Use `.card` and `.short-row` in it, because they bring their own side margins. Don't put them in `.screen-body`.
- **Confirmations:** a dialog with a close X, a title, one line of text, a main action and an outlined Cancel (`.dialog`). Deleting also uses the main gradient button here, as in Figma.
- **Video page actions:** the row holds six actions and just fits at phone size, so it can't take another. Put a new action somewhere else, and flag the placement as a question.
- **Forms:** label above, white-bordered input, error or warning text below. Check on submit, then update as the person fixes things.
- **Bottom tabs:** on the five main screens only. Copy them from `app/discover.html`.

## Discover feed layout

Two full-width videos, then two shorts side by side, repeating (`US.createFeedStream` in `assets/js/app.js`).

## Writing on screen

Short, plain and specific. Tell people what happened and what to do next. Use the terms in `docs/product.md`.

## Placeholder content

- Use fictional brands and creators. Use gradient thumbnails, not artwork copied from Figma, because this repo may be public.
- Label invented prices, limits and results as placeholders on screen. Sample video names and view counts don't need a label.
- Forms that collect real people's details, such as a public enquiry form, must never send or store what's typed. Say so on the page. Demo data like a test campaign can stay in the person's own browser.

## Prototype pages

Every prototype page carries a visible prototype bar, and `<meta name="robots" content="noindex">`. Review tools such as the Billboard demo clock belong in the prototype's own folder, never in `app/`.

Let reviewers reach each state with `?state=empty` on the page's address, and link those from the prototype's overview page.

A prototype's copied screens don't update when `app/` changes. That's intended: a prototype shows what was agreed at the time.

Scripts for a prototype go in its `js/` folder. Scripts for one app screen sit beside that screen in `app/`.
