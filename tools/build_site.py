"""Builds the site's pages from its content.

The words come from classic/index.html (the old single-page site; sections are copied as they are, nothing
is rewritten) and the programs from data.js. This writes grad.html, law.html, jobs.html, guides.html, one
guide-*.html per guide, programs.html, about.html, plans.js (the year-by-year timelines as data) and
oldlinks.js (where links from the old site go) into the site's root. The home page (index.html) and the
handout are written by hand. Run it after content changes:  python tools/build_site.py
"""
import html as H
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = ROOT  # pages are written to the site's root
SRC = open(os.path.join(ROOT, 'classic', 'index.html'), encoding='utf-8').read()
DATA = open(os.path.join(ROOT, 'data.js'), encoding='utf-8').read()
a = DATA.index('window.PROGRAMS = ') + len('window.PROGRAMS = ')
PROGRAMS, _ = json.JSONDecoder().raw_decode(DATA[a:])
b = DATA.index('window.ALIASES = ') + len('window.ALIASES = ')
ALIASES, _ = json.JSONDecoder().raw_decode(DATA[b:])
PIDS = {p['id'] for p in PROGRAMS}
UP = ''  # from the pages to the site's root
CREDITS = json.load(open(os.path.join(HERE, 'assets', 'credits.json'), encoding='utf-8'))

# ---------------------------------------------------------------- guides and where every old link goes
# (id, file, title, one line, path) — path is grad, law or both
GUIDES = [
    ('g-start', 'guide-start-graduate.html', 'Start here: graduate school', 'Ground rules for funded programs, and the first things to do', 'grad'),
    ('g-glossary', 'guide-glossary.html', 'Glossary', 'Plain-English meanings of the terms you will see, from predoc to CAS', 'both'),
    ('l-start', 'guide-start-law.html', 'Start here: law school', 'Three ground rules for pre-law students', 'law'),
    ('g-social', 'guide-professors.html', 'Talk to your professors', 'Office hours, and an email you can copy', 'both'),
    ('g-pair', 'guide-pair-your-major.html', 'Pair your major', 'Minors and second majors that open doors', 'grad'),
    ('g-methods', 'guide-methods.html', 'Methods and skills', 'Statistics, R and the courses that teach them', 'grad'),
    ('l-qc', 'guide-qc-prelaw.html', 'QC and CUNY pre-law resources', 'Pre-law advising, the Legal Studies minor and clubs', 'law'),
    ('l-research', 'guide-prelaw-research.html', 'Research as a pre-law student', 'Honors theses and faculty research', 'law'),
    ('g-rbsi', 'guide-rbsi.html', 'Notes from RBSI', 'First-hand notes from the Ralph Bunche Summer Institute', 'grad'),
    ('g-help', 'guide-statements.html', 'Statements, help and AI', 'Who reads your statement, and where AI fits', 'both'),
    ('g-letters', 'guide-letters.html', 'Recommendation letters', 'How to ask, with a sample email', 'both'),
    ('g-apply', 'guide-applying.html', 'Applying to PhD programs', 'Fees, waivers, the GRE and the rest of the file', 'grad'),
    ('g-visit', 'guide-phd-visits.html', 'PhD visit programs', 'Funded campus visits; apply the summer before senior year', 'grad'),
    ('l-lsat', 'guide-lsat.html', 'LSAT and fees', 'Test dates, costs and the fee waiver', 'law'),
    ('g-samples', 'guide-resume-cv.html', 'Sample résumé and CV', 'Copy the structure, not the content', 'grad'),
    ('l-sample', 'guide-law-resume.html', 'Sample law school résumé', 'Hours per week, interests, no objective', 'law'),
    ('l-gap', 'guide-gap-years.html', 'Gap years', 'Most law students worked first', 'law'),
    ('g-funding', 'guide-scholarships.html', 'Scholarships and funding', "QC's own application, national awards and study abroad", 'both'),
    ('g-fields', 'guide-journalism-nonprofits-government.html', 'Journalism, nonprofits and government', 'Paid internships and fellowships outside graduate school', 'both'),
    ('g-search', 'guide-job-search.html', 'Job search tools and AI', 'HireQC, free certificates and job alerts', 'both'),
    ('g-network', 'guide-network.html', 'Building a network', 'Professors, the career center and NYC events', 'both'),
    ('g-politics', 'guide-politics-campaigns.html', 'Working in politics and campaigns', 'Campaign jobs, party internships, poll work and New York election dates', 'both'),
    ('g-campus', 'guide-getting-involved.html', 'Getting involved at Queens College', 'Clubs, student government, leadership and honor societies', 'both'),
    ('g-present', 'guide-presenting-research.html', 'Presenting and publishing research', 'Undergraduate conferences and journals that take student papers', 'both'),
    ('g-intl', 'guide-international-affairs.html', 'International affairs and the Foreign Service', 'The Foreign Service, the UN, master\'s degrees and how to get there', 'both'),
    ('g-teach', 'guide-teaching.html', 'Teaching social studies', 'Certification at Queens College, other routes and pay', 'grad'),
    ('g-pay', 'guide-paying-for-school.html', 'Paying for graduate and law school', 'The new loan limits, Public Service Loan Forgiveness and ways to pay less', 'both'),
    ('g-dual', 'guide-dual-degrees.html', 'Dual degrees', 'Law plus policy or international affairs, in four years instead of five', 'both'),
    ('g-daca', 'guide-undocumented-daca.html', 'Undocumented and DACA students', 'Help at QC and CUNY, paying for school, work and the bar', 'both'),
    ('g-transfer', 'guide-transfer-working.html', 'Transfer and working students', 'Transfer credits, work-study, flexible courses and internships for credit', 'both'),
    ('g-support', 'guide-support.html', 'Support on campus', 'Counseling, food, emergency money, disability services and more', 'both'),
    ('g-ai', 'guide-ai.html', 'Using AI the right way', 'A helper and a proofreader, never the writer', 'both'),
    ('g-jobs', 'guide-jobs.html', 'Jobs you can get', 'Common first jobs for political science majors, what they ask for and what they pay', 'both'),
]
GROUPS = [
    ('start', 'Start here', ['g-start', 'l-start', 'g-glossary']),
    ('ready', 'Get ready', ['g-social', 'g-campus', 'g-pair', 'g-methods', 'l-qc', 'l-research', 'g-present', 'g-rbsi']),
    ('apply', 'Apply', ['g-help', 'g-letters', 'g-apply', 'g-visit', 'l-lsat', 'g-samples', 'l-sample', 'l-gap', 'g-dual']),
    ('careers', 'Jobs and careers', ['g-jobs', 'g-fields', 'g-politics', 'g-intl', 'g-teach', 'g-search', 'g-ai', 'g-network']),
    ('money', 'Paying for it', ['g-pay', 'g-funding']),
    ('support', 'Support and your situation', ['g-daca', 'g-transfer', 'g-support']),
]
G = {g[0]: g for g in GUIDES}
DEGREES = [
    ('phd', 'PhD', 'g-phd', ['g-phd-about', 'g-phd-fields'], 'g-timeline'),
    ('predoc', 'Predoc', 'g-predoc', ['g-predoc-about', 'g-predoc-reqs', 'g-predoc-writing'], 'g-predoc-timeline'),
    ('mpp', 'MPP', 'g-mpp', ['g-mpp-about'], 'g-mpp-timeline'),
    ('mpa', 'MPA', 'g-mpa', ['g-mpa-about'], 'g-mpa-timeline'),
    ('ma', 'MA', 'g-ma', ['g-ma-about'], 'g-ma-timeline'),
]
LINKS = {
    'home': 'index.html', 'grad': 'grad.html', 'law': 'law.html', 'about': 'about.html', 'opportunities': 'programs.html',
    'all-db': 'programs.html', 'g-opps': 'programs.html?degree=grad', 'g-opps-db': 'programs.html?degree=grad',
    'l-opps': 'programs.html?degree=jd', 'l-opps-db': 'programs.html?degree=jd', 'l-jd-db': 'programs.html?degree=jd',
    'g-degrees': 'grad.html#degrees', 'g-years': 'grad.html#path', 'l-years': 'law.html#path', 'l-jd': 'law.html#path',
    'g-guides': 'guides.html', 'g-ready': 'guides.html#ready', 'g-applying': 'guides.html#apply', 'g-money': 'guides.html#careers',
    'l-guides': 'guides.html', 'l-ready': 'guides.html#ready', 'l-applying': 'guides.html#apply',
    'l-path': 'law.html#takes', 'l-fields': 'law.html#fields', 'l-timeline': 'law.html#path',
}
for gid, f, *_ in GUIDES:
    LINKS[gid] = f
for key, name, fold, secs, plan in DEGREES:
    LINKS[fold] = 'grad.html?degree=%s#degrees' % key
    LINKS[plan] = 'grad.html?degree=%s#path' % key
    LINKS['g-%s-db' % key] = 'programs.html?degree=%s' % key
    for s in secs:
        LINKS[s] = 'grad.html?degree=%s#%s' % (key, s)
MISSING = set()


def link_for(target, dtype=''):
    pid = ALIASES.get(target, target)
    if pid in PIDS:
        return 'programs.html#' + pid
    url = LINKS.get(target)
    if url is None:
        MISSING.add(target)
        return '#' + target
    if dtype and url.startswith('programs.html'):
        url += ('&' if '?' in url else '?') + 'type=' + dtype
    return url


def relink(s):
    def tag(m):
        t = m.group(0)
        hm = re.search(r'href="#([^"]+)"', t)
        if not hm:
            return t
        dm = re.search(r'data-type="([^"]+)"', t)
        qm = re.search(r'data-q="([^"]+)"', t)
        om = re.search(r'data-open="1"', t)
        t = re.sub(r'\s(data-type|data-go|data-q|data-open)="[^"]*"', '', t)
        url = link_for(hm.group(1), dm.group(1) if dm else '')
        if qm and url.startswith('programs.html'):
            url += ('&' if '?' in url else '?') + 'q=' + qm.group(1)
        if om and url.startswith('programs.html'):
            url += ('&' if '?' in url else '?') + 'open=1'
        return t.replace(hm.group(0), 'href="%s"' % H.escape(url, quote=True))
    return re.sub(r'<a\b[^>]*>', tag, s)


def section(sid):
    i = SRC.index('<section id="%s"' % sid)
    i = SRC.index('>', i) + 1
    j = SRC.index('</section>', i)
    inner = SRC[i:j]
    m = re.search(r'\s*<div class="sh"><h2>(.*?)</h2></div>', inner)
    title = re.sub('<[^>]+>', '', m.group(1)) if m else ''
    if m:
        inner = inner[:m.start()] + inner[m.end():]
    inner = inner.replace('<div class="sheet"', '<div data-ui class="sheet"')
    inner = inner.replace('href="../downloads/', 'href="' + UP + 'downloads/')  # classic/ links up to the sample files
    return title, relink(inner).strip()


def demote(s):
    """Headings inside a section sit one level under the section's own title."""
    s = re.sub(r'<h4\b', '<h5', s).replace('</h4>', '</h5>')
    s = re.sub(r'<h3\b', '<h4', s).replace('</h3>', '</h4>')
    return s


# ---------------------------------------------------------------- the year-by-year plans as data
def plans():
    out = {}
    for key, sid in [('phd', 'g-timeline'), ('predoc', 'g-predoc-timeline'), ('mpp', 'g-mpp-timeline'),
                     ('mpa', 'g-mpa-timeline'), ('ma', 'g-ma-timeline'), ('jd', 'l-timeline')]:
        _, inner = section(sid)
        rows = []
        for li in re.findall(r'<li class="plan-yr[^"]*">(.*?)\n    </li>', inner, re.S):
            head = re.search(r'<div class="plan-head"><h3>(.*?)</h3><p>(.*?)</p>(?:<span class="plan-tag">(.*?)</span>)?</div>', li)
            terms = []
            for tn, ul in re.findall(r'<div class="term"><p class="term-name">(.*?)</p><ul>(.*?)</ul></div>', li):
                terms.append({'name': tn, 'items': re.findall(r'<li>(.*?)</li>', ul)})
            rows.append({'label': head.group(1), 'focus': head.group(2), 'tag': head.group(3) or '', 'terms': terms})
        assert rows, sid
        out[key] = rows
    return out


# ---------------------------------------------------------------- page frame
def credits_line():
    return 'Photos (shown in black and white), via Wikimedia Commons: ' + '; '.join(
        '<a href="%s">%s</a> by %s, %s' % (H.escape(c['page']), H.escape(c['title']), H.escape(c['creator']), H.escape(c['license']))
        for c in CREDITS) + '.'


NAV = [('grad.html', 'Graduate school'), ('law.html', 'Law school'), ('jobs.html', 'Jobs'), ('programs.html', 'Programs'), ('guides.html', 'Guides'), ('about.html', 'About')]
CAREER_CENTER = 'https://www.qc.cuny.edu/academics/cei/'


def page(fname, title, desc, body_class, main, scripts=(), here=''):
    links = ''.join('<a href="%s"%s>%s</a>' % (u, ' aria-current="page"' if u == here else '', t) for u, t in NAV)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{H.escape(title)}</title>
<meta name="description" content="{H.escape(desc)}">
<meta name="theme-color" content="#E71939">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cabin:wght@400..700&family=Libre+Baskerville:wght@400;700&display=swap">
<link rel="stylesheet" href="taste.css">
<link rel="stylesheet" href="pages.css">
<script>document.documentElement.classList.add('js')</script>
<script data-goatcounter="https://maljahmi.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</head>
<body class="path-page sub {body_class}">

<header class="topbar">
  <a class="wordmark" href="index.html"><span class="long">Queens College Political Science </span>Pathways</a>
  <nav class="top-links" aria-label="Main">{links}</nav>
  <a class="btn btn-small" href="index.html#path">Find your year</a>
</header>

<main>
{main}
</main>

<footer class="foot foot-short">
  <div class="foot-top">
    <div class="invite">
      <h2>Start with<br>this semester</h2>
      <a class="btn btn-ink" href="index.html#path">Find your year</a>
    </div>
    <nav class="foot-links" aria-label="More">{''.join('<a href="%s">%s</a>' % (u, t) for u, t in NAV)}<a href="{CAREER_CENTER}">QC Career Center</a></nav>
  </div>
  <p class="credits"><span>Photos via Wikimedia Commons; <a href="about.html#credits">photo credits</a>.</span><span>Career help on campus: the <a href="{CAREER_CENTER}">Center for Career Engagement and Internships</a>, Frese Hall 213.</span><span>Details change often: always check each program's official website for the most accurate, up-to-date information before you apply.</span><span>Know a program we're missing? <a href="{SUGGEST}">Suggest a program</a>.</span><span>Student-made; not an official Queens College or CUNY publication. Questions: <a href="mailto:mohamed.aljahmi@qc.cuny.edu">mohamed.aljahmi@qc.cuny.edu</a>.</span></p>
  <p class="giant" aria-hidden="true">Pathways</p>
</footer>

<script src="data.js"></script>
<script src="plans.js"></script>
<script src="common.js"></script>
{''.join('<script src="%s"></script>' % s for s in scripts)}
</body>
</html>
'''


def hero(title, lede, pic, alt, pos='50% 50%', extra=''):
    return f'''<section class="page-hero">
  <div class="ph-text">
    <h1 class="lines"><span class="line"><span data-line style="--i:0">{title}</span></span></h1>
    <p class="ph-lede" data-rise>{lede}</p>
    {extra}
  </div>
  <figure class="ph-pic"><img src="assets/{pic}" width="1920" height="1280" alt="{H.escape(alt)}" style="object-position:{pos}" fetchpriority="high"></figure>
</section>'''


def guide_list(ids):
    return '<ul class="guide-list">' + ''.join(
        '<li><a href="%s">%s</a><span>%s</span></li>' % (G[i][1], H.escape(G[i][2]), H.escape(G[i][3])) for i in ids) + '</ul>'


def new_tab(text):
    """Links to other sites open in a new tab."""
    def tag(m):
        t = m.group(0)
        if ' target=' in t or not re.search(r'href="https?://', t):
            return t
        return t[:-1] + ' target="_blank" rel="noopener">'
    return re.sub(r'<a\b[^>]*>', tag, text)


def write(fname, text):
    if fname.endswith('.html'):
        text = new_tab(text)
    open(os.path.join(HERE, fname), 'w', encoding='utf-8', newline='\n').write(text)


# ---------------------------------------------------------------- graduate school
def grad_page():
    band, panels = [], []
    for key, name, fold, secs, plan in DEGREES:
        m = re.search(r'<details class="deg" id="%s"[^>]*>\s*<summary><span class="fold-name">[^<]+</span><span class="fold-sum">([^<]+)</span>' % fold, SRC)
        what, _, length = m.group(1).partition('. ')
        band.append(f'<button type="button" data-degree="{key}" aria-pressed="false"><b>{name}</b><span>{H.escape(what)}</span><small>{H.escape(length)}</small></button>')
        body = ''
        for s in secs:
            t, inner = section(s)
            body += f'<section class="article-part" id="{s}"><h3>{H.escape(t)}</h3>{demote(inner)}</section>'
        panels.append(f'<div class="deg-panel" data-panel="{key}" hidden>{body}</div>')
    grad_guides = [g for g in ['g-start', 'g-social', 'g-methods', 'g-pair', 'g-letters', 'g-help', 'g-apply', 'g-visit', 'g-samples', 'g-funding', 'g-fields', 'g-network'] if g in G]
    main = hero('Graduate school', 'PhD, predoc, MPP, MPA and MA: what each degree is, what to do each year of college, and the programs that help you get there.',
                'new-york-state-capitol-albany-new-york.jpg', 'Inside the New York State Capitol in Albany', '50% 40%') + f'''
<section class="degrees" id="degrees" aria-labelledby="deg-h">
  <h2 id="deg-h">Which degree?</h2>
  <p class="sec-lede">Pick one. The details, the year-by-year path and the programs below all switch to it. Not sure? <a href="index.html#quiz">Take the quiz</a>.</p>
  <div class="deg-band" role="group" aria-label="Degree">{''.join(band)}</div>
  <div class="deg-panels article">{''.join(panels)}</div>
</section>
<div class="stages" id="path" data-path data-goal-from="degree"></div>
<section class="next-programs" id="programs" aria-labelledby="np-h">
  <h2 id="np-h">Programs to apply to</h2>
  <p class="sec-lede" data-np-lede>The next deadlines for this degree.</p>
  <ol class="apply np" data-next-programs></ol>
  <a class="all-link" data-all-programs href="programs.html">All programs</a>
</section>
<section class="more-guides" id="guides" aria-labelledby="mg-h">
  <h2 id="mg-h">Guides for graduate school</h2>
  {guide_list(grad_guides)}
</section>'''
    write('grad.html', page('grad.html', 'Graduate school · Queens College Political Science Pathways',
                            'PhD, predoc, MPP, MPA and MA for Queens College political science majors: the degrees, a year-by-year path and the programs to apply to.',
                            'grad-page', main, ['path-core.js', 'subject.js'], 'grad.html'))


# ---------------------------------------------------------------- law school
def law_page():
    t1, takes = section('l-path')
    t2, fields = section('l-fields')
    law_guides = ['l-start', 'g-social', 'l-qc', 'l-research', 'g-letters', 'g-help', 'l-lsat', 'l-sample', 'l-gap', 'g-funding', 'g-fields', 'g-network']
    main = hero('Law school', 'The JD: what admissions weighs, what to do each year, the fields of law, pre-law programs and internships, and the LSAT. Not sure law school is for you? <a href="index.html#quiz">Take the quiz</a>.',
                'courthouses-on-foley-square.jpg', 'The courthouses on Foley Square in Lower Manhattan', '50% 30%') + f'''
<section class="article-band" id="takes" aria-labelledby="takes-h">
  <h2 id="takes-h">{H.escape(t1)}</h2>
  <div class="article wide">{demote(takes)}</div>
</section>
<section class="article-band tone" id="fields" aria-labelledby="fields-h">
  <h2 id="fields-h">{H.escape(t2)}</h2>
  <div class="article wide">{demote(fields)}</div>
</section>
<div class="stages" id="path" data-path data-goal="jd"></div>
<section class="next-programs" id="programs" aria-labelledby="np-h">
  <h2 id="np-h">Programs to apply to</h2>
  <p class="sec-lede" data-np-lede>The next deadlines for students headed to law school.</p>
  <ol class="apply np" data-next-programs></ol>
  <a class="all-link" data-all-programs href="programs.html?degree=jd">All programs</a>
  <a class="all-link" href="programs.html?type=pipeline">Pre-law pipeline programs</a>
</section>
<section class="more-guides" id="guides" aria-labelledby="mg-h">
  <h2 id="mg-h">Guides for law school</h2>
  {guide_list(law_guides)}
</section>'''
    write('law.html', page('law.html', 'Law school · Queens College Political Science Pathways',
                           'Law school for Queens College political science majors: what admissions weighs, the fields of law, a year-by-year path, the LSAT and the programs to apply to.',
                           'law-page', main, ['path-core.js', 'subject.js'], 'law.html'))


# ---------------------------------------------------------------- guides
PICS = ['main-st-qns-college-td-32-queens.jpg', 'manhattan-seen-from-queens-college.jpg', 'new-york-state-capitol-albany-new-york.jpg',
        'courthouses-on-foley-square.jpg', 'united-states-capitol-washington-dc.jpg']
ALTS = ['Queens Hall on the Queens College campus', 'The Manhattan skyline seen across the Queens College Quad', 'Inside the New York State Capitol in Albany',
        'The courthouses on Foley Square in Lower Manhattan', 'The United States Capitol in Washington']
# which programs to show at the end of a guide, as a filter the page applies to data.js
GUIDE_PROGRAMS = {
    'g-start': {'degrees': ['phd', 'mpp', 'mpa'], 'types': ['summer-research']},
    'l-start': {'degrees': ['jd'], 'types': ['pipeline']},
    'g-social': {'types': ['summer-research'], 'years': ['fr', 'so']},
    'g-methods': {'types': ['summer-research', 'course']},
    'l-qc': {'degrees': ['jd'], 'types': ['campus']},
    'l-research': {'degrees': ['jd'], 'types': ['summer-research', 'fellowship']},
    'g-visit': {'types': ['visit']},
    'g-intl': {'types': ['international']},
    'g-politics': {'types': ['politics']},
    'g-campus': {'types': ['campus']},
    'g-present': {'ids': ['gp-psa-student-research-conference', 'gp-mpsa-undergraduate-posters', 'gp-ncur', 'gp-borough-queens-undergraduate-research',
                          'gp-cuny-celebration-undergraduate-research', 'gp-nyspsa-undergraduate', 'gp-nepsa-annual-meeting'], 'limit': 7},
    'g-daca': {'open': True},
    'g-apply': {'degrees': ['phd'], 'types': ['fellowship', 'visit']},
    'l-lsat': {'degrees': ['jd'], 'types': ['pipeline']},
    'l-gap': {'degrees': ['jd'], 'types': ['after']},
    'g-funding': {'types': ['fellowship']},
    'g-fields': {'types': ['journalism', 'after', 'summer-internship']},
    'g-search': {'types': ['summer-internship', 'fall-internship', 'spring-internship']},
    'g-network': {'types': ['conference'], 'limit': 8},
}


def guides_pages():
    order = [i for _, _, ids in GROUPS for i in ids]
    for n, gid in enumerate(order):
        _, fname, title, line, path = G[gid]
        t, inner = section(gid)
        prev_g = G[order[n - 1]] if n > 0 else None
        next_g = G[order[n + 1]] if n + 1 < len(order) else None
        grp = next(name for key, name, ids in GROUPS if gid in ids)
        pathname = {'grad': 'Graduate school', 'law': 'Law school', 'both': 'Graduate school and law school'}[path]
        spec = GUIDE_PROGRAMS.get(gid)
        progs = (f'''<section class="next-programs in-guide" aria-labelledby="gp-h">
  <h2 id="gp-h">Programs to apply to</h2>
  <ol class="apply np" data-next-programs data-spec='{H.escape(json.dumps(spec), quote=True)}'></ol>
  <a class="all-link" href="programs.html">All programs</a>
</section>''' if spec else '')
        main = f'''<article class="guide">
  <header class="guide-head">
    <h1 class="lines"><span class="line"><span data-line style="--i:0">{H.escape(title)}</span></span></h1>
    <p class="guide-meta" data-rise>{H.escape(line)}. Part of {H.escape(grp)}, for {H.escape(pathname.lower() if path != 'both' else 'graduate school and law school')}.</p>
  </header>
  <figure class="guide-pic"><img src="assets/{PICS[n % len(PICS)]}" width="1920" height="1280" alt="{H.escape(ALTS[n % len(ALTS)])}"></figure>
  <div class="article">{demote(inner)}</div>
</article>
{progs}
<nav class="guide-nav" aria-label="More guides">
  {('<a class="prev" href="%s">Previous: %s</a>' % (prev_g[1], H.escape(prev_g[2]))) if prev_g else '<span></span>'}
  <a class="back" href="index.html#path">Back to your year</a>
  {('<a class="next" href="%s">Next: %s</a>' % (next_g[1], H.escape(next_g[2]))) if next_g else '<span></span>'}
</nav>'''
        write(fname, page(fname, '%s · Queens College Political Science Pathways' % title, line + '.', 'guide-page', main,
                          ['path-core.js', 'guide.js'], 'guides.html'))
    # the index
    groups = ''
    for key, name, ids in GROUPS:
        items = ''.join('<li><a href="%s">%s</a><span>%s · %s</span></li>' % (
            G[i][1], H.escape(G[i][2]), H.escape(G[i][3]),
            {'grad': 'graduate school', 'law': 'law school', 'both': 'both paths'}[G[i][4]]) for i in ids)
        gi = [g[0] for g in GROUPS].index(key)
        pic = f'<img src="assets/{PICS[gi % len(PICS)]}" width="1920" height="1280" alt="{H.escape(ALTS[gi % len(ALTS)])}" loading="lazy" decoding="async">'
        groups += f'<section class="guide-group" id="{key}" aria-labelledby="gg-{key}"><div class="gg-side"><h2 id="gg-{key}">{name}</h2>{pic}</div><ul class="guide-list big">{items}</ul></section>'
    main = hero('Guides', 'How to do the things on the path: talk to professors, ask for letters, take the LSAT, find funding and apply. Each guide ends with programs to apply to.',
                'manhattan-seen-from-queens-college.jpg', 'The Manhattan skyline seen across the Queens College Quad', '40% 70%') + f'<div class="guide-groups">{samples_block()}{groups}</div>'
    write('guides.html', page('guides.html', 'Guides · Queens College Political Science Pathways',
                              'Guides for Queens College political science majors: professors, letters, statements, the LSAT, funding and applying.',
                              'guides-index', main, [], 'guides.html'))


def samples_block():
    """Samples to copy, at the top of the Guides page."""
    return f'''<section class="guide-group samples" id="samples" aria-labelledby="gg-samples"><div class="gg-side"><h2 id="gg-samples">Samples to copy</h2><p class="sec-lede">Templates for a fictional student: copy the structure, not the content.</p></div><ul class="guide-list big">
<li><a href="guide-resume-cv.html">One-page résumé and academic CV</a><span>For jobs, internships and master's programs, and for PhD and research programs. Download the résumé (<a href="{UP}downloads/Sample_Resume_Alex_Rivera.docx" download>Word</a>, <a href="{UP}downloads/Sample_Resume_Alex_Rivera.pdf">PDF</a>) or the CV (<a href="{UP}downloads/Sample_CV_Alex_Rivera.docx" download>Word</a>, <a href="{UP}downloads/Sample_CV_Alex_Rivera.pdf">PDF</a>).</span></li>
<li><a href="guide-law-resume.html">Law school résumé</a><span>Hours per week for jobs, an interests line, no objective. Download it (<a href="{UP}downloads/Sample_Law_Resume_Jordan_Lee.docx" download>Word</a>, <a href="{UP}downloads/Sample_Law_Resume_Jordan_Lee.pdf">PDF</a>).</span></li>
<li><a href="guide-professors.html">Email to a professor asking for advice</a><span>Ask for office hours and offer to help with research.</span></li>
<li><a href="guide-letters.html">Email asking for a recommendation letter</a><span>Your interest, the program and deadline, and the class you took with them.</span></li>
</ul></section>'''


# ---------------------------------------------------------------- jobs
def jobs_page():
    t1, jobs = section('g-jobs')
    toolkit = ['g-ai', 'g-search', 'g-network', 'g-letters', 'g-fields', 'g-funding']
    main = hero('Getting a job', 'Not headed straight to graduate school or law school? Most political science majors work first. Here are the jobs you can get, what they ask for, and how to land one.',
                'manhattan-seen-from-queens-college.jpg', 'The Manhattan skyline seen across the Queens College Quad', '40% 70%') + f'''
<section class="article-band" id="jobs" aria-labelledby="jobs-h">
  <h2 id="jobs-h">{H.escape(t1)}</h2>
  <div class="article wide">{demote(jobs)}</div>
</section>
<section class="article-band tone" id="toolkit" aria-labelledby="tk-h">
  <h2 id="tk-h">How to land one</h2>
  <p class="sec-lede">Guides for each step, from your résumé to the interview.</p>
  {guide_list(toolkit)}
  <h3 class="tk-sub">Samples to copy</h3>
  <ul class="guide-list">
    <li><a href="guide-resume-cv.html">One-page résumé</a><span>Download it (<a href="{UP}downloads/Sample_Resume_Alex_Rivera.docx" download>Word</a>, <a href="{UP}downloads/Sample_Resume_Alex_Rivera.pdf">PDF</a>) and copy the structure.</span></li>
    <li><a href="guide-professors.html">Email asking for advice</a><span>Professors and alumni will help when you make it easy.</span></li>
  </ul>
</section>
<section class="next-programs" id="programs" aria-labelledby="np-h">
  <h2 id="np-h">Paid jobs and fellowships after college</h2>
  <p class="sec-lede">The next deadlines for graduating seniors and recent graduates, soonest first.</p>
  <ol class="apply np" data-next-programs data-spec=\'{{"types": ["after"]}}\'></ol>
  <a class="all-link" href="programs.html?type=after">All after-college programs</a>
</section>
<section class="next-programs" id="internships" aria-labelledby="in-h">
  <h2 id="in-h">Paid internships while you're in school</h2>
  <p class="sec-lede">Internships are how most first jobs start.</p>
  <ol class="apply np" data-next-programs data-spec=\'{{"types": ["summer-internship", "fall-internship", "spring-internship"], "paid": true}}\'></ol>
  <a class="all-link" href="programs.html?type=summer-internship">All internships</a>
</section>
<section class="cta-band" aria-labelledby="cc-h">
  <h2 id="cc-h">Get help at the career center</h2>
  <p>Queens College's <a href="{CAREER_CENTER}">Center for Career Engagement and Internships</a> reviews résumés, runs mock interviews and career fairs, and posts jobs on HireQC (Handshake). It's in Frese Hall 213; book a career educator on <a href="https://www.qc.cuny.edu/navigate/">QC Navigate</a>.</p>
  <a class="btn btn-ink" href="{CAREER_CENTER}">Visit the career center</a>
</section>'''
    write('jobs.html', page('jobs.html', 'Jobs · Queens College Political Science Pathways',
                            'Jobs for Queens College political science majors: what you can do with the degree, what employers ask for, and how to land a job.',
                            'jobs-page', main, ['path-core.js', 'guide.js'], 'jobs.html'))


# ---------------------------------------------------------------- calendar feeds
BASE = 'https://maljahmi.github.io/qc-polisci-pathways/'
SUGGEST = ('mailto:mohamed.aljahmi@qc.cuny.edu?subject=' + 'Program%20suggestion%20for%20QC%20Political%20Science%20Pathways'
           + '&body=' + 'Program%20name%3A%0AOfficial%20link%3A%0AWho%20it%27s%20for%3A%0ADeadline%20(if%20known)%3A%0A')


def ics_text(t):
    return t.replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,').replace('\n', '\\n')


def ics_fold(line):
    """Calendar lines are at most 75 bytes; longer ones continue on the next line after a space."""
    out, cur = [], b''
    for ch in line:
        b = ch.encode('utf-8')
        if len(cur) + len(b) > (75 if not out else 74):
            out.append(cur)
            cur = b''
        cur += b
    out.append(cur)
    return b'\r\n '.join(out).decode('utf-8')


def calendars():
    """deadlines.ics (every program), deadlines-grad.ics and deadlines-law.ics. Students subscribe once; the weekly
    update rebuilds them, so new programs and changed dates reach their calendars on their own."""
    import datetime
    today = datetime.date.today()
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    feeds = {
        'deadlines.ics': ('QC Political Science Pathways: all deadlines', lambda p: True),
        'deadlines-grad.ics': ('QC Political Science Pathways: graduate school deadlines', lambda p: any(d != 'jd' for d in p['degrees'])),
        'deadlines-law.ics': ('QC Political Science Pathways: law school deadlines', lambda p: 'jd' in p['degrees']),
    }
    for fname, (calname, keep) in feeds.items():
        lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//QC Political Science Pathways//Deadlines//EN', 'CALSCALE:GREGORIAN',
                 'METHOD:PUBLISH', 'X-WR-CALNAME:' + ics_text(calname), 'X-WR-TIMEZONE:America/New_York',
                 'REFRESH-INTERVAL;VALUE=DURATION:P1D', 'X-PUBLISHED-TTL:P1D']
        for p in PROGRAMS:
            if not p.get('due') or p.get('status') not in ('confirmed', 'estimate') or not keep(p):
                continue
            day = datetime.date.fromisoformat(p['due'])
            if day < today:
                continue
            name = p.get('short') or re.sub(r'\s*\([^)]*\)\s*$', '', re.sub('<[^>]+>', '', p['name']))
            est = p['status'] == 'estimate'
            desc = (p.get('meta') or '') + ('\nThis date is an estimate.' if est else '') + \
                '\nDetails: ' + BASE + 'programs.html#' + p['id'] + '\nOfficial website: ' + p['url'] + \
                '\nAlways confirm the date on the official website.'
            lines += ['BEGIN:VEVENT', 'UID:%s-%s@qc-polisci-pathways' % (p['id'], p['due']), 'DTSTAMP:' + stamp,
                      'DTSTART;VALUE=DATE:' + day.strftime('%Y%m%d'),
                      'DTEND;VALUE=DATE:' + (day + datetime.timedelta(days=1)).strftime('%Y%m%d'),
                      'SUMMARY:' + ics_text(('Event: ' if p.get('event') else 'Deadline: ') + name + (' (estimated)' if est else '')),
                      'DESCRIPTION:' + ics_text(desc), 'URL:' + BASE + 'programs.html#' + p['id'], 'TRANSP:TRANSPARENT',
                      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + ics_text(name + (' is in a week' if p.get('event') else ' is due in a week')), 'TRIGGER:-P7D', 'END:VALARM',
                      'END:VEVENT']
        lines.append('END:VCALENDAR')
        open(os.path.join(HERE, fname), 'w', encoding='utf-8', newline='').write('\r\n'.join(ics_fold(x) for x in lines) + '\r\n')


def calendar_links(which='deadlines.ics'):
    url = BASE + which
    web = 'webcal://' + url[len('https://'):]
    google = 'https://calendar.google.com/calendar/render?cid=' + web.replace(':', '%3A').replace('/', '%2F')
    return ('<a href="%s">Google Calendar</a> · <a href="%s">Apple or Outlook</a> · <a href="%s" download>download the file</a>'
            % (H.escape(google, quote=True), web, which))


# ---------------------------------------------------------------- programs
def programs_page():
    main = hero('Programs', 'Every program on this site in one list. Search, tap a popular filter, or narrow it down by goal, year and type.',
                'united-states-capitol-washington-dc.jpg', 'The United States Capitol in Washington', '50% 50%',
                '<p class="updated" data-updated></p><p class="updated"><b>Details change often: always check each program\'s official website for the most accurate, up-to-date information before you apply.</b></p><p class="updated cal-line"><b>Get every deadline in your calendar,</b> updated every week: ' + calendar_links() + '. Only <a href="' + 'webcal://maljahmi.github.io/qc-polisci-pathways/deadlines-grad.ics' + '">graduate school</a> or <a href="' + 'webcal://maljahmi.github.io/qc-polisci-pathways/deadlines-law.ics' + '">law school</a> deadlines.</p>') + '''
<section class="programs" aria-label="All programs">
  <div class="filters">
    <label class="f-search"><span>Search all <span data-count></span> programs</span><input type="search" data-f="q" placeholder="A name or topic, like CIA, journalism or Brooklyn" autocomplete="off"></label>
    <div class="presets" role="group" aria-label="Popular filters"><span class="presets-h">Popular</span><button type="button" data-preset='{"soon": 30}' aria-pressed="false">Closing in 30 days</button><button type="button" data-preset='{"paid": true}' aria-pressed="false">Paid or fully funded</button><button type="button" data-preset='{"type": "summer-internship", "paid": true}' aria-pressed="false">Paid summer internships</button><button type="button" data-preset='{"type": "summer-research"}' aria-pressed="false">Summer research</button><button type="button" data-preset='{"type": "fellowship"}' aria-pressed="false">Scholarships and fellowships</button><button type="button" data-preset='{"type": "pipeline"}' aria-pressed="false">Pre-law pipeline programs</button><button type="button" data-preset='{"type": "international"}' aria-pressed="false">International affairs</button><button type="button" data-preset='{"type": "politics"}' aria-pressed="false">Politics and campaigns</button><button type="button" data-preset='{"type": "conference"}' aria-pressed="false">Events and career fairs</button><button type="button" data-preset='{"type": "after"}' aria-pressed="false">After college</button><button type="button" data-preset='{"q": "housing"}' aria-pressed="false">Covers housing</button><button type="button" data-preset='{"open": true}' aria-pressed="false">Open to DACA students</button><button type="button" data-preset='{"year": "fr"}' aria-pressed="false">For freshmen</button></div>
    <details class="more-f" open>
      <summary>More filters: goal, year and type</summary>
      <div class="more-f-body">
        <label><span>Your goal</span><select data-f="degree"><option value="">Any goal</option><option value="grad">Any graduate degree</option><option value="phd">PhD</option><option value="predoc">Predoc (research job)</option><option value="mpp">Public policy master's (MPP)</option><option value="mpa">Public administration master's (MPA)</option><option value="ma">Master's (MA)</option><option value="jd">Law school</option></select></label>
        <label><span>Your year</span><select data-f="year"><option value="">Any year</option><option value="fr">Freshman</option><option value="so">Sophomore</option><option value="jr">Junior</option><option value="sr">Senior</option><option value="grad">After college</option></select></label>
        <label><span>Type</span><select data-f="type"><option value="">Any type</option></select></label>
        <label class="f-check"><input type="checkbox" data-f="paid"> Paid or fully funded</label>
        <label class="f-check"><input type="checkbox" data-f="open"> Open to DACA, undocumented or international students</label>
      </div>
    </details>
    <div class="p-status"><p class="p-count" aria-live="polite"></p><div class="p-active"></div></div>
  </div>
  <div class="p-list"></div>
  <p class="p-note">Dates are this cycle's where posted; otherwise last cycle's, which are usually close. Confirm on the official page.</p>
</section>'''
    write('programs.html', page('programs.html', 'Programs · Queens College Political Science Pathways',
                                'Every program for Queens College political science majors in one searchable list, grouped by month.',
                                'programs-page', main, ['path-core.js', 'programs.js'], 'programs.html'))


# ---------------------------------------------------------------- about
def about_page():
    i = SRC.index('<section id="about"')
    j = SRC.index('</section>', i)
    inner = SRC[SRC.index('<div class="about-grid">', i):j]
    inner = inner[:inner.rindex('</div>')]  # drop the .wrap close
    inner = relink(inner).replace('href="../downloads/', 'href="' + UP + 'downloads/')
    note = re.search(r'<aside class="note-from"[^>]*>(.*?)</aside>', SRC, re.S).group(1)
    note = re.sub(r'<p class="sig">.*?</p>', '', note, flags=re.S).strip()
    main = hero('About this guide', 'A student-made guide for Queens College political science majors, checked against official pages and updated every week.',
                'main-st-qns-college-td-32-queens.jpg', 'Queens Hall on the Queens College campus, seen from Main Street', '60% 50%',
                '<p class="updated" data-updated></p>') + f'''
<section class="about-text article wide">{demote(inner)}</section>
<section class="about-text" id="credits" aria-labelledby="cr-h"><h2 id="cr-h">Photo credits</h2><p class="sec-lede">Every photo on the site is a real, openly licensed photo from Wikimedia Commons, shown in black and white.</p><ul class="credit-grid">{credit_grid()}</ul></section>
<section class="about" aria-labelledby="note-h">
  <div class="about-left">
    <h2 id="note-h">Made by a student,<br>for students</h2>
    <figure class="arch"><img src="assets/manhattan-seen-from-queens-college.jpg" width="1920" height="1273" alt="The Manhattan skyline seen across the Queens College Quad" loading="lazy" decoding="async" style="object-position:40% 70%"></figure>
  </div>
  <div class="about-right">
    <div><h3>Why this exists</h3>{note}<p class="sig">Mohamed Aljahmi</p></div>
    <div><h3>Not an official page</h3><p>This guide is student-made, not a Queens College or CUNY publication. Dates change every year, so confirm each one on the program's official page before you apply.</p></div>
    <a class="btn" href="mailto:mohamed.aljahmi@qc.cuny.edu?subject=Queens%20College%20Political%20Science%20Pathways">Email Mohamed</a>
  </div>
</section>'''
    write('about.html', page('about.html', 'About · Queens College Political Science Pathways',
                             'About this student-made guide: who made it, how it is checked, and its sources.', 'about-page', main, [], 'about.html'))


def credit_grid():
    return ''.join('<li><img src="%s" width="%s" height="%s" alt="%s" loading="lazy" decoding="async"><p><a href="%s">%s</a> by %s, %s</p></li>' % (
        H.escape(c['file'].replace('_mockup-taste/', '')), c['width'], c['height'], H.escape(c['title']), H.escape(c['page']),
        H.escape(c['title']), H.escape(c['creator']), H.escape(c['license'])) for c in CREDITS)


def site_map():
    """Where the year-by-year path's guide links and program links go."""
    return {'guides': {g[0]: g[1] for g in GUIDES}}


def old_links():
    # links to the old single-page site (index.html#g-phd, #gp-truman-scholarship) open the new page
    ids = set(re.findall(r'\sid="([a-z][\w-]*)"', SRC)) | {'home', 'grad', 'law', 'opportunities', 'about'}
    m = {i: LINKS[i] for i in sorted(ids) if i in LINKS and LINKS[i] != 'index.html'}
    js = ('// Generated by tools/build_site.py. Old links to the single-page site (index.html#id) open the new page.\n'
          '(function(){\n'
          '  var L = ' + json.dumps(m, separators=(',', ':')) + ', A = ' + json.dumps(ALIASES, separators=(',', ':')) + ';\n'
          '  var h = decodeURIComponent(location.hash.slice(1));\n'
          '  if (!h) return;\n'
          '  var to = L[h] || (/^(gp|lp)-/.test(h) ? "programs.html#" + (A[h] || h) : "");\n'
          '  if (to) location.replace(to);\n'
          '})();\n')
    write('oldlinks.js', js)


if __name__ == '__main__':
    P = plans()
    for k in P:
        for r in P[k]:
            for t in r['terms']:
                t['items'] = [relink(x) for x in t['items']]
    write('plans.js', '// Generated by tools/build_site.py from classic/index.html. The year-by-year timelines, as data.\nwindow.PLANS = '
          + json.dumps(P, ensure_ascii=False, indent=1) + ';\nwindow.SITEMAP = ' + json.dumps(site_map(), ensure_ascii=False) + ';\n')
    grad_page()
    law_page()
    guides_pages()
    programs_page()
    jobs_page()
    about_page()
    old_links()
    calendars()
    print('built; unknown link targets:', sorted(MISSING) or 'none')
