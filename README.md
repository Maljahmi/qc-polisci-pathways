# Queens College Political Science Pathways

A student-made guide for Queens College political science majors: year by year, what to do, how to do it and what to apply to for graduate school, law school and jobs. It covers research programs, paid internships, fellowships, deadlines and sample résumés.

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
- **Degree descriptions, timelines and guides:** `classic/index.html`, the old single-page site, which is still the source of the text. Then run `python tools/build_site.py` to rebuild the pages (`grad.html`, `law.html`, `jobs.html`, `programs.html`, `guides.html`, the `guide-*.html` pages and `about.html`). Don't edit those pages by hand.
- **Home page:** `index.html` (with `path.js` and `quiz.js`). **Printable handouts:** `handout.html?path=grad` and `handout.html?path=law`, built by `handout.js`; keep each to one letter page.
- **Look:** `taste.css` (home and shared) and `pages.css` (inside pages). Photos are in `assets/`, with credits in `assets/credits.json`.
- **About this guide and the author's note:** Mohamed's own words, in `classic/index.html` and the home page's About panel.

`CLAUDE.md` holds the project rules, design decisions and open to-dos. Claude Code reads it automatically when you open this folder.

## Publish changes

The site is hosted on GitHub Pages from the `main` branch. To update it, commit your changes and push:

```bash
git push
```

The live site updates within a minute or two. The `commons/` folder holds an optional WordPress version for the CUNY Academic Commons; it is not the main site.

## Keep it accurate

Program details were checked against official pages in September 2026. Dates change every year, so re-check each deadline before a new cycle. Label unconfirmed dates "last cycle" or "est.".
