---
description: Test every page in a real browser and review how the work looks
---

## 1. Run the tests

First time on this computer, run `npm install` in `tests/`. Node.js and either Microsoft Edge or Google Chrome are needed. If Node.js is missing, tell the person how to install it from nodejs.org.

Then run `npm test` in `tests/`.

- `site.mjs` checks every page automatically, including new ones: no errors, no missing files, working links, icons, no sideways scrolling at phone size, and nothing unsafe to publish.
- Every other `.mjs` file tests one feature's flow. All of them run, even if one fails.

Screenshots go in `tests/output/`.

## 2. Test new flows

If you built a new flow, add `tests/<feature-name>.mjs` using `tests/billboard.mjs` as the example. It's picked up automatically. Test what a person does, including mistakes, and test it opened from disk as well, with `fileUrl` from `lib.mjs`. Start your screenshot names with the feature's name. Don't write tests that depend on how many items are on a shared page.

## 3. Look at it

Tests can't judge how something looks. Open the screenshots of whatever changed and compare them with the Figma reference. If you don't have one, compare with nearby screens and say so. Check:

- Spacing, alignment and text that's cut off.
- Dropdowns and other pop-ups: tests can't see the browser's pop-up list, so check their colours in the code as well.
- Phone size for app screens, desktop size for admin and website pages.

## 4. Report honestly

Say what passed, what failed and what you couldn't check. Fix failures and run the tests again before saying the work is done. If a test is wrong rather than the page, explain why before changing it. Don't commit.
