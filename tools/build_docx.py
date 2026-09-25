"""Build editable .docx résumé/CV templates from the .sheet samples in index.html.

Standard library only: the .docx package is written as raw WordprocessingML.
"""
import html
import os
import re
import zipfile
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'index.html')
OUT = os.path.join(ROOT, 'downloads')

FONT = 'Georgia'
BODY = 21        # half-points: 10.5pt
PAGE_W, MARGIN = 12240, 1080          # US Letter, 0.75in margins
TEXT_W = PAGE_W - 2 * MARGIN          # 10080 twips


def esc(t):
    return (t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


# ---------- parse one .sheet into blocks ----------
class SheetParser(HTMLParser):
    """Turns a .sheet's inner HTML into a list of blocks.
    Block kinds: name, contact, heading, row (left runs, right runs), para (runs), bullet (runs).
    A run is (text, bold, italic, highlight)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.stack = []          # open tags: (tag, classes)
        self.cur = None          # current block being filled
        self.row_side = None     # 'L' or 'R' inside a .r row
        self.row_depth = 0
        self.fmt = []            # formatting stack entries: 'b', 'i', 'h'

    def _classes(self, attrs):
        return dict(attrs).get('class', '').split()

    def handle_starttag(self, tag, attrs):
        cls = self._classes(attrs)
        entry = (tag, cls, None)
        if tag == 'div':
            if 'nm' in cls:
                self.cur = {'kind': 'name', 'runs': []}
            elif 'ct' in cls:
                self.cur = {'kind': 'contact', 'runs': []}
            elif 'h' in cls:
                self.cur = {'kind': 'heading', 'runs': []}
            elif 'r' in cls:
                self.cur = {'kind': 'row', 'L': [], 'R': []}
                self.row_depth = len(self.stack) + 1
                self.row_side = None
            elif 'it' in cls:
                self.cur = {'kind': 'para', 'runs': []}
                entry = (tag, cls, 'i')
                self.fmt.append('i')
            else:
                self.cur = {'kind': 'para', 'runs': []}
        elif tag == 'li':
            self.cur = {'kind': 'bullet', 'runs': []}
        elif tag in ('span', 'b'):
            if self.cur and self.cur['kind'] == 'row' and len(self.stack) == self.row_depth:
                # direct child of the row: first child is the left side, last is the right
                self.row_side = 'L' if not self.cur['L'] else 'R'
            f = 'b' if tag == 'b' else ('i' if 'it' in cls else ('h' if 'ph' in cls else None))
            entry = (tag, cls, f)
            if f:
                self.fmt.append(f)
        elif tag == 'br':
            return
        self.stack.append(entry)

    def handle_endtag(self, tag):
        if not self.stack:
            return
        t, cls, f = self.stack.pop()
        if f:
            self.fmt.remove(f)
        if t in ('div', 'li') and self.cur is not None:
            if t == 'li' or self.cur['kind'] != 'row' or len(self.stack) + 1 == self.row_depth:
                self.blocks.append(self.cur)
                self.cur = None

    def handle_data(self, data):
        if self.cur is None:
            return
        text = re.sub(r'\s+', ' ', data)
        if not text.strip() and not text:
            return
        run = (text, 'b' in self.fmt, 'i' in self.fmt, 'h' in self.fmt)
        if self.cur['kind'] == 'row':
            side = self.row_side or 'L'
            if text.strip() or self.cur[side]:
                self.cur[side].append(run)
        else:
            self.cur['runs'].append(run)


def strip_runs(runs):
    runs = [r for r in runs if r[0] != '']
    if runs:
        runs[0] = (runs[0][0].lstrip(),) + runs[0][1:]
        runs[-1] = (runs[-1][0].rstrip(),) + runs[-1][1:]
    return [r for r in runs if r[0] != '']


# ---------- WordprocessingML ----------
def run_xml(text, bold=False, italic=False, hl=False, size=None, caps=False, spacing=None, color=None):
    rpr = ''
    if bold:
        rpr += '<w:b/>'
    if italic:
        rpr += '<w:i/>'
    if caps:
        rpr += '<w:smallCaps/>'
    if color:
        rpr += f'<w:color w:val="{color}"/>'
    if spacing:
        rpr += f'<w:spacing w:val="{spacing}"/>'
    if size:
        rpr += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    if hl:
        rpr += '<w:highlight w:val="yellow"/>'
    rpr = f'<w:rPr>{rpr}</w:rPr>' if rpr else ''
    return f'<w:r>{rpr}<w:t xml:space="preserve">{esc(text)}</w:t></w:r>'


def runs_xml(runs, **kw):
    return ''.join(run_xml(t, b, i, h, **kw) for t, b, i, h in runs)


def para(inner, style=None, jc=None, before=0, after=0, tabs=False, border=False, keep=False, numbered=False):
    ppr = ''
    if style:
        ppr += f'<w:pStyle w:val="{style}"/>'
    if keep:
        ppr += '<w:keepNext/>'
    if numbered:
        ppr += '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'
    if border:
        ppr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="8C8C8C"/></w:pBdr>'
    if tabs:
        ppr += f'<w:tabs><w:tab w:val="right" w:pos="{TEXT_W}"/></w:tabs>'
    ppr += f'<w:spacing w:before="{before}" w:after="{after}"/>'
    if numbered:
        ppr += '<w:ind w:left="360" w:hanging="220"/>'
    if jc:
        ppr += f'<w:jc w:val="{jc}"/>'
    return f'<w:p><w:pPr>{ppr}</w:pPr>{inner}</w:p>'


def blocks_to_body(blocks):
    out = []
    for blk in blocks:
        k = blk['kind']
        if k == 'name':
            text = ''.join(r[0] for r in blk['runs']).strip()
            out.append(para(run_xml(text, bold=True, size=30, spacing=60), jc='center', after=20))
        elif k == 'contact':
            out.append(para(runs_xml(strip_runs(blk['runs']), size=18), jc='center', after=60))
        elif k == 'heading':
            text = ''.join(r[0] for r in blk['runs']).strip()
            out.append(para(run_xml(text, bold=True, caps=True, size=22, spacing=10), before=200, after=60, border=True, keep=True))
        elif k == 'row':
            left = strip_runs(blk['L'])
            right = strip_runs(blk['R'])
            inner = runs_xml(left) + '<w:r><w:tab/></w:r>' + runs_xml(right)
            out.append(para(inner, tabs=True, before=80, after=0, keep=True))
        elif k == 'bullet':
            out.append(para(runs_xml(strip_runs(blk['runs'])), numbered=True, before=20, after=0))
        else:
            out.append(para(runs_xml(strip_runs(blk['runs'])), before=20, after=0))
    return ''.join(out)


DOC_TMPL = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>{body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1008" w:right="{m}" w:bottom="1008" w:left="{m}" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body>
</w:document>'''

STYLES = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:eastAsia="{FONT}" w:cs="{FONT}"/><w:color w:val="17171A"/><w:sz w:val="{BODY}"/><w:szCs w:val="{BODY}"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="252" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
</w:styles>'''

NUMBERING = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>
<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="220"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/></w:rPr></w:lvl>
</w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>'''

CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>'''

DOC_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>'''


def core(title):
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>{esc(title)}</dc:title><dc:creator>Queens College Political Science Pathways</dc:creator>
</cp:coreProperties>'''


def write_docx(path, title, body):
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', CONTENT_TYPES)
        z.writestr('_rels/.rels', RELS)
        z.writestr('word/_rels/document.xml.rels', DOC_RELS)
        z.writestr('word/document.xml', DOC_TMPL.format(body=body, m=MARGIN))
        z.writestr('word/styles.xml', STYLES)
        z.writestr('word/numbering.xml', NUMBERING)
        z.writestr('docProps/core.xml', core(title))


def extract_sheet(src, marker):
    """Return the inner HTML of the .sheet div whose opening tag contains marker."""
    i = src.index(marker)
    i = src.index('>', i) + 1
    depth, j = 1, i
    for m in re.finditer(r'<(/?)div\b[^>]*>', src[i:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            j = i + m.start()
            break
    return src[i:j]


def main():
    src = open(SRC, encoding='utf-8').read()
    os.makedirs(OUT, exist_ok=True)
    docs = [
        ('<div class="sheet" data-paper="resume">', 'Sample_Resume_Alex_Rivera', 'Sample one-page résumé (fictional student)'),
        ('<div class="sheet" data-paper="cv"', 'Sample_CV_Alex_Rivera', 'Sample academic CV (fictional student)'),
        ('<div class="sheet">\n        <div class="nm">JORDAN LEE', 'Sample_Law_Resume_Jordan_Lee', 'Sample law school résumé (fictional student)'),
    ]
    for marker, name, title in docs:
        inner = extract_sheet(src, marker)
        p = SheetParser()
        p.feed(inner)
        body = blocks_to_body(p.blocks)
        write_docx(os.path.join(OUT, name + '.docx'), title, body)
        print(name, len(p.blocks), 'blocks')


if __name__ == '__main__':
    main()
