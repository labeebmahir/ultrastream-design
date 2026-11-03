---
description: Design a new feature or improvement as a working prototype with its own link
argument-hint: what you want to design
---

Create a prototype for: $ARGUMENTS

If that's empty, ask what they want to design and which ticket or brief it's for.

## 1. Understand it

1. Read `docs/product.md` and `docs/design.md`.
2. Check `.knowledge/confluence/index.json`. If it's missing, run the steps in `/confluence-updated` first. If that isn't possible, say the prototype will rest on `docs/` alone and continue.
3. Read the feature's brief and the domain pages that own the rules it touches. If the person mentions a ticket and you can't read it, ask them to paste or attach it.
4. Say back in a few lines what you'll build, what's out of scope and what you're unsure about. Ask only about things that would change the work; otherwise make a choice and record it.

## 2. Build it

1. Copy `prototypes/_template/` to `prototypes/<feature-name>/`, using a short lowercase name. This folder becomes the permanent link, so choose it carefully.
2. Update the copy: rename `app/screen.html`, set the titles, list the steps in the `CONFIG` at the top of `js/prototype-bar.js` and in `index.html`, and set the feature and questions at the bottom of `questions.html`. Use the same feature name in both.
3. Start from the real screens in `app/`. If a screen you need isn't rebuilt yet, build it from its Figma export, as in `/rebuild-screen`. Figma exports are in `../figma-exports/` if this computer has them, with `INDEX.md` as the guide. If not, ask for a screenshot. If there isn't one, build a stand-in with only what the feature needs, label it on screen as a stand-in, and flag it in your hand-over. Don't add stand-ins to `app/`.
4. Keep everything only this feature needs inside its folder. Don't change `app/` for something that hasn't shipped.
5. Use `prototypes/billboard/` as the example for how a prototype handles flows, data and review tools.
6. Cover the flow from start to finish, including empty, error and validation states, at the right size: phone for app screens, desktop for admin and website pages.
7. Add it to the top-level `index.html`.

## 3. Check it

Run `/check`, and add a test file for its main flow as described there.

## 4. Hand it over

Tell the person, in plain language:

1. **How to see it:** the file to double-click.
2. **What's real and what's placeholder.**
3. **Assumptions you made,** so they can correct them.
4. **A comment ready to paste on the ticket:** the link, and what to review. Point to `questions.html`, where reviewers can answer the product questions and export them. Write this in chat. `CLAUDE.md` explains how to work out the link.
5. **How to publish:** in GitHub Desktop, make a branch, commit, push and merge into `main`. Don't do this for them unless they ask.
