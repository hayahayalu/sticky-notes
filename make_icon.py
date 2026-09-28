from PIL import Image, ImageDraw

S = 512
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

# 紫到薄荷的纵向渐变背景层
grad = Image.new("RGBA", (S, S))
for y in range(S):
    t = y / S
    r = int(124 + (77 - 124) * t)
    g = int(108 + (214 - 108) * t)
    b = int(255 + (193 - 255) * t)
    ImageDraw.Draw(grad).line([(0, y), (S, y)], fill=(r, g, b, 255))

margin = 44
fold = 120  # 折角大小

# 主纸片 mask：圆角矩形，右上角切掉一块做折角
mask = Image.new("L", (S, S), 0)
dm = ImageDraw.Draw(mask)
dm.rounded_rectangle([margin, margin, S - margin, S - margin], radius=42, fill=255)
dm.polygon(
    [(S - margin - fold, margin), (S - margin, margin), (S - margin, margin + fold)],
    fill=0,
)
img.paste(grad, (0, 0), mask)

d = ImageDraw.Draw(img)

# 折角面（折叠的背面，实色浅白）
d.polygon(
    [
        (S - margin - fold, margin),
        (S - margin, margin + fold),
        (S - margin - fold, margin + fold),
    ],
    fill=(233, 236, 248, 255),
)
# 折角折痕高光
d.line(
    [(S - margin - fold, margin), (S - margin, margin + fold)],
    fill=(255, 255, 255, 200),
    width=5,
)

# 三行待办：第一行已勾选，后两行空心
def row(yy, done):
    cx = margin + 46
    size = 30
    if done:
        d.ellipse([cx, yy, cx + size, yy + size], fill=(255, 255, 255, 255))
        d.line(
            [(cx + 8, yy + 16), (cx + 13, yy + 21), (cx + 24, yy + 9)],
            fill=(124, 108, 255, 255),
            width=5,
            joint="curve",
        )
        x_end = int(S * 0.78)
    else:
        d.ellipse(
            [cx, yy, cx + size, yy + size],
            outline=(255, 255, 255, 235),
            width=5,
        )
        x_end = int(S * 0.66) if yy == int(S * 0.58) else int(S * 0.74)
    d.rounded_rectangle(
        [cx + size + 16, yy + 6, x_end, yy + 24],
        radius=8,
        fill=(255, 255, 255, 200),
    )

row(int(S * 0.40), True)
row(int(S * 0.54), False)
row(int(S * 0.68), False)

img = img.resize((256, 256), Image.LANCZOS)
img.save(
    "build/icon.ico",
    format="ICO",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print("icon generated -> build/icon.ico")
