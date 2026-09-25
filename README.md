# Queens College Political Science Pathways

A student-made guide to grad school and law school paths for Queens College political science majors. It covers research programs, paid internships, fellowships, deadlines with live countdowns, and sample résumés.

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
- **Deadline board, tabs and filters:** `app.js`. The board reads `data.js`; deadlines that aren't programs (LSAT registration) are in its `EXTRA` list.

`CLAUDE.md` holds the project rules, design decisions and open to-dos. Claude Code reads it automatically when you open this folder.

## Put it online (GitHub Pages)

1. Create a new GitHub repository and upload these files. `index.html` must be at the top level.
2. In the repo, go to **Settings → Pages**. Set the source to your main branch and the `/ (root)` folder.
3. The site appears at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## Keep it accurate

Program details were checked against official pages in September 2026. Dates change every year, so re-check each deadline before a new cycle. Label unconfirmed dates "last cycle" or "est.".
