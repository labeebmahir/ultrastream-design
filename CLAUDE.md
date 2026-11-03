# UltraStream design repo

This repo is UltraStream's design file, written as code. It replaces Figma: new screens and features are designed here as working HTML pages, and tickets link to them. Anyone on the team should be able to open this repo in Claude Code, say what they want, and get a screen that matches the app.

Most people using this are designers and product people, so explain things plainly and don't assume they know Git or code.

## Hard rules

1. **Plain HTML, CSS and JavaScript only.** No frameworks and no build step. Use classic `<script src>` tags, because ES modules break when a page is opened from disk. Every page must work when double-clicked and on GitHub Pages, so link to files (`folder/index.html`), never to bare folders.
2. **Use what exists.** Check `design-system/index.html` and `assets/css/` first. Add to them only when something is really new.
3. **Colours come from `assets/css/palette.css`** through the tokens in `assets/css/base.css`. Don't add new hex values.
4. **Icons are Lucide, round version where one exists** (`user-round-search`, not `user-search`): `<i class="icon" data-lucide="bell-dot"></i>`. Never draw icons by hand or use text arrows.
5. **This repo may be public, and everything in it gets published, including code comments.** Never add internal documents, Confluence text or links, people's names, ticket details, business problems, open questions or game artwork from Figma. Internal knowledge stays in `.knowledge/`, which Git ignores. Code comments describe how something behaves. Product questions go only on the prototype's `questions.html`, in neutral wording with no business detail. The tests only catch obvious leaks, so read what you've written before handing over. If unsure, leave it out and ask.
6. **Don't commit or push unless the person asks.** They review and publish the work themselves, usually in GitHub Desktop.
7. **Don't decide product questions.** Where the brief is silent, make a sensible choice so the prototype can work and make it easy to change. List them on the prototype's `questions.html`, with what the prototype does now. Reviewers answer there and export a file, which the person can bring back to you to apply. Give the person a short comment for the ticket, with the link, in chat. If there's no ticket yet, say one is needed.
8. **Test before saying it's done** with `/check`. Look at screenshots as well: the tests can't judge how something looks.

## Where things are

| Path | What it is |
|---|---|
| `index.html` | List of all prototypes |
| `app/` | The current app, rebuilt screen by screen, with no unreleased features |
| `prototypes/<feature>/` | One feature's prototype, with its own permanent link. `prototypes/billboard/` is the worked example, and `prototypes/_template/` is the starting point |
| `design-system/` | Live page of tokens, components and icons |
| `assets/` | Shared by everything: `css/`, `js/app.js`, `img/`, `vendor/` |
| `docs/product.md` | What the product is, its rules and its terms. Read before designing |
| `docs/design.md` | How screens are built. Read before designing |
| `docs/screens.md` | Every app screen and state, and which are rebuilt |
| `tests/` | Browser tests, run by `/check` |
| `tools/` | Scripts, including the Confluence download |
| `.knowledge/` | Each person's private copy of Confluence. Not in Git |

## Commands

| Command | Use it to |
|---|---|
| `/new-prototype` | Design a new feature or improvement |
| `/rebuild-screen` | Rebuild a screen of the current app from its Figma reference |
| `/confluence-updated` | Download the latest product knowledge, also when someone says "confluence updated" |
| `/check` | Test everything and review how it looks |

If someone just describes what they want without using a command, follow the matching command anyway.

## Where the truth lives

- **Product rules:** Confluence is the single source of truth, read through `.knowledge/`. Domain pages win over Figma where they disagree. If `.knowledge/` is missing, run `/confluence-updated` first. If that isn't possible, carry on from `docs/` and say the work hasn't been checked against Confluence. The product manager can give you the Confluence link and access.
- **How the app looks:** `app/` is the reference, and new design starts from it. Figma is reference only, and most people won't have or need its exports. If `../figma-exports/` exists on this computer, use it for screens not yet rebuilt.
- **Older Confluence comments and legal pages can lag the product.** Say so if you spot a conflict, and don't quietly pick one.

## Keep links working

A prototype's link goes on its ticket, so never move or rename a prototype's folder after it's shared. To work out the live address, read the repo's owner and name from `git remote -v`: `https://<owner>.github.io/<repo>/prototypes/<feature>/`. That bare-folder link is fine online, but links between pages must still name the file. If there's no remote, tell the person to add the site address themselves. Changes to `assets/` affect every prototype. When a prototype is agreed, follow the "When a prototype is agreed or ships" steps in `README.md`.

## Keep this repo teaching

When someone corrects you on how the app looks or works, and the correction would help the next person, add it to `docs/design.md` or `docs/product.md` as part of that work, as long as it's safe to publish under rule 5.
