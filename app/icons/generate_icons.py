#!/usr/bin/env python3
"""MelodyNote 앱 아이콘 생성기 (외부 라이브러리 없이 순수 zlib PNG 인코딩).
보라색 그라데이션 배경 위에 흰색 8분음표를 그립니다."""
import struct, zlib, math, os

def lerp(a, b, t):
    return a + (b - a) * t

def make_icon(size, path, maskable=False):
    # 배경 그라데이션 색상 (좌상단 -> 우하단)
    c1 = (124, 108, 248)   # --accent  #7c6cf8
    c2 = (167, 139, 250)   # --accent2 #a78bfa
    # 마스커블 아이콘은 안전영역 확보를 위해 음표를 약간 작게
    scale = 0.62 if maskable else 0.74

    # 음표 기하 정의
    cx, cy = size * 0.40, size * 0.66      # 음표 머리 중심
    head_rx, head_ry = size * 0.135, size * 0.105
    angle = -0.35                           # 머리 기울기(라디안)
    stem_x = cx + head_rx * 0.9             # 기둥 x
    stem_w = size * 0.045
    stem_top = size * 0.20
    stem_bot = cy
    # 깃발(flag)
    flag_top = stem_top

    rows = bytearray()
    for y in range(size):
        rows.append(0)  # PNG 필터 타입 (none)
        for x in range(size):
            t = (x / size + y / size) / 2
            r = int(lerp(c1[0], c2[0], t))
            g = int(lerp(c1[1], c2[1], t))
            b = int(lerp(c1[2], c2[2], t))

            ink = 0.0  # 흰색 정도 (0~1)

            # --- 음표 머리: 기울어진 타원 ---
            dx, dy = x - cx, y - cy
            rdx = dx * math.cos(angle) - dy * math.sin(angle)
            rdy = dx * math.sin(angle) + dy * math.cos(angle)
            if (rdx / head_rx) ** 2 + (rdy / head_ry) ** 2 <= 1.0:
                ink = 1.0

            # --- 기둥(stem) ---
            if stem_x - stem_w / 2 <= x <= stem_x + stem_w / 2 and stem_top <= y <= stem_bot:
                ink = 1.0

            # --- 깃발(flag): 기둥 상단에서 오른쪽 아래로 흐르는 곡선 ---
            fx0 = stem_x + stem_w / 2
            rel = (y - flag_top) / (size * 0.30)
            if 0 <= rel <= 1:
                curve = fx0 + size * 0.16 * math.sin(rel * math.pi * 0.7)
                width = size * 0.05
                if fx0 <= x <= curve and (curve - x) <= width + size * 0.02:
                    ink = 1.0

            if ink > 0:
                r = int(lerp(r, 255, ink))
                g = int(lerp(g, 255, ink))
                b = int(lerp(b, 255, ink))

            rows.extend((r, g, b))

    # PNG 인코딩
    def chunk(typ, data):
        c = typ + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8bit RGB
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + \
          chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", path, size, "x", size)

here = os.path.dirname(os.path.abspath(__file__))
make_icon(192, os.path.join(here, "icon-192.png"))
make_icon(512, os.path.join(here, "icon-512.png"))
make_icon(512, os.path.join(here, "icon-maskable.png"), maskable=True)
make_icon(180, os.path.join(here, "apple-touch-icon.png"))
