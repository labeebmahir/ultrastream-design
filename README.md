# UltraStream design

The UltraStream design file, in plain HTML, CSS and JavaScript. There is no framework and no build step. Tickets link to the prototype that shows the design.

Live site: https://labeebmahir.github.io/ultrastream-design/

## Run it

Open `index.html` in a browser. To serve it locally instead, run `npx serve` in this folder.

## Layout

| Folder | What's in it | Link |
|---|---|---|
| `index.html` | List of all prototypes | `/` |
| `app/` | The current app, rebuilt screen by screen, without unreleased features | `/app/` |
| `prototypes/<feature>/` | One feature's prototype: its own pages, scripts, styles and placeholder data | `/prototypes/<feature>/` |
| `assets/` | Shared by everything: `css/` tokens and components, `js/app.js` content and feed, `img/` logo | |

Figma is for reference only, and new design work happens here. Screens follow the open-source shadcn/ui kit used in Figma, so use the tokens and components in `assets/css/base.css` instead of new colours or fonts.

## Adding a prototype

1. Create a branch for the feature. Unfinished work stays off the live site until it's merged into `main`.
2. Add `prototypes/<feature>/` with an `index.html`, using `prototypes/billboard/` as the example.
3. Keep anything only this feature needs inside its folder. Don't change `app/` for a feature that hasn't shipped.
4. Label placeholder data as placeholder on screen.
5. Add it to the list in the top-level `index.html`.
6. Merge into `main`, then put its link on the ticket. Never move or rename the folder after that, because the link would break.

## When a prototype is agreed or ships

- **Agreed:** copy the files it uses from `assets/` into its folder and point its pages at those copies, so later style changes can't alter what was agreed.
- **Shipped:** add the feature to `app/` and keep the prototype folder as the record.

## Status

| Work | Status |
|---|---|
| Billboard, first release | In review |
| Rebuilt app | In progress: Discover and the video page |
