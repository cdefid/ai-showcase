# Contributing to AI Showcase

Thanks for helping out. This site is run by the Cyber Defense Indonesia community, and every kind of contribution is welcome.

## Show your project in the next episode

Built something with AI, big or small? Join our Discord server at **https://cdef.id/gabung-diskusi-cdef/** and tell us what you'd like to show the community. We'll schedule you into an upcoming episode, and your project will be added to this site once the episode airs.

## Fix a typo or a wrong detail

Found a typo, a broken link, or something we got wrong about a project? Open a pull request with the fix. Someone on the team (a human or a bot) will review it.

- Project and episode content lives in [`data/showcase.json`](data/showcase.json). You can edit it straight in the GitHub web editor.
- If you're correcting details about a project you built, say so in the PR so we can merge it quickly.
- Keep the JSON valid. The site won't load if it's broken. `python3 -c "import json; json.load(open('data/showcase.json'))"` checks it.

## Improve the site

Design tweaks, accessibility fixes, new filters, performance, better code: open a pull request.

- It's a static site with no build step: [`index.html`](index.html), [`assets/style.css`](assets/style.css) and [`assets/app.js`](assets/app.js).
- Preview locally with `python3 -m http.server 8000` and open http://localhost:8000.
- Check your change at phone width and in both light and dark mode.
- For bigger changes, you can open an issue or start a Discord thread first to talk it through.

The [README](README.md) explains the data format and how to add a new episode.

## Anything else

Ideas, partnerships or questions? Reach us on the [Discord server](https://cdef.id/gabung-diskusi-cdef/) or email **redaksi[at]cdef[dot]id**.
