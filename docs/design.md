# How screens are built

Values come from the live app's code, which wins over Figma where they differ. This repo recreates its look in plain CSS. See it live in `design-system/index.html`.

## Foundations

| Thing | Value |
|---|---|
| App screen size | 402 wide, framed on desktop and full screen on a phone (`.stage` and `.phone`) |
| Page side margin | 16px |
| Background | `--black` (#090909) |
| Raised boxes | `--surface-2` (#191919), 16px corners (`.box`) |
| Buttons | 48px tall (40 small, 56 large), 6px corners, red-to-orange gradient |
| Inputs | Outlined white, 10px corners, label above |
| Chips | 44px tall, 10px corners, 1.5px white border. Selected is white with bold black text |
| Thumbnails | 16px corners. Videos 16:9, shorts 9:16 |
| Avatars | 36px in feed cards, 40px in people cards, 56px on profiles. With no picture, which is every sample person, the app's AppAvatar is the red-to-orange gradient with a white Lucide `user` icon at 60% of the size, never a first letter (`US.avatarHTML`). Edit profile and Create channel draw their own 72px placeholder: grey with a person icon |
| Switches | React Native's own switch: solid red (`--accent`) when on, never the gradient, with a white thumb (`.switch`) |
| Font | The system font (SF on iPhone, Roboto on Android), as in the app |

## Type

The app uses the system font with these sizes:

| Use | Size / line height | Weight |
|---|---|---|
| Screen titles | 20 / 28 to 24 / 32, by screen | Bold. Studio screens use 16 bold, with 24px side margins |
| Section titles | 22 / 28 | Semibold |
| Video page title | 20 / 26 | Bold |
| Empty state and dialog titles | 22 / 28 | Bold |
| Card titles | 16 / 24 | Medium |
| Body text | 14 / 20 | Regular |
| Card subtitles: creator, views, time | 12 / 16 | Regular, white at 50% |
| Tab labels | 11 / 16 | Medium |

The `.text-*` classes in `assets/css/base.css` are for desktop pages. The public website pages keep ultrastream.one's fonts, Space Grotesk and Inter.

## Colour

- Palette steps are in `assets/css/palette.css`. Step 6 is the base of each brand colour.
- **Main action:** gradient from `brand/red-6` (#D80A00) to `brand/orange-6` (#FF7F00), with white text (`.btn--primary`).
- **Active tab:** `brand/orange-6`.
- **Destructive actions, such as Log out and Delete:** `--destructive` (#D80A00). **Error messages:** `--error` (#E5484D).
- **Selected chip or action pill:** white fill, black text.
- **Secondary text:** `--text-3` (white at 50%).
- **Gold:** `brand/gold-6` (#F4B545) appears in the points pill gradient. Check the code before using it elsewhere.
- **Solid brand red** (`--accent`, the app's `colors.primary`): spinners, a switch that's on, success banners.

## Icons

Lucide, by the names the app uses, at Lucide's normal stroke of 2 (set on `.icon`). Don't make icons thinner: the app draws them from Lucide's icon font, so thinner strokes look like a different set. The app also uses some MaterialCommunityIcons; use the closest Lucide icon instead and say which in your hand-over.

| Use | Icon |
|---|---|
| Discover, My Feed, Create, Shorts, Profile | `compass`, `user-round-search`, `plus` in a ringed circle, `video`, `circle-user-round` |
| Notifications, search | `bell-dot`, `search` |
| Back | `arrow-left` on most screens; `chevron-left` in a bordered square over the video player |
| Like, dislike, comments | `thumbs-up`, `thumbs-down`, `message-circle` |
| Reward, share | `hand-coins`, `share` |
| Live badge, view count | `radio`, `eye` |
| Settings, edit channel | `settings-2`, `user-round-pen` |
| Close, more | `x`, `ellipsis-vertical` |
| Empty content, error, offline | `clapperboard`, `triangle-alert`, `wifi-off` |
| Content not found | `party-popper` |
| Loading | Not an icon: the app's spinner is a plain ring (`.spinner`, see below). Busy buttons use `loader-circle` with `icon--spin` |

## App screens

- **Main tabs:** add `<header class="topbar" data-topbar></header>` and `<nav class="tabbar" data-tabbar="discover"></nav>`. `assets/js/app.js` fills them in, with the tab named in `data-tabbar` marked as current. Tabs link to `discover.html`, `my-feed.html`, `create.html`, `shorts.html` and `profile.html`.
- **Other screens:** use `.app-header` with a back arrow and title.
- **Screen viewer:** every screen in `app/` opens inside a viewer, which is review tooling and not part of the app. At 1024 wide and up it shows the site header, every screen by area on the left, and on the right the screen's name, its states as links and previous and next; the left and right arrow keys move between screens. Narrower, it's one compact bar with back to the list, a screen picker and a state picker. `assets/js/app.js` loads it (`assets/js/viewer.js`, styled in `assets/css/viewer.css`) only for top-level pages in `app/`, never inside a frame or a prototype, and the screen itself is unchanged.
- **Site header:** the repo's own pages (home, activity log, design system, components and the app index) share one header: `<header data-site-header data-root="../" data-current="app"></header>` with `assets/css/site-header.css` and `assets/js/site-header.js`. `data-root` is the path back to the repo's root, and `data-current` marks App, Components or Activity. Prototype pages don't use it: they have their prototype bar.
- **Adding a screen:** add it to `US.APP_SCREENS` in `assets/js/app.js` as `[file, name]`, or `[file, name, start]` where `start` is the address it opens with, such as `"id=v2"`. Then list its states in `US.APP_STATES`, starting with the one it opens in: `["", "Feed"], ["empty", "Empty"]`. A bare word means `?state=<word>`; anything with `=` is used as it is, such as `"as=creator&state=new"`. List only states the screen's script really handles. The app index (`app/index.html`), the viewer and the home page search all read these two lists, and the tests open every state listed.
- **Shared data:** `US.CONTENT` for videos and shorts, `US.CREATORS` for creators, and `US.avatarHTML(name)` for avatars. Nobody in the sample data has a picture, so every avatar shows the app's no-picture look.
- **File names:** one HTML file per screen in `app/`, named after what it shows, such as `watch-history.html`. Area-only styles go in `app/css/<area>.css` and scripts in `app/js/<area>.js`. Add to the shared files only when something will be reused.

## Common patterns

- **Tabs inside a screen:** chips, with the selected one filled white (`.chip` with `aria-pressed`).
- **Empty, error and offline states:** centred icon at 40px, a bold title, one line of help, and a full-width action where the app has one (`.empty-state`). Most screens need these, so include them.
- **Loading states:** the app's spinner, like React Native's ActivityIndicator: a plain ring in the brand red, centred, with no text (`US.spinnerHTML()` for the large one, `US.spinnerHTML("")` for the small one). Only add a line such as "Searching..." where the app has one. Discover, My Feed and Notifications show skeletons instead. Busy buttons keep their own loader.
- **Messages:** match what the app does at that moment, which is often nothing.
  - Errors from the server, such as a failed delete or sign-in: `US.appToast("Text")`, the app's AppToast. A red banner 50px from the top with an icon and Dismiss; `US.appToast("Text", "success")` is brand red. Sign-in screens have their own copy, `OB.toast`.
  - Saved changes and many form errors: `US.alert("Success", "Username updated successfully", [{ text: "OK", onPress }])`, the phone's own alert (React Native's `Alert.alert`). Kept plain because iOS and Android draw it. After a save, OK usually goes back.
  - Things the app doesn't show, such as "This screen isn't rebuilt yet." or "This opens the phone's share sheet.": `US.toast("Text")`. It's a review note for reviewers, styled like the viewer's compact bar, and not part of the app. Never use it for an app message.
- **Switches:** `.switch`, React Native's own: solid red when on, a white thumb. Off is the track colour the screen passes: dark by default, white with `.switch--light` on Go Live.
- **Video cards:** `US.cardHTML(item)`, as AppVideoCard: thumbnail, then the 36px avatar with the title and "creator • views • age" beside it. The app's `layout` prop draws the same card, so there's one version. On Discover each row has 12px above and 16px below, and two shorts are 49% wide each.
- **Settings-style lists:** `.list-row` inside `.screen-body`.
- **Promo cards and stat tiles:** `.box`.
- **Scrolling feeds:** `.feed` as the container. Use `.card` and `.short-row` in it, because they bring their own side margins. Don't put them in `.screen-body`.
- **Confirmations:** a dialog with a close X, a bold title, one line of text, a gradient confirm button and a white-outlined Cancel, both 52px tall with 16px corners (`.dialog`).
- **Bottom sheets:** comments, rewards and sign-in prompts slide up from the bottom (`.sheet-backdrop` and `.sheet-panel`).
- **Video page actions:** a horizontal row of pills that scrolls sideways: like, dislike, comments, Reward, then share as an icon.
- **Area helpers:** each area has its own dialog and sheet helpers in `app/js/`. Reuse one from a neighbouring screen before writing another.
- **Component library:** `design-system/components.html` shows every component with its name in the app's code, React Native code for developers and HTML for this repo. Start there. When you add or change a component, update its entry in `design-system/components/<area>.js`, including `rn`. React Native code shows how to use the app's components (`rnKind: "usage"`), or, where the app has no shared component, a short snippet from React Native parts and the theme (`rnKind: "pattern"`, with `rnWhere`). Never copy the app's source, styles, logic, addresses or keys into it. A new data file must also be added to the script list in `components.html` and `index.html`.
- **Forms:** label above, white-bordered input, error text below in `--error`. Check on submit, then update as the person fixes things.

## Welcome

The welcome screen is a fixed row of three icons (Discover, Rewards, Connect), not a carousel.

## Discover feed layout

Videos are full width. Consecutive shorts sit two across. A Suggested Creators strip appears after the second row. The category chips start with "All". See `US.createFeedStream` in `assets/js/app.js`.

## Writing on screen

Short, plain and specific. Tell people what happened and what to do next. Use the terms in `docs/product.md`.

## Placeholder content

- Use fictional brands and creators. Use gradient thumbnails, not artwork copied from Figma, because this repo may be public.
- Label invented prices, limits and results as placeholders on screen. Sample video names and view counts don't need a label.
- Forms that collect real people's details, such as a public enquiry form, must never send or store what's typed. Say so on the page. Demo data like a test campaign can stay in the person's own browser.

## Prototype pages

Every prototype page carries a visible prototype bar, and `<meta name="robots" content="noindex">`. Review tools such as the Billboard demo clock belong in the prototype's own folder, never in `app/`.

Questions go on the prototype's `questions.html`, one at a time. Write each as a short question with two to four answers to tap, and mark the one the prototype uses now. "Something else" is added automatically. Reviewers export a file, and nothing is sent anywhere.

The prototype bar shows the prototype's steps in order. List them in the `CONFIG` at the top of the prototype's bar script, in the order someone should walk through them.

On narrow screens, a table with many columns becomes labelled cards: add `data-label` to its cells, as in the Billboard campaign list. Text inputs are 16px below 1024px wide, because iPhones zoom the page on anything smaller.

Let reviewers reach each state with `?state=empty` on the page's address, and link those from the prototype's overview page.

A prototype's copied screens don't update when `app/` changes. That's intended: a prototype shows what was agreed at the time.

Scripts for a prototype go in its `js/` folder. Scripts for one app screen sit beside that screen in `app/`.
