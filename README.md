# UltraStream design

The UltraStream design file, in plain HTML, CSS and JavaScript. There is no framework and no build step. Each screen is one HTML page, and tickets link to the page that shows the design.

## Run it

Open `index.html` in a browser. To serve it locally instead, run `npx serve` in this folder.

## Layout

| Folder | What's in it |
|---|---|
| `app/` | Mobile app screens (phone size) |
| `admin/` | Admin panel screens (desktop) |
| `web/` | Public website pages |
| `assets/css/` | `base.css` holds shared tokens and components; `app.css` and `admin.css` are per surface |
| `assets/js/` | `data.js` holds placeholder data, `store.js` holds demo state and rules, `proto-bar.js` is the review toolbar |
| `assets/vendor/` | jsPDF, used for the downloadable report |

## Adding a screen or feature

1. Add a page in `app/`, `admin/` or `web/`, copying the `<head>` and script tags from a page beside it.
2. Use the tokens in `assets/css/base.css` instead of new colours or fonts.
3. Keep placeholder data in `data.js` and label it as a placeholder on screen.
4. Add the page to the links in `assets/js/proto-bar.js` and `index.html`.
5. Link the page in the ticket.

The Figma file is for reference only. New design work happens here.

## Status

- **Billboard (first release):** prototype ready for review.
- **Rest of the app:** to be rebuilt here from the Figma reference.
