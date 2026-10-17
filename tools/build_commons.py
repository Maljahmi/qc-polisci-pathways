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
SLUGS = {'g-phd': 'grad-phd', 'g-predoc': 'grad-predoc', 'g-mpp': 'grad-mpp', 'g-mpa': 'grad-mpa', 'g-ma': 'grad-ma', 'g-guides': 'grad-guides',
         'l-jd': 'law-jd', 'l-guides': 'law-guides'}
OVERVIEW = {'grad': 'grad-school', 'law': 'law-school'}
DEGREE_PAGE = {'phd': 'grad-phd', 'predoc': 'grad-predoc', 'mpp': 'grad-mpp', 'mpa': 'grad-mpa', 'ma': 'grad-ma', 'jd': 'law-jd'}
# The Commons keeps one page per degree, assembled from the interactive site's sections
# ("db:phd" is that degree's opportunities list).
PAGES = {
    'grad': [('g-phd', 'PhD', ['g-phd-about', 'g-phd-fields', 'g-timeline', 'db:phd']),
             ('g-predoc', 'Predoc', ['g-predoc-about', 'g-predoc-reqs', 'g-predoc-timeline', 'g-predoc-writing', 'db:predoc']),
             ('g-mpp', 'MPP', ['g-mpp-about', 'g-mpp-timeline', 'db:mpp']),
             ('g-mpa', 'MPA', ['g-mpa-about', 'g-mpa-timeline', 'db:mpa']),
             ('g-ma', 'MA', ['g-ma-about', 'g-ma-timeline', 'db:ma']),
             ('g-guides', 'Guides', ['g-start', 'g-social', 'g-pair', 'g-methods', 'g-rbsi', 'g-help', 'g-apply',
                                     'g-letters', 'g-visit', 'g-samples', 'g-jobs', 'g-funding', 'g-fields', 'g-search', 'g-ai', 'g-network'])],
    'law': [('l-jd', 'JD', ['l-path', 'l-timeline', 'db:jd']),
            ('l-guides', 'Guides', ['l-start', 'l-fields', 'l-qc', 'l-research', 'l-lsat', 'l-gap', 'l-sample'])],
}
# the anchor each degree's list gets (these are also the old interactive-site ids, which still work there)
DB_ID = {'phd': 'g-phd-db', 'predoc': 'g-predoc-db', 'mpp': 'g-mpp-db', 'mpa': 'g-mpa-db', 'ma': 'g-ma-db', 'jd': 'l-jd-db'}
DB_LEAD = {}     # degree -> the list's intro, from the interactive site's hints
# ids that name a whole view or tab on the interactive site: link to the matching Commons page
PAGE_IDS = {'home': '', 'grad': 'grad-school', 'law': 'law-school', 'g-degrees': 'grad-school', 'g-years': 'grad-phd',
            'g-opps': 'grad-phd', 'g-opps-db': 'grad-phd', 'l-years': 'law-jd', 'l-opps': 'law-jd', 'l-opps-db': 'law-jd',
            'g-ready': 'grad-guides', 'g-applying': 'grad-guides', 'g-money': 'grad-guides',
            'l-ready': 'law-guides', 'l-applying': 'law-guides'}
TYPES = [
    ('summer-research', 'Summer research or institutes'), ('summer-internship', 'Summer internships'),
    ('fall-internship', 'Fall internships'), ('spring-internship', 'Spring internships'),
    ('fellowship', 'Fellowships and scholarships'), ('campus', 'At QC and CUNY'),
    ('visit', 'PhD visit and prep programs'), ('pipeline', 'Pre-law programs'),
    ('course', 'Courses and training'), ('after', 'After college'), ('journalism', 'Journalism'),
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
    if target in PAGE_IDS:
        tp = PAGE_IDS[target]
        return '#' if tp == page else f'../{tp}/' if tp else '../'
    tp = ID_PAGE.get(target, page)
    if tp == page:
        return f'#{target}'
    return f'../{tp}/' + ('' if target in SLUGS else f'#{target}')


def link_href(href, page):
    if href == '#about':  # the About section exists only on the interactive site
        return SITE + '#about' if SITE else '#'
    if href in ('#opportunities', '#all-db'):  # so does the All opportunities page
        return SITE + '#opportunities' if SITE else '../grad-school/'
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
            href = link_href(c.attrs.get("href", ""), page)
            if c.attrs.get('data-type') == 'journalism':  # journalism programs are listed on the MPP page, not the PhD one
                href = '#' if page == 'grad-mpp' else '../grad-mpp/'
            out.append(f'<a href="{html.escape(href)}">{inner}</a>')
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


def lead_in(title):
    """A bold lead-in. Adds a period unless the title already ends in punctuation."""
    end = re.sub(r'<[^>]+>', '', title).rstrip()[-1:]
    return f'<strong>{title}</strong>' if end in '.?!:' else f'<strong>{title}.</strong>'


# ---------------- blocks ----------------
def b_heading(content, level=2, anchor=None):
    attrs = '' if level == 2 else ' ' + json.dumps({'level': level})
    idattr = f' id="{anchor}"' if anchor else ''
    return f'<!-- wp:heading{attrs} -->\n<h{level} class="wp-block-heading"{idattr}>{content}</h{level}>\n<!-- /wp:heading -->'


def b_para(content, cls=None):
    if cls:
        return f'<!-- wp:paragraph {{"className":"{cls}"}} -->\n<p class="{cls}">{content}</p>\n<!-- /wp:paragraph -->'
    return f'<!-- wp:paragraph -->\n<p>{content}</p>\n<!-- /wp:paragraph -->'


def b_list(items, ordered=False, cls=None):
    attrs = {k: v for k, v in (('ordered', ordered or None), ('className', cls)) if v}
    attrs = ' ' + json.dumps(attrs, separators=(',', ':')) if attrs else ''
    tag = 'ol' if ordered else 'ul'
    lis = ''.join(f'<!-- wp:list-item -->\n<li>{i}</li>\n<!-- /wp:list-item -->' for i in items)
    return f'<!-- wp:list{attrs} -->\n<{tag} class="wp-block-list{" " + cls if cls else ""}">{lis}</{tag}>\n<!-- /wp:list -->'


def b_group(blocks, cls):
    """A Group block. The layout comes from site.css, keyed on the class names (pp-...)."""
    inner = '\n'.join(blocks)
    return f'<!-- wp:group {{"className":"{cls}"}} -->\n<div class="wp-block-group {cls}">{inner}</div>\n<!-- /wp:group -->'


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
def fact_label(text):
    """A fact label with a colon, unless it already ends in punctuation."""
    return text if text.endswith(('?', ':')) else text + ':'


def facts_items(dl, page):
    items, dt = [], None
    for c in dl.els():
        if c.tag == 'dt':
            dt = plain(c)
        elif c.tag == 'dd' and dt:
            items.append(f'<strong>{html.escape(fact_label(dt))}</strong> {inline(c, page)}')
    return items


def when_text(b, s):
    parts = [x for x in (b, s) if x]
    # "Nov 15" + "2026 · visit Jan 28–31" reads better as "Nov 15, 2026 · visit Jan 28–31"
    if len(parts) > 1 and re.match(r'[0-9]{4}(?![0-9])', parts[1]):
        parts[0] = parts[0] + ', ' + parts[1][:4]
        parts[1] = parts[1][4:].lstrip(' ·')
        parts = [p for p in parts if p]
    return ' · '.join(parts)


def prog_row(head, body):
    """A ledger row: name, date and who it's for on the left; description and facts on the right."""
    parts = [b_group(head, 'pp-prog-head')] + ([b_group(body, 'pp-prog-body')] if body else [])
    return b_group(parts, 'pp-prog')


def static_row(row, level, page, label):
    """A program row still written in index.html (PhDs beyond political science, methods resources)."""
    what = row.find(has('what'))
    h = what.find(lambda n: n.tag in ('h3', 'h4'))
    head, body = [b_heading(inline(h, page), level, row.attrs.get('id'))], []
    w = row.find(has('when'))
    if w:
        b = w.find(lambda n: n.tag == 'b')
        s = w.find(lambda n: n.tag == 'span')
        label = w.attrs.get('data-label', 'When')
        head.append(b_para(f'<strong>{html.escape(label)}:</strong> ' + html.escape(when_text(plain(b) if b else '', plain(s) if s else '')), 'pp-when'))
    meta = what.find(has('meta'))
    if meta:
        head.append(b_para(inline(meta, page), 'pp-meta'))
    for p in what.find_all(lambda n: n.tag == 'p' and 'body' in n.cls):
        body.append(b_para(inline(p, page)))
    dl = row.find(has('facts'))
    if dl:
        body.append(b_list(facts_items(dl, page)))
    return [prog_row(head, body)]


def plan_table(ol, page):
    """A year-by-year plan as a table: one row per year, one column per season."""
    rows = []
    for yr in [x for x in ol.els() if x.tag == 'li']:
        head = yr.find(has('plan-head'))
        first = f'<strong>{html.escape(plain(head.find(lambda n: n.tag == "h3")))}</strong>'
        for extra in (head.find(lambda n: n.tag == 'p'), head.find(has('plan-tag'))):
            if extra:
                first += f'<br><em>{html.escape(plain(extra))}</em>'
        cells = ['<br>'.join(inline(li, page) for li in t.find(lambda n: n.tag == 'ul').els())
                 for t in yr.els() if 'term' in t.cls]
        rows.append([first] + cells)
    return b_table(['', 'Fall', 'Spring', 'Summer'], rows)


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
    head, body, when = [b_heading(rich(p['name'], page), 4, p['id'])], [], []
    if p['whenB']:
        dated = p['status'] in ('confirmed', 'estimate', 'last') and not p.get('event')
        label = 'Deadline' if dated else 'When'
        when.append(f'<strong>{label}:</strong> {html.escape(when_text(p["whenB"], p["whenS"]))}')
    if p.get('opens'):
        when.append(f'<strong>Opens:</strong> {html.escape(p["opens"])}')
    if when:
        head.append(b_para('<br>'.join(when), 'pp-when'))
    head.append(b_para(years_label(p['years']) + (f' · {rich(p["meta"], page)}' if p['meta'] else ''), 'pp-meta'))
    if p['body']:
        body.append(b_para(rich(p['body'], page)))
    if p['warn']:
        body.append(b_para('<strong>Note:</strong> ' + rich(p['warn'], page)))
    if p['facts']:
        body.append(b_list([f'<strong>{html.escape(fact_label(a))}</strong> {rich(b, page)}' for a, b in p['facts']]))
    return [prog_row(head, body)]


def db_blocks(degree, page, sid):
    """The opportunities list, grouped by each program's first type and sorted by next deadline.
    Also returns (anchor, label, count) for each group, for the page's side menu."""
    progs = [p for p in PROGRAMS if degree in p['degrees']]
    out = [b_para("Sorted by next deadline. Dates are this cycle's where posted; otherwise they are last cycle's, which are usually close. Confirm on the official page.")]
    subs = []
    for key, label in TYPES:
        group = sorted((p for p in progs if p['types'][0] == key), key=lambda p: (due_key(p), re.sub('<[^>]+>', '', p['name'])))
        if not group:
            continue
        anchor = f'{sid}-{key}'
        out.append(b_heading(label, 3, anchor))
        subs.append((anchor, label, len(group)))
        for p in group:
            out.extend(program_blocks(p, page))
    return out, subs


def section_blocks(sec, page, downloads):
    """A section's blocks, plus the sub-links it adds to the side menu."""
    sid = sec.attrs['id']
    out = []
    h2 = sec.find(lambda n: n.tag == 'h2')
    out.append(b_heading(inline(h2, page), 2, sid))
    if 'db' in sec.cls:
        lead = sec.find(lambda n: n.tag == 'p' and 'lead' in n.cls)
        if lead:
            out.append(b_para(inline(lead, page)))
        if SITE:
            out.append(b_para(f'<a href="{SITE}#{sid}">Filter and sort these programs on the interactive site</a>', 'pp-small'))
        blocks, subs = db_blocks(sec.attrs['data-degree'], page, sid)
        return out + blocks, subs
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
                    items.append(f'{lead_in(title)} {inline(rest, page)}' if title else inline(d, page))
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
                    items.append(f'{lead_in(inline(b, page))} {inline(rest, page)}' if b else inline(d, page))
                out.append(b_list(items, ordered=True))
            elif 'pull' in c:
                b = n.find(lambda x: x.tag == 'b')
                p = n.find(lambda x: x.tag == 'p')
                out.append(b_para(f'{lead_in(inline(b, page))} {inline(p, page)}'))
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
            elif 'pairs' in c:
                for cell in n.els():
                    h = cell.find(lambda x: x.tag in ('h3', 'h4'))
                    out.append(b_heading(inline(h, page), 4 if level[0] == 4 else 3))
                    for p in cell.find_all(lambda x: x.tag == 'p'):
                        out.append(b_para(f'<em>{inline(p, page)}</em>' if 'meta' in p.cls else inline(p, page)))
            elif 'talk' in c:
                h3 = n.find(lambda x: x.tag == 'h3')
                out.append(b_heading(inline(h3, page), 3))
                first = n.els()[0]
                for p in [x for x in first.els() if x.tag == 'p']:
                    out.append(b_para(inline(p, page)))
                ul = first.find(lambda x: x.tag == 'ul')
                if ul:
                    out.append(b_list([inline(li, page) for li in ul.els()]))
                mail = n.find(has('mail'))
                mh = mail.find(has('mail-h'))  # "Prompts to try" in Using AI the right way
                out.append(b_heading(plain(mh) if mh else 'Sample email', 4))
                for p in [x for x in mail.els() if x.tag == 'p']:
                    out.append(b_para(inline(p, page)))
            elif 'plan' in c:
                out.append(plan_table(n, page))
            elif 'note-from' in c:
                out.append(b_group([b_para(inline(p, page), 'pp-sig' if 'sig' in p.cls else None) for p in n.els() if p.tag == 'p'], 'pp-note'))
            elif 'soon' in c:
                b = n.find(lambda x: x.tag == 'b')
                p = n.find(lambda x: x.tag == 'p')
                out.append(b_para(f'{lead_in(inline(b, page))} {inline(p, page)}'))
            elif 'desk' in c:
                out.append(b_heading('Download the samples', 3))
                out.append(b_para('Open the Word file to edit it, or the PDF to print. Replace everything with your own details.'))
                out.append(download_list(downloads))
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
    return out, []


def board_data(track):
    """Future deadlines for a path's board: (date, estimate?, name, url), soonest first."""
    src = open(os.path.join(ROOT, 'data.js'), encoding='utf-8').read()
    src = src[src.index('window.EXTRA_DEADLINES'):]
    extra = re.findall(r'\{d:"([^"]+)", n:"([^"]+)", t:"([^"]+)",(?: g:"[^"]+",)? u:([^}]+)\}', src)
    lsat = re.search(r'var LSAT_URL = "([^"]+)"', open(os.path.join(ROOT, 'data.js'), encoding='utf-8').read()).group(1)
    degs = ['jd'] if track == 'law' else ['phd', 'predoc', 'mpp', 'mpa', 'ma']
    rows = []
    for p in PROGRAMS:
        if not p['due'] or p.get('event') or p['status'] not in ('confirmed', 'estimate') or not set(degs) & set(p['degrees']):
            continue
        name = p.get('short') or re.sub(r'\s*\([^)]*\)\s*$', '', re.sub('<[^>]+>', '', p['name']))
        rows.append((p['due'], name, p['url'], p['status'] == 'estimate'))
    for d, n, t, u in extra:
        if t == track:
            u = u.strip()
            rows.append((d, n, lsat if u == 'LSAT_URL' else u.strip('"'), False))
    out = []
    for d, n, u, est in sorted(rows):
        dt = datetime.date(*map(int, d.split('-')))
        if dt >= TODAY:
            out.append((dt, est, n, u))
    return out


def deadline_table(data):
    rows = [[('~' if est else '') + f'{dt.strftime("%b")} {dt.day}', f'<a href="{html.escape(u)}">{html.escape(n)}</a>'] for dt, est, n, u in data]
    return b_table(['Date', 'Deadline'], rows)


FOOTER = [
    b_para('Made by Mohamed Aljahmi for Queens College political science majors. Student-made guide, not an official Queens College or CUNY publication.'),
    b_para('Every program name links to the official page it was checked against in September 2026. "Last cycle" means only last year\'s date was posted; "~" and "est." mark dates estimated from the usual pattern. Always confirm before you apply.'),
]


def download_list(downloads):
    """Download links grouped by document: "Résumé: Word · PDF"."""
    docs = {}
    for label, href in downloads:
        name, kind = re.match(r'(.+) \((.+)\)$', label).groups()
        docs.setdefault(name, []).append(f'<a href="{html.escape(href)}">{kind}</a>')
    return b_list([f'<strong>{name}:</strong> ' + ' · '.join(links) for name, links in docs.items()], cls='pp-downloads')


def tab_nav(track, current):
    """The path's pages as a tab bar; the current page is bold, not a link."""
    items = [f'<a href="../{OVERVIEW[track]}/">Overview</a>' if current is not None else '<strong>Overview</strong>']
    for pid, label, _ in PAGES[track]:
        items.append(f'<strong>{html.escape(label)}</strong>' if pid == current else f'<a href="../{SLUGS[pid]}/">{html.escape(label)}</a>')
    return b_list(items, cls='pp-tabs')


def side_nav(toc, panel_id):
    """The "On this page" menu: each section, and each group of programs with its count."""
    items = []
    for anchor, title, subs in toc:
        sub = b_list([f'<a href="#{a}">{html.escape(label)} ({n})</a>' for a, label, n in subs]) if subs else ''
        items.append(f'<a href="#{anchor}">{html.escape(title)}</a>{sub}')
    blocks = [b_para('On this page', 'pp-side-label'), b_list(items, cls='pp-toc')]
    if SITE:
        blocks.append(b_para(f'<a href="{SITE}#{panel_id}">Open the interactive version</a> for filters and live countdowns.', 'pp-small'))
    return b_group(blocks, 'pp-side')


def as_of():
    return f'As of {TODAY.strftime("%B")} {TODAY.day}, {TODAY.year}. "~" marks an estimate. Confirm each date on the program\'s page.'


def overview_page(track, byid, note):
    """A path's overview: its degrees and the author's note on the left, upcoming deadlines on the right."""
    slug = OVERVIEW[track]
    if track == 'grad':
        panel = byid['g-degrees']
        title = inline(panel.find(lambda n: n.tag == 'h2'), slug)
        lead = inline(panel.find(lambda n: n.tag == 'p' and 'lead' in n.cls), slug)
        cards = [(SLUGS[d.attrs['id']], plain(d.find(has('fold-name'))), plain(d.find(has('fold-sum'))))
                 for d in panel.find_all(lambda n: n.tag == 'details')]
        cards.append(('grad-guides', 'Guides', 'Professors, methods, applying, scholarships and job search tools'))
    else:
        title = 'Preparing for law school'
        lead = inline(byid['law'].find(has('path-head')).find(lambda n: n.tag == 'p'), slug)
        cards = [('law-jd', 'JD', 'What admissions weighs, a timeline for each year, and pre-law programs, internships and scholarships'),
                 ('law-guides', 'Guides', 'QC resources, the LSAT and fees, gap years and your résumé')]
    left = [b_heading(title, 2), b_para(lead, 'pp-lead'),
            b_list([f'<a href="../{s}/"><strong>{html.escape(n)}</strong></a> {html.escape(t)}' for s, n, t in cards], cls='pp-degrees')]
    if note:
        left.append(b_group([b_para(inline(p, slug), 'pp-sig' if 'sig' in p.cls else None) for p in note.els() if p.tag == 'p'], 'pp-note'))
    other = 'law' if track == 'grad' else 'grad'
    links = [f'<a href="../{OVERVIEW[other]}/">Switch to the {"law" if other == "law" else "graduate"} school path</a>']
    if SITE:
        links.insert(0, f'<a href="{SITE}#{track}">Open the interactive version</a> for filters and live countdowns')
    left.append(b_para(' · '.join(links), 'pp-small'))
    right = [b_heading('Upcoming deadlines', 2, 'deadlines'), b_para(as_of(), 'pp-small'), deadline_table(board_data(track))]
    return [tab_nav(track, None),
            b_group([b_group(left, 'pp-split-main'), b_group(right, 'pp-split-side')], 'pp-split'),
            b_group(FOOTER, 'pp-foot')]


def db_section(deg, page):
    """A degree's opportunities list, with the anchor the interactive site's old list had."""
    sid = DB_ID[deg]
    out = [b_heading('Opportunities', 2, sid)]
    if DB_LEAD.get(deg):
        out.append(b_para(DB_LEAD[deg]))
    if SITE:
        out.append(b_para(f'<a href="{SITE}#{sid}">Filter and sort these programs on the interactive site</a>', 'pp-small'))
    blocks, subs = db_blocks(deg, page, sid)
    return out + blocks, subs


def tab_page(track, tab, byid, downloads):
    """A degree or guides page: tab bar, then the side menu beside the sections."""
    pid, _, parts = tab
    slug = SLUGS[pid]
    main, toc = [], []
    for i, part in enumerate(parts):
        if i:
            main.append(b_separator())
        if part.startswith('db:'):
            blocks, subs = db_section(part[3:], slug)
            sid, title = DB_ID[part[3:]], 'Opportunities'
        else:
            blocks, subs = section_blocks(byid[part], slug, downloads)
            sid, title = part, plain(byid[part].find(lambda n: n.tag == 'h2'))
        main.extend(blocks)
        toc.append((sid, title, subs))
    return [tab_nav(track, pid),
            b_group([side_nav(toc, pid), b_group(main, 'pp-main')], 'pp-layout'),
            b_group(FOOTER, 'pp-foot')]


def home_page():
    """Choose a path on the left; the next deadlines from both paths on the right."""
    left = [
        b_para('A student-made guide for Queens College Political Science majors headed to graduate school or law school: paid research programs, internships, fellowships, deadlines and sample résumés, with every program linked to its official page.', 'pp-lead'),
        b_heading('Choose a path', 2, 'paths'),
        b_list(['<a href="grad-school/"><strong>Graduate school</strong></a> PhD, predoc, MPP, MPA and MA: funded PhDs, paid research jobs and policy master\'s degrees, with a timeline for each year of college.',
                '<a href="law-school/"><strong>Law school</strong></a> The JD: the LSAT and fee waivers, pre-law programs, legal internships and gap years.'], cls='pp-degrees pp-paths'),
        b_heading('How it works', 2),
        b_para('Pick your path, then a degree. Each degree page explains the degree, gives a timeline for each year of college, and lists the programs that prepare you for it, sorted by next deadline. The Guides pages cover professors, methods, applying and résumés.'),
        b_list(['<strong>Good programs pay you.</strong> Almost everything here is free and comes with a stipend, housing, or both.',
                '<strong>Deadlines move every year.</strong> Confirm on the official page before you plan around a date.',
                '<strong>Ask for help.</strong> Professors, QC Pre-Law Advising and the Office of Honors and Scholarships are here to help you apply.']),
    ]
    if SITE:
        left.append(b_para(f'Prefer filters and live countdowns? Use the <a href="{SITE}">interactive version</a>.', 'pp-small'))
    both = sorted(set(board_data('grad') + board_data('law')))[:12]  # some programs are on both boards
    right = [b_heading('Next deadlines', 2, 'deadlines'), b_para(as_of(), 'pp-small'), deadline_table(both),
             b_para('More on the <a href="grad-school/#deadlines">graduate school</a> and <a href="law-school/#deadlines">law school</a> pages.', 'pp-small')]
    return [b_group([b_group(left, 'pp-split-main'), b_group(right, 'pp-split-side')], 'pp-split'), b_group(FOOTER, 'pp-foot')]


def main():
    global SITE
    import sys
    if '--site' in sys.argv:
        SITE = sys.argv[sys.argv.index('--site') + 1].rstrip('/') + '/'
    src = open(os.path.join(ROOT, 'classic', 'index.html'), encoding='utf-8').read()
    data = open(os.path.join(ROOT, 'data.js'), encoding='utf-8').read()
    a = data.index('window.PROGRAMS = ') + len('window.PROGRAMS = ')
    PROGRAMS.extend(json.loads(data[a:data.index('];', a) + 1]))
    b = data.index('window.ALIASES = ') + len('window.ALIASES = ')
    ALIASES.update(json.loads(data[b:data.index(';', b)]))
    BY_ID.update({p['id']: p for p in PROGRAMS})

    dom = parse(src)
    byid = {n.attrs['id']: n for n in dom.find_all(lambda n: 'id' in n.attrs)}
    for t, tabs in PAGES.items():
        for pid, _, parts in tabs:
            slug = SLUGS[pid]
            ID_PAGE[pid] = slug
            for part in parts:
                if part.startswith('db:'):
                    ID_PAGE[DB_ID[part[3:]]] = slug
                    continue
                ID_PAGE[part] = slug
                for el in byid[part].find_all(lambda n: 'id' in n.attrs):
                    ID_PAGE[el.attrs['id']] = slug
    for hint in dom.find_all(lambda n: 'db-hint' in n.cls):
        DB_LEAD[hint.attrs['data-degree']] = inline(hint, DEGREE_PAGE[hint.attrs['data-degree']])
    DB_LEAD['jd'] = inline(byid['l-opps-db'].find(lambda n: n.tag == 'p' and 'lead' in n.cls), 'law-jd')
    note = byid['home'].find(has('note-from'))
    os.makedirs(OUT, exist_ok=True)

    # with --site, link the copies in the interactive site's downloads/ folder;
    # otherwise leave placeholders to swap for Media Library URLs after uploading
    up = SITE + 'downloads/' if SITE else '#upload-'
    downloads = {
        'grad': [('Résumé (Word)', up + 'Sample_Resume_Alex_Rivera.docx'), ('Résumé (PDF)', up + 'Sample_Resume_Alex_Rivera.pdf'),
                 ('Academic CV (Word)', up + 'Sample_CV_Alex_Rivera.docx'), ('Academic CV (PDF)', up + 'Sample_CV_Alex_Rivera.pdf')],
        'law': [('Law résumé (Word)', up + 'Sample_Law_Resume_Jordan_Lee.docx'), ('Law résumé (PDF)', up + 'Sample_Law_Resume_Jordan_Lee.pdf')],
    }
    pages = {'home': home_page()}
    titles = {'home': 'Home'}
    for t in ('grad', 'law'):
        pages[OVERVIEW[t]] = overview_page(t, byid, note)
        titles[OVERVIEW[t]] = 'Graduate school' if t == 'grad' else 'Law school'
        for tab in PAGES[t]:
            slug = SLUGS[tab[0]]
            pages[slug] = tab_page(t, tab, byid, downloads[t])
            titles[slug] = ('Graduate school: ' if t == 'grad' else 'Law school: ') + tab[1]

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
