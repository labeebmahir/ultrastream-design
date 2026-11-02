# UltraStream design

UltraStream's design file, written as plain HTML, CSS and JavaScript. New screens and features are designed here as working pages, and tickets link to them.

## Create a screen with Claude

1. Get access to this repo and clone it, for example with GitHub Desktop.
2. Open the repo folder in Claude Code.
3. Say what you want, such as "Create a prototype for saving videos to watch later", or use a command:

| Command | What it does |
|---|---|
| `/new-prototype` | Designs a new feature or improvement |
| `/rebuild-screen` | Rebuilds a screen of the current app from its Figma reference |
| `/confluence-updated` | Downloads the latest product knowledge to your computer |
| `/check` | Tests every page and reviews how it looks |

Claude reads the project's rules from [`CLAUDE.md`](CLAUDE.md) in every chat, so you don't need to explain them.

## First-time setup

| You need | Why |
|---|---|
| Claude Code and access to this repo | To create screens |
| The link to the team's Confluence space | Claude asks for it the first time and keeps it on your computer only |
| Your Atlassian account connected in Claude | So Claude can read the restricted Confluence pages |
| The Figma exports in a `figma-exports` folder next to this repo | To rebuild screens. Ask the team. They stay out of this repo because they contain third-party artwork |
| [Node.js](https://nodejs.org) and Microsoft Edge or Google Chrome | To run the tests |

## See it

Double-click `index.html`. It works without a server.

## Layout

| Path | What's in it |
|---|---|
| `index.html` | List of all prototypes |
| `app/` | The current app, rebuilt screen by screen, without unreleased features |
| `prototypes/<feature>/` | One feature's prototype, with its own permanent link |
| `design-system/` | Live page of tokens, components and icons |
| `assets/` | Shared styles, scripts, logo and icons |
| `docs/` | The product, how screens are built, and the list of app screens |
| `tests/`, `tools/` | Browser tests and scripts. The site doesn't depend on these |

## Publish your work

The site is published from the `main` branch by GitHub Pages, and a push updates it a minute or two later. Everything in this repo gets published, so internal documents never go here.

1. In GitHub Desktop, create a branch for your work so unfinished work stays off the live site.
2. Commit, push and merge into `main`.
3. Put the prototype's link on its ticket: the site's address followed by `prototypes/<feature>/`.

Never move or rename a prototype's folder after that, because the link would break.

## When a prototype is agreed or ships

- **Agreed:** copy the files it uses from `assets/` into its folder and point its pages at those copies, so later style changes can't alter what was agreed.
- **Shipped:** add the feature to `app/` and keep the prototype folder as the record.
