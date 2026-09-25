# Putting the guide on the CUNY Academic Commons

The Commons is CUNY's WordPress platform. It blocks custom scripts, so this version drops the countdown board, the Grad/Law switch and the résumé tabs. The content, links and dates are the same as the main site.

## What's in this folder

| File | What it is |
|---|---|
| `home.html` | The Home page |
| `grad-school.html`, `law-school.html` | Each path's overview: the degree options and upcoming deadlines |
| `grad-phd.html`, `grad-mpp.html`, `grad-mpa.html`, `grad-ma.html`, `law-jd.html` | One page per degree: what it is, a timeline for each year of college, and its opportunities list |
| `grad-guides.html`, `law-guides.html` | Advice: professors, methods, applying, fee waivers, the LSAT, gap years and résumés |
| `preview.html` | Every page in one plain file, for checking before you paste |

The Commons blocks scripts, so the opportunities lists can't be filtered there. Each degree page lists its programs grouped by type (summer research, summer internships, fellowships and so on) and sorted by next deadline.

The download buttons for the sample résumés and CV link to the copies in `../downloads/` on the GitHub Pages site. Built without `--site`, they are placeholders (starting with `#upload-`) for Media Library links instead.

## Steps

1. **Join the Commons.** Go to [commons.gc.cuny.edu](https://commons.gc.cuny.edu/) and register with your CUNY email. Undergrads can join.
2. **Create a site.** Go to [Create a Site](https://commons.gc.cuny.edu/sites/create/). Pick a short address and a simple theme. This guide lives at `qcpolscipathways.commons.gc.cuny.edu`.
3. **Make 10 pages.** Go to Pages → Add New. Each file's name is the page's slug, and the slugs must match exactly so the links between pages work:
   - **Home** (any slug)
   - **Grad school** `grad-school`, then **PhD** `grad-phd`, **MPP** `grad-mpp`, **MPA** `grad-mpa`, **MA** `grad-ma`, **Guides** `grad-guides`
   - **Law school** `law-school`, then **JD** `law-jd`, **Guides** `law-guides`

   The slug is under Page settings → URL (or Permalink). Keep the pages top-level; don't set a parent page, or the addresses change.
4. **Paste the content.** For each page:
   1. Open the page in the editor.
   2. Click ⋮ (top right) → **Code editor**.
   3. Paste the whole matching `.html` file.
   4. Click **Exit code editor**, then **Save**.

   If any block says "This block contains unexpected or invalid content", click **Attempt recovery**.
5. **Set the homepage.** Go to Settings → Reading → "Your homepage displays" → **A static page**, and choose **Home**.
6. **Résumé and CV files (optional).** The download buttons already link to the GitHub Pages copies. To host the files on the Commons instead:
   1. Go to Media → Add New and upload the six files from `downloads/`.
   2. Click each file and use **Copy URL to clipboard**.
   3. The download buttons are on **grad-guides** (résumé and CV) and **law-guides** (law résumé). Click each button, click the link icon, and replace the link with the file's URL.
7. **Add the menu.** Go to Appearance → Menus, or the Site Editor → Navigation. Add **Home**, **Grad school** and **Law school**, and put each path's degree and Guides pages under it as a dropdown. Every page also has a line of links to its path's other pages at the top.
8. **Use QC colors.** If your theme lets you pick colors (Customize → Colors, or Site Editor → Styles → Colors), set the link, button and accent color to Queens College Red `#E71939`. Button text on red must be white. Don't add the QC logo: it's trademarked and needs approval from the Office of Communications.
9. **Add co-admins.** Go to Users and invite a faculty member or the department office as Administrators, so the site keeps going after you graduate.
10. **Check the interactive version.** Each degree page has a "Filter and sort these programs" button that opens the full site on GitHub Pages (https://maljahmi.github.io/qc-polisci-pathways/), where students can filter by type, year and pay. Update both together: rebuild these files whenever you change the main site.
11. **Ask the department to link it.** For example, a "Grad & Law School" item in the Political Science menu, and a line under Student Resources.

## Keeping it current

- The **Upcoming deadlines** tables (on the two overview pages) don't update themselves. Delete rows once their dates pass, and add new ones as programs post dates.
- You can edit any page directly in the WordPress editor.
- If you change the main site (`index.html` or `data.js`), you can rebuild these files instead of editing by hand:
  ```bash
  python tools/build_commons.py --site https://maljahmi.github.io/qc-polisci-pathways/
  ```
  Paste the new code over the old in each page's Code editor. Edits made directly in WordPress would be overwritten, so pick one place to edit.
- To change the sample résumés, edit the `.sheet` blocks in `index.html` and run `python tools/build_docx.py`. Then open each `.docx` in Word and use File → Save As → PDF.
