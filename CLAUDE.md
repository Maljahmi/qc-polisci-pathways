# Queens College Political Science Pathways

A static, single-page website for Queens College (CUNY) political science majors. It has two paths:

- **Grad school** (PhD, MPA, MPP, MA): `<main id="grad">`
- **Law school**: `<main id="law">`

A switch in the top bar toggles between them. Author: Mohamed Aljahmi (student). The site is student-made, not an official Queens College publication, and the footer says so. Keep that disclaimer.

## Files

- `index.html`: the page. Each path's intro, degree tabs, degree descriptions, timelines and guides live inside the two `<main>` elements.
- `data.js`: the opportunities database (`window.PROGRAMS`), one entry per program. Edit programs here, not in `index.html`.
- `app.js`: the deadline board, degree tabs, opportunities lists and filters, countdown chips, link handling, résumé tabs and timeline labels. Deadlines that aren't single programs (LSAT registration, PhD deadline ranges) are in its `EXTRA` list.
- `styles.css`: theme tokens at the top, then components, then responsive rules.
- `downloads/`: the sample résumé, CV and law résumé as editable `.docx` files with `.pdf` copies. The samples section links to them.
- `commons/`: the same content as WordPress block code for a CUNY Academic Commons site, plus `README.md` with posting steps.
- `tools/`: `build_commons.py` rebuilds `commons/` from `index.html`, `data.js` and `app.js`. `build_docx.py` rebuilds the `.docx` files from the `.sheet` samples; export the PDFs from Word afterward. Both use the Python standard library only.

The site itself has no build step, framework or dependencies; `data.js` is a plain script, so the page still works when opened from disk. The only external resource is Google Fonts. After content changes, re-run `python tools/build_commons.py` so the Commons version stays in sync.

## How the content is built

- **Tabs.** Each `<main>` starts with an `.intro` (heading, lead, and `.degrees` cards that link to the tabs), then tab panels: `<div class="panel" id="g-phd" data-label="PhD" data-degree="phd">`. Grad has PhD, MPP, MPA, MA and Guides (`g-phd`, `g-mpp`, `g-mpa`, `g-ma`, `g-guides`); law has JD and Guides (`l-jd`, `l-guides`). One tab shows at a time. The left menu lists the tabs and the open tab's sections; on phones the tabs are chips along the top.
- **A degree tab** has three sections: what the degree is (`…-about`, with a `.facts.deg` list), its timeline (`.sched`, one column per class year), and its opportunities list (`<section class="db" data-degree="phd">` with an empty `.db-app`, which `app.js` fills). The board at the top shows the open degree's deadlines. The PhD tab also has "Find your subfield" (`g-phd-fields`): the five core subfields with a math level in the `.when` column (`data-label="Math"`), evidence that applicants don't need to arrive methods-heavy, and fields some departments add beyond the core five. Every claim there links to an official department page; re-check them each cycle.
- **Sections.** `<section id="g-…">` or `<section id="l-…">` inside a tab. The header is `.sh`, which holds `.no` (the section number) and an `h2`. Numbers restart at 01 in each tab; renumber when you add or remove a section. The menu is built from these automatically.
- **Links.** Any `href="#id"` works across paths and tabs, including program ids (`gp-…`, `lp-…`): the script switches to the right path and tab, clears that list's filters, scrolls to the program and highlights it. Add `data-type="summer-internship"` (or any type) to a link to a list, such as `#g-phd-db`, to open it filtered. Old law-path ids that duplicate a grad program are mapped in `window.ALIASES` in `data.js`.
- **Programs (`data.js`).** Each entry has:
  - `id`, `name` (HTML with the official link), `url`, and `short` (optional, the name on the deadline board)
  - `types`: any of `summer-research`, `summer-internship`, `fall-internship`, `spring-internship`, `fellowship`, `campus`, `visit`, `pipeline`, `course`, `after`
  - `years`: any of `fr`, `so`, `jr`, `sr`, `grad` (after college); `degrees`: any of `phd`, `mpp`, `mpa`, `ma`, `jd`
  - `paid` (`true`, `false`, or `null` if it doesn't apply) and `allOpen` (`true` only if the official page says DACA, undocumented or international students can apply)
  - Dates: `whenB` and `whenS` are the big and small date text. `due` is this cycle's deadline (ISO); it adds a countdown chip and puts the program on the board. `status` is `confirmed`, `estimate`, `last` (only last cycle's date is posted) or `none` (rolling or TBA). `dueMD` is the typical deadline as `MM-DD`, used for sorting. `opens` and `opensMD` are the opening date text and `MM-DD`. Set `event: true` for a date that is an event, not a deadline, to keep it off the board.
  - Text: `meta` (where, length), `body`, `warn`, and `facts` as `[label, html]` pairs such as `["Pay", "$20 an hour"]`.
  - Lists sort by next deadline: this cycle's `due` if it's still ahead, otherwise the next `dueMD`. When a new cycle posts, update `due`, `status`, `whenB` and `whenS`.
- **Heading levels.** Screen readers navigate by heading, so never skip a level. Group subheads are `<h3 class="kick">`. Programs in an opportunities list are `h3`. A program row written in `index.html` is an `h3` directly under a section's `h2`, or an `h4` under a `.kick`. Bento cells and `.aside` titles are `h3`.
- **Other blocks:**
  - `.bento`: the "Pair your major" grid.
  - `.sched`: a timeline. Each cell needs a `data-s` season; the year labels are added by JS for the mobile layout.
  - `.talk`: the professor-advice block and sample email.
  - `.sheet`: paper-style sample résumés and CV.

## Design rules (from the author)

- **Brand:** the site follows the Queens College brand: the Brand Graphics Guidelines and Website Branding Guidelines at qc.cuny.edu/communications/queens-college-branding. Do not use the QC logo or the Q-and-swoosh mark. They are trademarked, need approval from the Office of Communications, and this guide is unofficial.
- **Fonts:**
  - Libre Baskerville (the free web version of ITC New Baskerville, QC's primary typeface) for h1, h2, the advice-block heading (`.talk h3`), the featured bento cell, section numbers and large stats.
  - Geist for body text, program names and group subheads (h3 or h4). It takes the role Gill Sans Bold has in QC's print identity.
  - Geist Mono for dates and numbers only.
  - Small labels are Geist 600 in capitals, tracked .12em, no smaller than 0.72rem (11.5px). Group subheads (`.kick`) are bold sentence case in red, not all caps; QC's web guidelines say to use bold instead of all caps.
  - No Inter, Roboto, Arial or Helvetica.
- **Color:** flat, high-contrast color only; no gradients or mesh backgrounds. The brand values are tokens at the top of `styles.css`.
  - QC Red `#E71939` (Pantone 711): the grad path's header, links, section numbers, accent bars and subheads.
  - QC Black `#000000`: the law path's header ("black-letter law"), the footer, and large blocks (the professor-advice block, the résumé stage, the featured bento cell).
  - Burgundy `#3D070F` (from qc.cuny.edu): the grad deadline board.
  - Gold `#FDC82F` (QC web accent): deadlines 21 days out or closer, the highlighter and text selection.
  - Light gray `#D5D6D2`: hairlines.
  - Text on QC red must be pure white, because white on `#E71939` is only 4.57:1. Never set red text on a colored background (a QC rule).
- **Layout:** asymmetric (ledger rows, uneven bento, split columns). No evenly spaced grids of identical cards, and no centered hero with an image on the left.
- **Motion:** one moment only, on page load. The board rows slide in and the day counts roll up. Respect `prefers-reduced-motion`.
- **Themes:** light and dark both work through the tokens at the top of `styles.css`. Define colors as tokens, never as one-off literals.
- **Mobile:** the page must work at 390px wide with no horizontal scroll. Check this after layout changes.

## Content rules

- **Links:** every program name links to its official page, not a third-party listing where avoidable.
- **Dates:** check each date on the official page before adding it.
  - If only an older date is posted, label it "last cycle".
  - Mark estimates with "~" or "est." in `whenB`/`whenS`, and set `status: "estimate"` in `data.js`.
- **Remove, don't warn:** take out programs that are discontinued, paused, grad-student-only, or not open to Queens College students.
- **Style:** American spelling. Short, plain sentences. No filler.
- **Name:** always "Queens College Political Science", never "QC poli sci".
- **The author's own words:** the "Notes from RBSI" section and any author note must be written by Mohamed himself. Do not generate them.
- **Sample documents:** they are for fictional students (Alex Rivera, Jordan Lee). Keep placeholders like `[Name]` for real people and places.

## Open items

- [ ] "Notes from RBSI" section: Mohamed to write.
- [ ] 4+1 BA/MA prerequisites: the sociology site says DATA 205 and DATA 212, but the graduate catalog says SOC 205 and SOC 334. Confirm with the sociology department.
- [ ] LCD computational linguistics course numbers: the catalog lists LCD 151/251, but the minor page lists LCD 116/120/150/220/250. Confirm.
- [ ] Estimated deadlines to replace once posted (in `data.js`):
  - NY Senate Session Assistants (~Oct 30)
  - Ladders for Leaders (~Jan 15)
  - Leadership Alliance SR-EIP (~Feb 3)
  - SYEP (~Mar 12)
- [ ] Watch for 2027 postings: Bloomberg Philanthropies, Brennan Center winter/spring, Vera, Microsoft DS3, the Ford Foundation (December), Roosevelt Emerging Fellowship (opened Oct 1 last cycle), Pew (January), Harvard PS-Prep (last deadline Oct 9), and next summer's PhD fly-ins (Emory, Brown, UChicago, Indiana, Yale), which close July–August.
- [ ] Pages that block automated checks; confirm in a browser: the Michigan Ford School PPIA stipend ($1,500 vs Harvard's $2,000), whether Columbia's Leadership Alliance site names political science, and the SNF Agora predoc details.
- Links and dates were last re-checked against official pages on Sept 24, 2026.
- [ ] Sample cover letters: not built yet.
- [ ] Deploy on the CUNY Academic Commons (steps in `commons/README.md`), then ask the department to link it from the Political Science menu and Student Resources list.

## Ideas for improvements

- Filters by class year, path, paid/unpaid, and citizenship requirements.
- A search box across all programs.
- "Add to calendar" (.ics) for deadlines.
- Move program data into a JSON file and render rows from it, so updates don't mean editing HTML. This needs a local server, because `fetch` of local files is blocked when you open the page from disk.
- An annual "last checked" date per program.
