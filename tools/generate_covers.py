"""Generate store-style cover art for every Buggames game (unique per game)."""
import json, hashlib, random
from PIL import Image, ImageDraw, ImageFont

W, H = 480, 270
INK = (36, 18, 57)
PALETTES = [
    ((255, 210, 63), (230, 120, 30)),
    ((255, 107, 157), (190, 40, 110)),
    ((78, 205, 196), (18, 110, 140)),
    ((163, 230, 53), (60, 130, 20)),
    ((251, 146, 60), (200, 70, 10)),
    ((167, 139, 250), (90, 60, 200)),
    ((244, 114, 182), (160, 30, 120)),
    ((56, 189, 248), (8, 90, 170)),
    ((52, 211, 153), (10, 120, 80)),
    ((253, 224, 71), (180, 90, 10)),
    ((248, 113, 113), (150, 40, 40)),
    ((147, 197, 253), (40, 70, 180)),
]

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def make_cover(game):
    seed = int(hashlib.md5(game['id'].encode()).hexdigest(), 16)
    random.seed(seed)
    pal = PALETTES[seed % len(PALETTES)]
    top, bot = pal
    img = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(img)
    # vertical gradient
    for y in range(H):
        d.line([(0, y), (W, y)], fill=lerp(top, bot, y / H))
    # decorative shapes
    for _ in range(16):
        kind = random.choice(['dot', 'ring', 'bolt'])
        x, y = random.randint(-20, W + 20), random.randint(-20, H + 20)
        r = random.randint(8, 46)
        c = lerp(top, bot, random.random())
        alpha = random.randint(28, 60)
        if kind == 'dot':
            d.ellipse([x - r, y - r, x + r, y + r], fill=lerp(c, INK, 0.22))
        elif kind == 'ring':
            d.ellipse([x - r, y - r, x + r, y + r], outline=lerp(c, INK, 0.35), width=6)
        else:  # bolt
            pts = [(x, y - r), (x + r // 2, y - r // 4), (x, y + r // 3), (x + r // 2, y + r + r), (x - r // 2, y + r // 3), (x, y - r // 2)]
            d.polygon(pts, fill=lerp(c, INK, 0.15))
    # diagonal shine
    shine = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shine)
    sd.polygon([(0, H), (W * 0.45, 0), (W * 0.72, 0), (W * 0.22, H)], fill=(255, 255, 255, 22))
    img = Image.alpha_composite(img.convert('RGBA'), shine).convert('RGB')
    d = ImageDraw.Draw(img)
    # big initials
    initials = ''.join(w[0] for w in game['name'].replace('3D', '').split()[:2]).upper()[:2] or game['name'][0].upper()
    try:
        font = ImageFont.truetype('arialbd.ttf', 118)
        font_small = ImageFont.truetype('arialbd.ttf', 30)
    except Exception:
        font = ImageFont.load_default()
        font_small = font
    bbox = d.textbbox((0, 0), initials, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx, ty = 26, H // 2 - th // 2 - 6
    d.text((tx + 5, ty + 6), initials, font=font, fill=INK)
    d.text((tx, ty), initials, font=font, fill=(255, 248, 236))
    # category ribbon
    cat_map = {'arcade': 'ARCADE', 'puzzle': 'PUZZLE', 'kuis': 'KUIS', '3d': '3D GAME'}
    label = cat_map.get(game['cat'], game['cat'].upper())
    d.rounded_rectangle([W - 132, H - 44, W - 12, H - 12], radius=8, fill=INK)
    lb = d.textbbox((0, 0), label, font=font_small)
    d.text((W - 132 + ((120 - (lb[2] - lb[0])) // 2), H - 36), label, font=font_small, fill=(255, 210, 63))
    return img

if __name__ == '__main__':
    import os
    os.makedirs('icons/covers', exist_ok=True)
    games = json.load(open('tools/catalog.json', encoding='utf-8'))
    for g in games:
        make_cover(g).save(f"icons/covers/{g['id']}.png", optimize=True)
    print(f"Generated {len(games)} covers")
