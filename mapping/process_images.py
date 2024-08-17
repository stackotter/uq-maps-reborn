import os

from PIL import Image, ImageDraw

indir = "../../imagery/panos"
outdir = "../../imagery/processed_panos"

os.mkdir(outdir)
panos = [x for x in sorted(os.listdir(indir)) if x.endswith(".JPG")]
for i, pano in enumerate(panos):
    pano = os.path.join(indir, pano)
    with Image.open(pano) as im:
        draw = ImageDraw.Draw(im)
        draw.rectangle(((0, im.height - 200), (im.width, im.height)), fill="black")
        im.save(os.path.join(outdir, f"{i}.jpg"))
