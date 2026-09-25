"""Convert index.html + data.js into WordPress block markup for a CUNY Academic Commons site.

The site is organized by degree, so the Commons version gets one page per tab:
  home.html
  grad-school.html (overview), grad-phd.html, grad-mpp.html, grad-mpa.html, grad-ma.html, grad-guides.html
  law-school.html (overview),  law-jd.html, law-guides.html
  preview.html   every page in one plain file, for review before pasting
The Commons blocks scripts, so each degree page lists its opportunities grouped by type and
sorted by next deadline instead of the site's filters. Standard library only.

Usage:  python tools/build_commons.py [--site https://USERNAME.github.io/REPO/]
With --site, each degree page gets a "Filter and sort these programs" button that opens the
interactive version at that address.
"""
import datetime
import html
import json
import os
import re
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'commons')
TODAY = datetime.date.today()
VOID = {'br', 'img', 'meta', 'link', 'hr', 'input', 'source'}

# tab id -> WordPress page slug
SLUGS = {'g-phd': 'grad-phd', 'g-mpp': 'grad-mpp', 'g-mpa': 'grad-mpa', 'g-ma': 'grad-ma', 'g-guides': 'grad-guides',
         'l-jd': 'law-jd', 'l-guides': 'law-guides'}
OVERVIEW = {'grad': 'grad-school', 'law': 'law-school'}
DEGREE_PAGE = {'phd': 'grad-phd', 'mpp': 'grad-mpp', 'mpa': 'grad-mpa', 'ma': 'grad-ma', 'jd': 'law-jd'}
TYPES = [
    ('summer-research', 'Summer research or institutes'), ('summer-internship', 'Summer internships'),
    ('fall-internship', 'Fall internships'), ('spring-internship', 'Spring internships'),
    ('fellowship', 'Fellowships and scholarships'), ('campus', 'At QC and CUNY'),
    ('visit', 'PhD visit and prep programs'), ('pipeline', 'Pre-law programs'),
    ('course', 'Courses and training'), ('after', 'After college'),
]
YEAR_WORD = {'fr': 'freshmen', 'so': 'sophomores', 'jr': 'juniors', 'sr': 'seniors'}
ID_PAGE = {}     # element id -> slug of the page it ends up on
SITE = ''        # the interactive site's address, from --site; adds "Filter and sort" buttons
PROGRAMS, ALIASES, BY_ID = [], {}, {}


# ---------------- tiny DOM ----------------
class Node:
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs or {}), parent, []

    @property
    def cls(self):
        return self.attrs.get('class', '').split()

    def els(self):
        return [c for c in self.children if isinstance(c, Node)]

    def find_all(self, pred):
        out = []
        for c in self.els():
            if pred(c):
                out.append(c)
            out.extend(c.find_all(pred))
        return out

    def find(self, pred):
        r = self.find_all(pred)
        return r[0] if r else None

    def text(self):
        return ''.join(c if isinstance(c, str) else c.text() for c in self.children)


class DomBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('root')
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur)
        self.cur.children.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def parse(src):
    b = DomBuilder()
    b.feed(src)
    return b.root


def has(cls):
    return lambda n: cls in n.cls


# ---------------- links ----------------
def program_page(p, page):
    """The page a program link should go to: this page if it lists the program, else its first degree page."""
    for d in p['degrees']:
        if DEGREE_PAGE[d] == page:
            return page
    return DEGREE_PAGE[p['degrees'][0]]


def resolve(target, page):
    pid = ALIASES.get(target, target)
    if pid in BY_ID:
        tp = program_page(BY_ID[pid], page)
        return f'#{pid}' if tp == page else f'../{tp}/#{pid}'
    tp = ID_PAGE.get(target, page)
    if tp == page:
        return f'#{target}'
    return f'../{tp}/' + ('' if target in SLUGS else f'#{target}')


def link_href(href, page):
    return resolve(href[1:], page) if href.startswith('#') else href


def rich(fragment, page):
    """Rewrite in-page links inside an HTML fragment stored in data.js."""
    return re.sub(r'href="(#[^"]+)"', lambda m: f'href="{html.escape(link_href(m.group(1), page))}"', fragment)


def inline(node, page):
    """Serialize a node's children as clean inline HTML (links, bold, italics, line breaks)."""
    out = []
    for c in node.children:
        if isinstance(c, str):
            out.append(html.escape(re.sub(r'\s+', ' ', c), quote=False))
            continue
        t = c.tag
        inner = inline(c, page)
        if t == 'a':
            out.append(f'<a href="{html.escape(link_href(c.attrs.get("href", ""), page))}">{inner}</a>')
        elif t in ('b', 'strong', 'mark'):
            out.append(f'<strong>{inner}</strong>' if inner.strip() else inner)
        elif t in ('em', 'i'):
            out.append(f'<em>{inner}</em>')
        elif t == 'br':
            out.append('<br>')
        else:
            out.append(inner)
    return re.sub(r'\s+', ' ', ''.join(out)).strip()


def plain(node):
    return re.sub(r'\s+', ' ', node.text()).strip()


# ---------------- blocks ----------------
def b_heading(content, level=2, anchor=None):
    attrs = '' if level == 2 else ' ' + json.dumps({'level': level})
    idattr = f' id="{anchor}"' if anchor else ''
    return f'<!-- wp:heading{attrs} -->\n<h{level} class="wp-block-heading"{idattr}>{content}</h{level}>\n<!-- /wp:heading -->'


def b_para(content):
    return f'<!-- wp:paragraph -->\n<p>{content}</p>\n<!-- /wp:paragraph -->'


def b_list(items, ordered=False):
    attrs = ' {"ordered":true}' if ordered else ''
    tag = 'ol' if ordered else 'ul'
    lis = ''.join(f'<!-- wp:list-item -->\n<li>{i}</li>\n<!-- /wp:list-item -->' for i in items)
    return f'<!-- wp:list{attrs} -->\n<{tag} class="wp-block-list">{lis}</{tag}>\n<!-- /wp:list -->'


def b_table(head, rows):
    th = ''.join(f'<th>{h}</th>' for h in head)
    body = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    thead = f'<thead><tr>{th}</tr></thead>' if head else ''
    return ('<!-- wp:table {"hasFixedLayout":false} -->\n'
            f'<figure class="wp-block-table"><table>{thead}<tbody>{body}</tbody></table></figure>\n'
            '<!-- /wp:table -->')


def b_buttons(buttons):
    inner = ''.join(
        f'<!-- wp:button -->\n<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="{html.escape(h)}">{t}</a></div>\n<!-- /wp:button -->'
        for t, h in buttons)
    return f'<!-- wp:buttons -->\n<div class="wp-block-buttons">{inner}</div>\n<!-- /wp:buttons -->'


def b_separator():
    return '<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->'


# ---------------- page content ----------------
def facts_items(dl, page):
    items, dt = [], None
    for c in dl.els():
        if c.tag == 'dt':
            dt = plain(c)
        elif c.tag == 'dd' and dt:
            items.append(f'<strong>{html.escape(dt)}:</strong> {inline(c, page)}')
    return items


def when_text(b, s):
    parts = [x for x in (b, s) if x]
    # "Nov 15" + "2026 · visit Jan 28–31" reads better as "Nov 15, 2026 · visit Jan 28–31"
    if len(parts) > 1 and re.match(r'[0-9]{4}(?![0-9])', parts[1]):
        parts[0] = parts[0] + ', ' + parts[1][:4]
        parts[1] = parts[1][4:].lstrip(' ·')
        parts = [p for p in parts if p]
    return ' · '.join(parts)


def static_row(row, level, page, label):
    """A program row still written in index.html (PhDs beyond political science, methods resources)."""
    out = []
    what = row.find(has('what'))
    h = what.find(lambda n: n.tag in ('h3', 'h4'))
    out.append(b_heading(inline(h, page), level, row.attrs.get('id')))
    lines = []
    w = row.find(has('when'))
    if w:
        b = w.find(lambda n: n.tag == 'b')
        s = w.find(lambda n: n.tag == 'span')
        label = w.attrs.get('data-label', 'When')
        lines.append(f'<strong>{html.escape(label)}:</strong> ' + html.escape(when_text(plain(b) if b else '', plain(s) if s else '')))
    meta = what.find(has('meta'))
    if meta:
        lines.append(f'<em>{inline(meta, page)}</em>')
    if lines:
        out.append(b_para('<br>'.join(lines)))
    for p in what.find_all(lambda n: n.tag == 'p' and 'body' in n.cls):
        out.append(b_para(inline(p, page)))
    dl = row.find(has('facts'))
    if dl:
        out.append(b_list(facts_items(dl, page)))
    return out


def sched_table(s, page):
    heads = s.find_all(has('yh'))
    labels = []
    for yh in heads:
        small = yh.find(lambda n: n.tag == 'small')
        name = html.escape(''.join(c for c in yh.children if isinstance(c, str)).strip())
        labels.append(name + (f' <em>({html.escape(plain(small).lower())})</em>' if small else ''))
    cells = [c for c in s.els() if 'data-s' in c.attrs]
    n = len(heads)
    rows = []
    for i, season in enumerate(['Fall', 'Spring', 'Summer']):
        row_cells = cells[i * n:(i + 1) * n]
        if row_cells:
            rows.append([f'<strong>{season}</strong>'] + [inline(c, page) for c in row_cells])
    return b_table([''] + labels, rows)


def next_of(md):
    if not md:
        return datetime.date.max
    m, d = int(md[:2]), int(md[3:])
    x = datetime.date(TODAY.year, m, d)
    return x if x >= TODAY else datetime.date(TODAY.year + 1, m, d)


def due_key(p):
    if p['due']:
        d = datetime.date(*map(int, p['due'].split('-')))
        if d >= TODAY:
            return d
    return next_of(p['dueMD'])


def years_label(ys):
    ug = [y for y in ('fr', 'so', 'jr', 'sr') if y in ys]
    words = ['all years'] if len(ug) == 4 else [YEAR_WORD[y] for y in ug]
    if 'grad' in ys:
        words.append('recent grads' if ug else 'after college')
    s = ', '.join(words[:-1]) + ' and ' + words[-1] if len(words) > 1 else (words[0] if words else '')
    return s[:1].upper() + s[1:]


def program_blocks(p, page):
    out = [b_heading(rich(p['name'], page), 4, p['id'])]
    lines = []
    if p['whenB']:
        label = 'Deadline' if p['status'] in ('confirmed', 'estimate', 'last') else 'When'
        lines.append(f'<strong>{label}:</strong> {html.escape(when_text(p["whenB"], p["whenS"]))}')
    if p.get('opens'):
        lines.append(f'<strong>Opens:</strong> {html.escape(p["opens"])}')
    lines.append(f'<em>{years_label(p["years"])}' + (f' · {rich(p["meta"], page)}' if p['meta'] else '') + '</em>')
    out.append(b_para('<br>'.join(lines)))
    if p['body']:
        out.append(b_para(rich(p['body'], page)))
    if p['warn']:
        out.append(b_para('<strong>Note:</strong> ' + rich(p['warn'], page)))
    if p['facts']:
        out.append(b_list([f'<strong>{html.escape(a)}:</strong> {rich(b, page)}' for a, b in p['facts']]))
    return out


def db_blocks(degree, page):
    """The opportunities list, grouped by each program's first type and sorted by next deadline."""
    progs = [p for p in PROGRAMS if degree in p['degrees']]
    out = [b_para("Sorted by next deadline. Dates are this cycle's where posted; otherwise they are last cycle's, which are usually close. Confirm on the official page.")]
    for key, label in TYPES:
        group = sorted((p for p in progs if p['types'][0] == key), key=lambda p: (due_key(p), re.sub('<[^>]+>', '', p['name'])))
        if not group:
            continue
        out.append(b_heading(label, 3))
        for p in group:
            out.extend(program_blocks(p, page))
    return out


def section_blocks(sec, page, downloads):
    sid = sec.attrs['id']
    out = []
    h2 = sec.find(lambda n: n.tag == 'h2')
    out.append(b_heading(inline(h2, page), 2, sid))
    if 'db' in sec.cls:
        lead = sec.find(lambda n: n.tag == 'p' and 'lead' in n.cls)
        if lead:
            out.append(b_para(inline(lead, page)))
        if SITE:
            out.append(b_buttons([('Filter and sort these programs', SITE + '#' + sid)]))
        out.extend(db_blocks(sec.attrs['data-degree'], page))
        return out
    level = [3]  # program heading level; becomes 4 after a group subhead

    def walk(nodes):
        for n in nodes:
            if not isinstance(n, Node):
                continue
            c = n.cls
            if 'sh' in c:
                continue
            if n.tag == 'p':
                out.append(b_para(inline(n, page)))
            elif n.tag == 'dl' and 'facts' in c:
                out.append(b_list(facts_items(n, page)))
            elif 'kick' in c:
                out.append(b_heading(inline(n, page), 3))
                level[0] = 4
            elif 'ledger' in c:
                for r in n.els():
                    if 'row' in r.cls:
                        out.extend(static_row(r, level[0], page, 'When'))
            elif 'split' in c or 'aside' in c or (n.tag == 'div' and not c):
                walk(n.children)
            elif 'cols' in c:
                items = []
                for d in n.els():
                    b = d.find(lambda x: x.tag == 'b')
                    title = inline(b, page) if b else ''
                    rest = Node('div')
                    rest.children = [x for x in d.children if x is not b]
                    items.append(f'<strong>{title}.</strong> {inline(rest, page)}' if title else inline(d, page))
                out.append(b_list(items))
            elif n.tag == 'ul' and 'rules' in c:
                out.append(b_list([inline(li, page) for li in n.els()]))
            elif n.tag == 'ol' and 'steps' in c:
                items = []
                for li in n.els():
                    d = li.els()[0] if li.els() else li
                    b = d.find(lambda x: x.tag == 'b')
                    rest = Node('div')
                    rest.children = [x for x in d.children if x is not b]
                    items.append(f'<strong>{inline(b, page)}.</strong> {inline(rest, page)}' if b else inline(d, page))
                out.append(b_list(items, ordered=True))
            elif 'pull' in c:
                b = n.find(lambda x: x.tag == 'b')
                p = n.find(lambda x: x.tag == 'p')
                out.append(b_para(f'<strong>{inline(b, page)}</strong> {inline(p, page)}'))
            elif 'stats' in c:
                vs = [x for x in n.els() if 'v' in x.cls]
                ps = [x for x in n.els() if x.tag == 'p']
                out.append(b_list([f'<strong>{plain(v)}</strong> {inline(p, page)}' for v, p in zip(vs, ps)]))
            elif 'tbl' in c:
                t = n.find(lambda x: x.tag == 'table')
                head = [inline(th, page) for th in t.find_all(lambda x: x.tag == 'th' and x.parent.parent.tag == 'thead')]
                rows = [[inline(td, page) for td in tr.els()] for tr in t.find_all(lambda x: x.tag == 'tr' and x.parent.tag == 'tbody')]
                # the LSAT table's last column is a live countdown; drop empty columns
                if rows and all(not r[-1] for r in rows):
                    rows = [r[:-1] for r in rows]
                    head = head[:-1] if head else head
                out.append(b_table(head, rows))
            elif 'bento' in c:
                for cell in n.els():
                    h = cell.find(lambda x: x.tag in ('h3', 'h4'))
                    out.append(b_heading(inline(h, page), 3))
                    meta = cell.find(has('meta'))
                    if meta:
                        out.append(b_para(f'<em>{inline(meta, page)}</em>'))
                    for p in cell.find_all(lambda x: x.tag == 'p'):
                        out.append(b_para(inline(p, page)))
                    dl = cell.find(has('facts'))
                    if dl:
                        out.append(b_list(facts_items(dl, page)))
            elif 'talk' in c:
                h3 = n.find(lambda x: x.tag == 'h3')
                out.append(b_heading(inline(h3, page), 3))
                first = n.els()[0]
                for p in [x for x in first.els() if x.tag == 'p']:
                    out.append(b_para(inline(p, page)))
                ul = first.find(lambda x: x.tag == 'ul')
                out.append(b_list([inline(li, page) for li in ul.els()]))
                mail = n.find(has('mail'))
                out.append(b_heading('Sample email', 4))
                for p in [x for x in mail.els() if x.tag == 'p']:
                    out.append(b_para(inline(p, page)))
            elif 'sched' in c:
                out.append(sched_table(n, page))
            elif 'soon' in c:
                b = n.find(lambda x: x.tag == 'b')
                p = n.find(lambda x: x.tag == 'p')
                out.append(b_para(f'<strong>{inline(b, page)}.</strong> {inline(p, page)}'))
            elif 'desk' in c:
                out.append(b_heading('Download the samples', 3))
                out.append(b_para('Open the Word file to edit it, or the PDF to print. Replace everything with your own details.'))
                out.append(b_buttons(downloads))
                for x in [x for x in n.els() if 'stage' not in x.cls]:
                    for aside in x.find_all(has('aside')):
                        h = aside.find(lambda y: y.tag in ('h3', 'h4'))
                        if plain(h).startswith('Download'):
                            continue  # the Commons page uses its own download buttons
                        out.append(b_heading(inline(h, page), 3))
                        t = aside.find(lambda y: y.tag == 'table')
                        if t:
                            rows = [[inline(td, page) for td in tr.els()] for tr in t.find_all(lambda y: y.tag == 'tr')]
                            out.append(b_table([], rows))
                        ul = aside.find(lambda y: y.tag == 'ul')
                        if ul:
                            out.append(b_list([inline(li, page) for li in ul.els()]))
            elif n.tag in ('h3', 'h4'):
                out.append(b_heading(inline(n, page), 3))
            else:
                walk(n.children)

    walk(sec.children)
    return out


def board_rows(track):
    src = open(os.path.join(ROOT, 'app.js'), encoding='utf-8').read()
    extra = re.findall(r'\{d:"([^"]+)", n:"([^"]+)", t:"([^"]+)",(?: g:"[^"]+",)? u:([^}]+)\}', src)
    lsat = re.search(r'var LSAT = "([^"]+)"', src).group(1)
    degs = ['jd'] if track == 'law' else ['phd', 'mpp', 'mpa', 'ma']
    rows = []
    for p in PROGRAMS:
        if not p['due'] or p.get('event') or p['status'] not in ('confirmed', 'estimate') or not set(degs) & set(p['degrees']):
            continue
        name = p.get('short') or re.sub(r'\s*\([^)]*\)\s*$', '', re.sub('<[^>]+>', '', p['name']))
        rows.append((p['due'], name, p['url'], p['status'] == 'estimate'))
    for d, n, t, u in extra:
        if t == track:
            u = u.strip()
            rows.append((d, n, lsat if u == 'LSAT' else u.strip('"'), False))
    out = []
    for d, n, u, est in sorted(rows):
        dt = datetime.date(*map(int, d.split('-')))
        if dt < TODAY:
            continue
        out.append([('~' if est else '') + f'{dt.strftime("%b")} {dt.day}, {dt.year}', f'<a href="{html.escape(u)}">{html.escape(n)}</a>'])
    return out


FOOTER = [
    b_para('Made by Mohamed Aljahmi for Queens College political science majors. Student-made guide, not an official Queens College or CUNY publication.'),
    b_para('Every program name links to the official page it was checked against in September 2026. "Last cycle" means only last year\'s date was posted; "~" and "est." mark dates estimated from the usual pattern. Always confirm before you apply.'),
]


def tab_nav(track, panels, current):
    parts = [f'<a href="../{OVERVIEW[track]}/">Overview</a>' if current is not None else '<strong>Overview</strong>']
    for p in panels:
        label = html.escape(p.attrs['data-label'])
        parts.append(f'<strong>{label}</strong>' if p is current else f'<a href="../{SLUGS[p.attrs["id"]]}/">{label}</a>')
    return b_para(' · '.join(parts))


def overview_page(track, main, panels):
    slug = OVERVIEW[track]
    intro = main.find(has('intro'))
    out = [tab_nav(track, panels, None)]
    out.append(b_heading(inline(intro.find(lambda n: n.tag == 'h2'), slug), 2))
    out.append(b_para(inline(intro.find(lambda n: n.tag == 'p'), slug)))
    cards = intro.find(has('degrees'))
    out.append(b_list([f'<a href="../{SLUGS[a.attrs["href"][1:]]}/"><strong>{plain(a.find(lambda n: n.tag == "b"))}</strong></a>: {html.escape(plain(a.find(lambda n: n.tag == "span")))}' for a in cards.els()]))
    out.append(b_heading('Upcoming deadlines', 2, 'deadlines'))
    out.append(b_para(f'As of {TODAY.strftime("%B")} {TODAY.day}, {TODAY.year}. "~" marks an estimate. Confirm each date on the program\'s page before you apply.'))
    out.append(b_table(['Date', 'Deadline'], board_rows(track)))
    if SITE:
        out.append(b_para('The interactive version has live countdowns and lets you filter every program by type, year and pay.'))
        out.append(b_buttons([('Open the interactive version', SITE + '#' + track)]))
    other = 'law' if track == 'grad' else 'grad'
    out.append(b_buttons([(f'Switch to the {"law" if other == "law" else "grad"} school path', f'../{OVERVIEW[other]}/')]))
    out.append(b_separator())
    out.extend(FOOTER)
    return out


def tab_page(track, panels, panel, downloads):
    slug = SLUGS[panel.attrs['id']]
    out = [tab_nav(track, panels, panel)]
    for i, s in enumerate(x for x in panel.els() if x.tag == 'section'):
        if i:
            out.append(b_separator())
        out.extend(section_blocks(s, slug, downloads))
    out.append(b_separator())
    out.extend(FOOTER)
    return out


def main():
    global SITE
    import sys
    if '--site' in sys.argv:
        SITE = sys.argv[sys.argv.index('--site') + 1].rstrip('/') + '/'
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    data = open(os.path.join(ROOT, 'data.js'), encoding='utf-8').read()
    a = data.index('window.PROGRAMS = ') + len('window.PROGRAMS = ')
    PROGRAMS.extend(json.loads(data[a:data.index('];', a) + 1]))
    b = data.index('window.ALIASES = ') + len('window.ALIASES = ')
    ALIASES.update(json.loads(data[b:data.index(';', b)]))
    BY_ID.update({p['id']: p for p in PROGRAMS})

    dom = parse(src)
    mains = {t: dom.find(lambda n, t=t: n.tag == 'main' and n.attrs.get('id') == t) for t in ('grad', 'law')}
    panels = {t: [p for p in m.els() if 'panel' in p.cls] for t, m in mains.items()}
    for t, ps in panels.items():
        for p in ps:
            slug = SLUGS[p.attrs['id']]
            ID_PAGE[p.attrs['id']] = slug
            for el in p.find_all(lambda n: 'id' in n.attrs):
                ID_PAGE[el.attrs['id']] = slug
    os.makedirs(OUT, exist_ok=True)

    # with --site, link the copies in the interactive site's downloads/ folder;
    # otherwise leave placeholders to swap for Media Library URLs after uploading
    up = SITE + 'downloads/' if SITE else '#upload-'
    downloads = {
        'grad': [('Résumé (Word)', up + 'Sample_Resume_Alex_Rivera.docx'), ('Résumé (PDF)', up + 'Sample_Resume_Alex_Rivera.pdf'),
                 ('Academic CV (Word)', up + 'Sample_CV_Alex_Rivera.docx'), ('Academic CV (PDF)', up + 'Sample_CV_Alex_Rivera.pdf')],
        'law': [('Law résumé (Word)', up + 'Sample_Law_Resume_Jordan_Lee.docx'), ('Law résumé (PDF)', up + 'Sample_Law_Resume_Jordan_Lee.pdf')],
    }
    pages = {'home': [
        b_para('A student-made guide for Queens College political science majors headed to graduate school or law school. It covers paid research programs, internships, fellowships, deadlines and sample résumés, with every program linked to its official page.'),
        b_buttons([('Grad school (PhD, MPP, MPA, MA)', 'grad-school/'), ('Law school (JD)', 'law-school/')]
                  + ([('Interactive version with filters', SITE)] if SITE else [])),
        b_heading('How it works', 2),
        b_para('Pick your path, then a degree. Each degree page explains the degree, gives a timeline for each year of college, and lists the programs that prepare you for it, sorted by next deadline. The Guides pages cover professors, methods, applying and résumés.'),
        b_heading('Three ground rules', 2),
        b_list(['<strong>Good programs pay you.</strong> Almost everything here is free and comes with a stipend, housing, or both.',
                '<strong>Deadlines move every year.</strong> Confirm on the official page before you plan around a date.',
                '<strong>Ask for help.</strong> Professors, QC Pre-Law Advising and the Office of Honors and Scholarships are here to help you apply.']),
        b_separator(),
    ] + FOOTER}
    titles = {'home': 'Home'}
    for t in ('grad', 'law'):
        pages[OVERVIEW[t]] = overview_page(t, mains[t], panels[t])
        titles[OVERVIEW[t]] = 'Grad school' if t == 'grad' else 'Law school'
        for p in panels[t]:
            slug = SLUGS[p.attrs['id']]
            pages[slug] = tab_page(t, panels[t], p, downloads[t])
            titles[slug] = ('Grad school: ' if t == 'grad' else 'Law school: ') + p.attrs['data-label']

    for old in os.listdir(OUT):
        if old.endswith('.html'):
            os.remove(os.path.join(OUT, old))
    for name, blocks in pages.items():
        with open(os.path.join(OUT, name + '.html'), 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(blocks) + '\n')
        print(f'{name:14} {len(blocks):4} blocks   page title: {titles[name]}')

    css = """body{font:16px/1.6 Georgia,serif;max-width:760px;margin:40px auto;padding:0 16px;color:#111}
    h1{font-size:2rem;border-bottom:4px solid #E71939;padding-bottom:6px}h2{margin-top:2em}a{color:#C8102E}
    table{border-collapse:collapse;width:100%;font-size:.9rem}td,th{border:1px solid #ddd;padding:6px;vertical-align:top;text-align:left}
    .wp-block-buttons{display:flex;gap:8px;flex-wrap:wrap}.wp-block-button__link{display:inline-block;background:#E71939;color:#fff;padding:8px 14px;text-decoration:none;border-radius:2px}
    hr{border:0;border-top:1px solid #ccc;margin:2em 0}.page{border:1px dashed #bbb;padding:0 20px 20px;margin-bottom:40px}"""
    parts = [f'<section class="page"><h1>{html.escape(titles[k])} <small>/{k}/</small></h1>' + '\n'.join(v) + '</section>' for k, v in pages.items()]
    with open(os.path.join(OUT, 'preview.html'), 'w', encoding='utf-8') as f:
        f.write(f'<!doctype html><html lang="en"><meta charset="utf-8"><title>Commons preview</title><style>{css}</style><body>' + ''.join(parts) + '</body></html>')


if __name__ == '__main__':
    main()
