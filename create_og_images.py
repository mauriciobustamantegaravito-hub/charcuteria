import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_main_og():
    width, height = 1200, 630
    # Base canvas
    bg_img_path = 'assets/hero-mesa.png'
    if os.path.exists(bg_img_path):
        bg = Image.open(bg_img_path).convert('RGB')
        # Resize/crop to fill 1200x630
        bg_ratio = bg.width / bg.height
        target_ratio = width / height
        if bg_ratio > target_ratio:
            new_width = int(bg.height * target_ratio)
            left = (bg.width - new_width) // 2
            bg = bg.crop((left, 0, left + new_width, bg.height))
        else:
            new_height = int(bg.width / target_ratio)
            top = (bg.height - new_height) // 2
            bg = bg.crop((0, top, bg.width, top + new_height))
        bg = bg.resize((width, height), Image.Resampling.LANCZOS)
    else:
        bg = Image.new('RGB', (width, height), color=(18, 9, 4))

    # Add dark luxury vignette / gradient overlay
    overlay = Image.new('RGBA', (width, height), color=(0, 0, 0, 0))
    draw_ov = ImageDraw.Draw(overlay)
    
    # Left dark gradient for text legibility, plus overall dark mood
    for x in range(width):
        alpha = int(220 + 25 * (x / width)) if x > 650 else int(235 - 30 * (x / 650))
        # Left side strong dark backplate
        if x < 680:
            alpha = max(alpha, 220)
        draw_ov.line([(x, 0), (x, height)], fill=(12, 6, 3, alpha))

    # Bottom vignette
    for y in range(height - 180, height):
        progress = (y - (height - 180)) / 180
        alpha = int(progress * 180)
        draw_ov.line([(0, y), (width, y)], fill=(9, 4, 2, alpha))

    # Top vignette
    for y in range(0, 100):
        progress = (100 - y) / 100
        alpha = int(progress * 140)
        draw_ov.line([(0, y), (width, y)], fill=(9, 4, 2, alpha))

    # Composite overlay
    im = Image.alpha_composite(bg.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(im)

    # Fonts
    space_path = 'assets/fonts/SpaceGrotesk.ttf'
    caveat_path = 'assets/fonts/Caveat.ttf'

    font_brand = ImageFont.truetype(space_path, 22) if os.path.exists(space_path) else ImageFont.load_default()
    font_top = ImageFont.truetype(space_path, 46) if os.path.exists(space_path) else ImageFont.load_default()
    font_script = ImageFont.truetype(caveat_path, 68) if os.path.exists(caveat_path) else ImageFont.load_default()
    font_sub = ImageFont.truetype(space_path, 21) if os.path.exists(space_path) else ImageFont.load_default()
    font_pill = ImageFont.truetype(space_path, 18) if os.path.exists(space_path) else ImageFont.load_default()

    # Draw Brand Badge at (60, 65)
    badge_x, badge_y = 65, 65
    badge_text = "☀  CHARCUTERÍA NORATO"
    draw.rounded_rectangle([badge_x, badge_y, badge_x + 310, badge_y + 44], radius=22, fill=(28, 14, 7, 230), outline=(242, 167, 27), width=2)
    draw.text((badge_x + 22, badge_y + 10), badge_text, fill=(255, 246, 229), font=font_brand)

    # Title line 1: "Porque el salchichón bueno"
    text_y1 = 150
    draw.text((65, text_y1), "Porque el salchichón bueno", fill=(255, 246, 229), font=font_top)

    # Title line 2 (Cursive gold): "se cuenta con la boca llena."
    text_y2 = 215
    draw.text((65, text_y2), "se cuenta con la boca llena.", fill=(242, 167, 27), font=font_script)

    # Subtitle
    text_y3 = 310
    draw.text((65, text_y3), "Elaboración artesanal con leña de roble y receta familiar de los 80.", fill=(216, 207, 195), font=font_sub)
    draw.text((65, text_y3 + 32), "Magro de pierna de cerdo seleccionada y tocino firme de primera calidad.", fill=(185, 175, 160), font=font_sub)

    # Presentation Callout (Gold badge)
    pres_y = 410
    draw.rounded_rectangle([65, pres_y, 490, pres_y + 46], radius=23, fill=(226, 72, 43, 230), outline=(255, 123, 99), width=2)
    draw.text((85, pres_y + 12), "★ PRESENTACIÓN 450 g · EMPACADO AL VACÍO", fill=(255, 255, 255), font=font_pill)

    # 3 Flavors Pills
    pill_y = 490
    # Picante
    draw.rounded_rectangle([65, pill_y, 230, pill_y + 42], radius=21, fill=(226, 72, 43), outline=(255, 150, 130), width=1)
    draw.text((85, pill_y + 11), "🔥 Picante", fill=(255, 255, 255), font=font_pill)

    # Jamonado
    draw.rounded_rectangle([245, pill_y, 435, pill_y + 42], radius=21, fill=(142, 68, 173), outline=(190, 130, 220), width=1)
    draw.text((265, pill_y + 11), "🍇 Jamonado", fill=(255, 255, 255), font=font_pill)

    # Cervecero
    draw.rounded_rectangle([450, pill_y, 675, pill_y + 42], radius=21, fill=(216, 121, 22), outline=(255, 180, 100), width=1)
    draw.text((470, pill_y + 11), "🍺 Cervecero 450g", fill=(255, 255, 255), font=font_pill)

    # Subtle golden border around the entire image
    draw.rectangle([0, 0, width - 1, height - 1], outline=(242, 167, 27), width=4)

    # Save optimized JPEG (< 200 KB)
    out_path = 'assets/og-image.jpg'
    im.save(out_path, 'JPEG', quality=85, optimize=True, progressive=True)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"Generated {out_path}: {size_kb:.1f} KB")

    # Also generate og-thumb.jpg (600x600 square for WhatsApp thumbnail)
    thumb = im.crop((0, 0, height, height)).resize((600, 600), Image.Resampling.LANCZOS)
    thumb_path = 'assets/og-thumb.jpg'
    thumb.save(thumb_path, 'JPEG', quality=84, optimize=True, progressive=True)
    thumb_kb = os.path.getsize(thumb_path) / 1024
    print(f"Generated {thumb_path}: {thumb_kb:.1f} KB")

def create_flavor_og(flavor_key, title, subtitle, accent_rgb, bg_photo, protagonist_png):
    width, height = 1200, 630
    if os.path.exists(bg_photo):
        bg = Image.open(bg_photo).convert('RGB')
        bg_ratio = bg.width / bg.height
        target_ratio = width / height
        if bg_ratio > target_ratio:
            new_width = int(bg.height * target_ratio)
            left = (bg.width - new_width) // 2
            bg = bg.crop((left, 0, left + new_width, bg.height))
        else:
            new_height = int(bg.width / target_ratio)
            top = (bg.height - new_height) // 2
            bg = bg.crop((0, top, bg.width, top + new_height))
        bg = bg.resize((width, height), Image.Resampling.LANCZOS)
    else:
        bg = Image.new('RGB', (width, height), color=(18, 9, 4))

    # Dark overlay
    overlay = Image.new('RGBA', (width, height), color=(0, 0, 0, 0))
    draw_ov = ImageDraw.Draw(overlay)
    for x in range(width):
        alpha = int(220 + 20 * (x / width)) if x > 600 else 235
        draw_ov.line([(x, 0), (x, height)], fill=(12, 6, 3, alpha))
    for y in range(height - 120, height):
        draw_ov.line([(0, y), (width, y)], fill=(9, 4, 2, 200))

    im = Image.alpha_composite(bg.convert('RGBA'), overlay).convert('RGBA')

    # Paste protagonist illustration on right if available
    if os.path.exists(protagonist_png):
        protag = Image.open(protagonist_png).convert('RGBA')
        protag.thumbnail((440, 440), Image.Resampling.LANCZOS)
        # Center vertically on right
        px = width - protag.width - 70
        py = (height - protag.height) // 2
        im.paste(protag, (px, py), protag)

    im = im.convert('RGB')
    draw = ImageDraw.Draw(im)

    space_path = 'assets/fonts/SpaceGrotesk.ttf'
    caveat_path = 'assets/fonts/Caveat.ttf'

    font_brand = ImageFont.truetype(space_path, 22) if os.path.exists(space_path) else ImageFont.load_default()
    font_title = ImageFont.truetype(space_path, 52) if os.path.exists(space_path) else ImageFont.load_default()
    font_script = ImageFont.truetype(caveat_path, 60) if os.path.exists(caveat_path) else ImageFont.load_default()
    font_sub = ImageFont.truetype(space_path, 21) if os.path.exists(space_path) else ImageFont.load_default()
    font_pill = ImageFont.truetype(space_path, 19) if os.path.exists(space_path) else ImageFont.load_default()

    # Brand badge
    draw.rounded_rectangle([65, 65, 395, 110], radius=22, fill=(28, 14, 7, 230), outline=accent_rgb, width=2)
    draw.text((85, 75), f"NORATO · {flavor_key.upper()}", fill=(255, 246, 229), font=font_brand)

    # Title
    draw.text((65, 150), title, fill=(255, 246, 229), font=font_title)

    # Script subtitle
    draw.text((65, 225), subtitle, fill=accent_rgb, font=font_script)

    # Presentation Badge
    pres_y = 330
    draw.rounded_rectangle([65, pres_y, 480, pres_y + 48], radius=24, fill=accent_rgb, outline=(255, 255, 255), width=2)
    draw.text((85, pres_y + 12), "PRESENTACIÓN 450 g · AL VACÍO", fill=(255, 255, 255), font=font_pill)

    # Note
    draw.text((65, 420), "Salchichón artesanal ahumado lentamente con leña de roble.", fill=(216, 207, 195), font=font_sub)
    draw.text((65, 452), "Lotes limitados elaborados a mano en Bogotá, Colombia.", fill=(185, 175, 160), font=font_sub)
    draw.text((65, 520), "Pedidos por WhatsApp: 318 274 5713", fill=(242, 167, 27), font=font_sub)

    # Border
    draw.rectangle([0, 0, width - 1, height - 1], outline=accent_rgb, width=4)

    out_path = f'assets/og-{flavor_key}.jpg'
    im.save(out_path, 'JPEG', quality=85, optimize=True, progressive=True)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"Generated {out_path}: {size_kb:.1f} KB")

if __name__ == '__main__':
    create_main_og()
    create_flavor_og('picante', 'Picante con Ají', 'Carácter y Fuego en tu mesa', (226, 72, 43), 'assets/photo_4_2026-11-07_20-51-27.jpg', 'assets/protagonistas/picante-protagonista.png')
    create_flavor_og('jamonado', 'Jamonado Clásico', 'Sabor Noble, Pausado y Suave', (142, 68, 173), 'assets/photo_5_2026-11-07_20-51-27.jpg', 'assets/protagonistas/jamonado-protagonista.png')
    create_flavor_og('cervecero', 'Cervecero Ahumado', 'Madurado con Leña de Roble', (216, 121, 22), 'assets/photo_1_2026-11-07_20-51-27.jpg', 'assets/protagonistas/cervecero-protagonista.png')
