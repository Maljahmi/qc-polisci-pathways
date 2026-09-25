# Queens College Political Science Pathways

A student-made guide to grad school and law school paths for Queens College political science majors. It covers research programs, paid internships, fellowships, deadlines with live countdowns, and sample résumés.

**Live site:** https://maljahmi.github.io/qc-polisci-pathways/

## Run it

It is plain HTML, CSS and JavaScript, so there is nothing to install.

- **Quickest:** double-click `index.html` to open it in a browser.
- **Local server (optional):** from this folder, run one of these, then open http://localhost:8000:

  ```bash
  python3 -m http.server 8000
  # or
  npx serve .
  ```

## Edit it

- **Programs:** `data.js`. Each program is one entry with its type, class years, degrees, dates and link; `CLAUDE.md` explains the fields.
- **Degree descriptions, timelines and guides:** `index.html`.
- **Colors, fonts, layout:** `styles.css`. The theme tokens are at the top.
- **Deadline board, tabs and filters:** `app.js`. The board reads `data.js`; deadlines that aren't programs (LSAT registration) are in `window.EXTRA_DEADLINES` at the end of `data.js`.
- **Printable handouts:** `handout.html?path=grad` and `handout.html?path=law`, built by `handout.js`. Keep each to one letter page.
- **About this guide and the author's note:** `index.html`, above the footer and in each path's intro. These are Mohamed's own words.

`CLAUDE.md` holds the project rules, design decisions and open to-dos. Claude Code reads it automatically when you open this folder.

## Publish changes

The site is hosted on GitHub Pages from the `main` branch. To update it, commit your changes and push:

```bash
git push
```

The live site updates within a minute or two. The `commons/` folder holds an optional WordPress version for the CUNY Academic Commons; it is not the main site.

## Keep it accurate

Program details were checked against official pages in September 2026. Dates change every year, so re-check each deadline before a new cycle. Label unconfirmed dates "last cycle" or "est.".
