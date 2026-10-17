"""Make the handouts' QR codes as SVG files (Python standard library only).

    python tools/make_qr.py

Writes assets/qr-programs-grad.svg and assets/qr-programs-law.svg, which open the Programs page. A small
QR encoder (byte mode, error correction level M, versions 1-6), following the QR Code standard
(ISO/IEC 18004) as laid out in Project Nayuki's reference implementation.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://maljahmi.github.io/qc-polisci-pathways/'
CODES = {
    # utm_source lets site analytics count visits from the printed handout
    'qr-programs-grad.svg': SITE + 'programs.html?degree=grad&utm_source=handout',
    'qr-programs-law.svg': SITE + 'programs.html?degree=jd&utm_source=handout',
}

# level M, versions 1-6 (index = version)
ECC_PER_BLOCK = [None, 10, 16, 26, 18, 24, 16]
NUM_BLOCKS = [None, 1, 1, 1, 2, 2, 4]
FORMAT_M = 0  # the two format bits for level M


def gf_mul(x, y):
    z = 0
    for i in reversed(range(8)):
        z = (z << 1) ^ ((z >> 7) * 0x11D)
        z ^= ((y >> i) & 1) * x
    return z


def rs_divisor(degree):
    result = [0] * (degree - 1) + [1]
    root = 1
    for _ in range(degree):
        for j in range(len(result)):
            result[j] = gf_mul(result[j], root)
            if j + 1 < len(result):
                result[j] ^= result[j + 1]
        root = gf_mul(root, 0x02)
    return result


def rs_remainder(data, divisor):
    result = [0] * len(divisor)
    for b in data:
        factor = b ^ result.pop(0)
        result.append(0)
        for i, coef in enumerate(divisor):
            result[i] ^= gf_mul(coef, factor)
    return result


def raw_modules(ver):
    result = (16 * ver + 128) * ver + 64
    if ver >= 2:
        n = ver // 7 + 2
        result -= (25 * n - 10) * n - 55
    return result


def data_codewords(ver):
    return raw_modules(ver) // 8 - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver]


def encode(text):
    data = text.encode('utf-8')
    for ver in range(1, 7):
        cap = data_codewords(ver) * 8
        if 4 + 8 + len(data) * 8 <= cap:
            break
    else:
        raise ValueError('text too long for versions 1-6')
    bits = []

    def put(val, n):
        bits.extend((val >> i) & 1 for i in reversed(range(n)))
    put(0b0100, 4)          # byte mode
    put(len(data), 8)       # character count (8 bits below version 10)
    for b in data:
        put(b, 8)
    put(0, min(4, cap - len(bits)))
    put(0, (-len(bits)) % 8)
    pad = 0xEC
    while len(bits) < cap:
        put(pad, 8)
        pad ^= 0xEC ^ 0x11
    codewords = [int(''.join(map(str, bits[i:i + 8])), 2) for i in range(0, len(bits), 8)]
    return ver, interleave(ver, codewords)


def interleave(ver, data):
    nblocks, ecclen = NUM_BLOCKS[ver], ECC_PER_BLOCK[ver]
    raw = raw_modules(ver) // 8
    nshort = nblocks - raw % nblocks
    shortlen = raw // nblocks
    div = rs_divisor(ecclen)
    blocks, k = [], 0
    for i in range(nblocks):
        dat = data[k:k + shortlen - ecclen + (0 if i < nshort else 1)]
        k += len(dat)
        ecc = rs_remainder(dat, div)
        if i < nshort:
            dat = dat + [0]
        blocks.append(dat + ecc)
    out = []
    for i in range(len(blocks[0])):
        for j, blk in enumerate(blocks):
            if i != shortlen - ecclen or j >= nshort:
                out.append(blk[i])
    return out


class Grid:
    def __init__(self, ver):
        self.ver = ver
        self.size = ver * 4 + 17
        self.dark = [[False] * self.size for _ in range(self.size)]
        self.func = [[False] * self.size for _ in range(self.size)]

    def set_func(self, x, y, dark):
        self.dark[y][x] = dark
        self.func[y][x] = True

    def draw_function_patterns(self):
        n = self.size
        for i in range(n):
            self.set_func(6, i, i % 2 == 0)
            self.set_func(i, 6, i % 2 == 0)
        for cx, cy in ((3, 3), (n - 4, 3), (3, n - 4)):
            for dy in range(-4, 5):
                for dx in range(-4, 5):
                    x, y = cx + dx, cy + dy
                    if 0 <= x < n and 0 <= y < n:
                        self.set_func(x, y, max(abs(dx), abs(dy)) not in (2, 4))
        pos = self.alignment_positions()
        last = len(pos) - 1
        for i, ax in enumerate(pos):
            for j, ay in enumerate(pos):
                if (i, j) in ((0, 0), (0, last), (last, 0)):
                    continue
                for dy in range(-2, 3):
                    for dx in range(-2, 3):
                        self.set_func(ax + dx, ay + dy, max(abs(dx), abs(dy)) != 1)
        self.draw_format(0)  # reserve the format areas; redrawn with the real mask later

    def alignment_positions(self):
        if self.ver == 1:
            return []
        n = self.ver // 7 + 2
        step = -(-(self.ver * 4 + n * 2 + 1) // (n * 2 - 2)) * 2
        result = [6]
        p = self.size - 7
        while len(result) < n:
            result.insert(1, p)
            p -= step
        return result

    def draw_format(self, mask):
        data = FORMAT_M << 3 | mask
        rem = data
        for _ in range(10):
            rem = (rem << 1) ^ ((rem >> 9) * 0x537)
        bits = (data << 10 | rem) ^ 0x5412
        b = lambda i: (bits >> i) & 1 == 1
        n = self.size
        for i in range(6):
            self.set_func(8, i, b(i))
        self.set_func(8, 7, b(6))
        self.set_func(8, 8, b(7))
        self.set_func(7, 8, b(8))
        for i in range(9, 15):
            self.set_func(14 - i, 8, b(i))
        for i in range(8):
            self.set_func(n - 1 - i, 8, b(i))
        for i in range(8, 15):
            self.set_func(8, n - 15 + i, b(i))
        self.set_func(8, n - 8, True)  # the dark module

    def draw_codewords(self, data):
        n, i = self.size, 0
        right = n - 1
        while right >= 1:
            if right == 6:
                right = 5
            for vert in range(n):
                for j in range(2):
                    x = right - j
                    upward = ((right + 1) & 2) == 0
                    y = n - 1 - vert if upward else vert
                    if not self.func[y][x] and i < len(data) * 8:
                        self.dark[y][x] = (data[i >> 3] >> (7 - (i & 7))) & 1 == 1
                        i += 1
            right -= 2

    def apply_mask(self, mask):
        f = [lambda x, y: (x + y) % 2 == 0, lambda x, y: y % 2 == 0, lambda x, y: x % 3 == 0,
             lambda x, y: (x + y) % 3 == 0, lambda x, y: (x // 3 + y // 2) % 2 == 0,
             lambda x, y: x * y % 2 + x * y % 3 == 0, lambda x, y: (x * y % 2 + x * y % 3) % 2 == 0,
             lambda x, y: ((x + y) % 2 + x * y % 3) % 2 == 0][mask]
        for y in range(self.size):
            for x in range(self.size):
                if not self.func[y][x] and f(x, y):
                    self.dark[y][x] = not self.dark[y][x]

    def penalty(self):
        # rules 1, 2 and 4 of the standard's mask evaluation (enough to avoid the worst masks)
        n, score = self.size, 0
        for lines in (self.dark, [list(c) for c in zip(*self.dark)]):
            for row in lines:
                run, prev = 0, None
                for v in row + [None]:
                    if v == prev:
                        run += 1
                    else:
                        if run >= 5:
                            score += 3 + (run - 5)
                        run, prev = 1, v
        for y in range(n - 1):
            for x in range(n - 1):
                c = self.dark[y][x]
                if c == self.dark[y][x + 1] == self.dark[y + 1][x] == self.dark[y + 1][x + 1]:
                    score += 3
        dark = sum(map(sum, self.dark))
        score += abs(dark * 20 - n * n * 10) // (n * n) * 10
        return score


def make(text):
    ver, data = encode(text)
    best = None
    for mask in range(8):
        g = Grid(ver)
        g.draw_function_patterns()
        g.draw_codewords(data)
        g.apply_mask(mask)
        g.draw_format(mask)
        p = g.penalty()
        if best is None or p < best[0]:
            best = (p, g)
    return best[1]


def svg(g, border=4):
    n = g.size + border * 2
    path = ''.join('M%d %dh1v1h-1z' % (x + border, y + border)
                   for y in range(g.size) for x in range(g.size) if g.dark[y][x])
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" shape-rendering="crispEdges">'
            '<rect width="100%%" height="100%%" fill="#fff"/><path d="%s" fill="#000"/></svg>\n' % (n, n, path))


if __name__ == '__main__':
    for name, url in CODES.items():
        g = make(url)
        open(os.path.join(ROOT, 'assets', name), 'w', encoding='utf-8', newline='\n').write(svg(g))
        print(name, 'version', g.ver, url)
