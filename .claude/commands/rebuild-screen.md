---
description: Rebuild a screen of the current app from its Figma reference
argument-hint: screen or area, such as "My Feed" or "03-my-feed"
---

Rebuild this part of the current app: $ARGUMENTS

If that's empty, read `docs/screens.md` and suggest the next sensible area. Earlier screens in a flow should come first.

## Steps

1. Read `docs/design.md`, `docs/product.md` and the area's entries in `docs/screens.md`.
2. Find the reference images in `../figma-exports/<area>/`. If that folder isn't there, ask the person for screenshots of the screens. Don't work from memory or guess a layout.
3. Look at every image for the area, including all its states. Read the matching domain page in `.knowledge/` if it exists, because product rules win over Figma. Skip anything `docs/product.md` says isn't current.
4. Build in `app/`, using shared components and adding to `assets/css/app.css` and `assets/js/app.js` when something will be reused. Add new shared components to `design-system/index.html`.
5. Show every state in the reference. Let reviewers reach them, for example with `?state=empty` on the page's address, and list the state links in `app/index.html`.
6. Link the screen to any rebuilt screens it connects to. Replace "not rebuilt yet" messages where a real screen now exists.
7. Use placeholder content: fictional names and gradient thumbnails, never Figma's artwork.
8. Mark the screens as rebuilt in `docs/screens.md`.

## Check it

1. Run `/check`.
2. Screenshot each state at 402 wide and compare it side by side with its reference. Look at spacing, sizes, corners, colours, icons and wording, and fix differences.
3. Report anything you couldn't match, and why. Don't commit.
