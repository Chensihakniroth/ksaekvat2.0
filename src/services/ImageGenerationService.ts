import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import Jimp from 'jimp';

const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export class ImageGenerationService {
  /**
   * Checks magic bytes to confirm a buffer contains a supported image format.
   * Prevents Sharp from crashing on HTML error pages or other non-image data.
   */
  static isValidImageBuffer(buf: Buffer): boolean {
    if (!buf || buf.length < 12) return false;
    // PNG: 89 50 4E 47
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
    // JPEG: FF D8 FF
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;
    // GIF: 47 49 46 38
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
    return false;
  }

  static createGridBgRaw(width: number, height: number): Buffer {
    const buf = Buffer.alloc(width * height * 4);
    const bgColor = [18, 19, 24]; // #121318
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = bgColor[0], g = bgColor[1], b = bgColor[2], alpha = 255;

        const dx = x - width / 2; const dy = y - height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = (width > height ? width : height) * 0.7;
        let light = 1 - (dist / maxDist);
        if (light < 0) light = 0;

        r += light * 24; g += light * 26; b += light * 34;
        if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;

        if (x % 40 === 0 || y % 40 === 0) {
          r = r * 0.9 + 255 * 0.1; g = g * 0.9 + 255 * 0.1; b = b * 0.9 + 255 * 0.1;
        }
        const idx = (y * width + x) * 4;
        buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b; buf[idx + 3] = alpha;
      }
    }
    return buf;
  }

  static createCardMaskRaw(width: number, height: number, radius: number): Buffer {
    const buf = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let alpha = 255;
        if (x < radius && y < radius) {
          const dx = radius - x; const dy = radius - y;
          if (dx * dx + dy * dy > radius * radius) alpha = 0;
        } else if (x >= width - radius && y < radius) {
          const dx = x - (width - radius) + 1; const dy = radius - y;
          if (dx * dx + dy * dy > radius * radius) alpha = 0;
        } else if (x < radius && y >= height - radius) {
          const dx = radius - x; const dy = y - (height - radius) + 1;
          if (dx * dx + dy * dy > radius * radius) alpha = 0;
        } else if (x >= width - radius && y >= height - radius) {
          const dx = x - (width - radius) + 1; const dy = y - (height - radius) + 1;
          if (dx * dx + dy * dy > radius * radius) alpha = 0;
        }
        const idx = (y * width + x) * 4;
        buf[idx] = 255; buf[idx + 1] = 255; buf[idx + 2] = 255; buf[idx + 3] = alpha;
      }
    }
    return buf;
  }

  static createCardGradientRaw(width: number, height: number, rColors: string[]): Buffer {
    const buf = Buffer.alloc(width * height * 4);
    const rr = parseInt(rColors[0].substring(1, 3), 16) || 200;
    const gg = parseInt(rColors[0].substring(3, 5), 16) || 150;
    const bb = parseInt(rColors[0].substring(5, 7), 16) || 200;

    const rr2 = parseInt(rColors[1].substring(1, 3), 16) || 100;
    const gg2 = parseInt(rColors[1].substring(3, 5), 16) || 100;
    const bb2 = parseInt(rColors[1].substring(5, 7), 16) || 100;

    for (let y = 0; y < height; y++) {
      const fadeYStart = height * 0.4;
      let fadeAlpha = 0;
      if (y > fadeYStart) {
        fadeAlpha = (y - fadeYStart) / (height - fadeYStart);
      }

      const t = y / height;
      const br = Math.floor(rr * (1 - t) + rr2 * t);
      const bg = Math.floor(gg * (1 - t) + gg2 * t);
      const bb_ = Math.floor(bb * (1 - t) + bb2 * t);

      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = Math.floor(fadeAlpha * 255);

        if (y < 40 && x < (140 - y)) {
          const glowAlpha = 1 - (x / 140);
          const finalA = Math.floor(glowAlpha * 0.75 * 255);
          if (finalA > a) { r = rr; g = gg; b = bb; a = finalA; }
        }

        if (x < 3 || x >= width - 3 || y < 3 || y >= height - 3) {
          r = br; g = bg; b = bb_; a = 230;
        }

        const idx = (y * width + x) * 4;
        buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b; buf[idx + 3] = a;
      }
    }
    return buf;
  }

  static createEmptySlotRaw(width: number, height: number): Buffer {
    const buf = Buffer.alloc(width * height * 4);
    const bgColor = [24, 26, 32];
    const dashColor = [51, 55, 69];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = bgColor[0], g = bgColor[1], b = bgColor[2], alpha = 125;
        const rx = width / 2;
        const ry = height / 2;
        const borderDist = 4;
        const onBorderX = (x >= borderDist && x <= borderDist + 3) || (x >= width - borderDist - 4 && x <= width - borderDist - 1);
        const onBorderY = (y >= borderDist && y <= borderDist + 3) || (y >= height - borderDist - 4 && y <= height - borderDist - 1);

        if ((onBorderX && (y % 24 < 12)) || (onBorderY && (x % 24 < 12)) || (onBorderX && onBorderY)) {
          r = dashColor[0]; g = dashColor[1]; b = dashColor[2]; alpha = 255;
        }

        const dx = Math.abs(x - rx);
        const dy = Math.abs(y - ry);
        if ((dx <= 20 && dy <= 2) || (dy <= 20 && dx <= 2)) {
          r = dashColor[0]; g = dashColor[1]; b = dashColor[2]; alpha = 255;
        }

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= 14 && dist <= 18) {
          r = dashColor[0]; g = dashColor[1]; b = dashColor[2]; alpha = 255;
        }

        const idx = (y * width + x) * 4;
        buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b; buf[idx + 3] = alpha;
      }
    }
    return buf;
  }

  static async createTeamImage(userData: any, teamCharacters: any[]): Promise<string | null> {
    const cardWidth = 280;
    const cardHeight = 420;
    const padding = 25;
    const cols = 4;

    const headerHeight = 100;
    const canvasWidth = padding + cols * (cardWidth + padding);
    const canvasHeight = headerHeight + cardHeight + padding * 2;

    try {
      const composites: sharp.OverlayOptions[] = [];

      const rawBgArray = this.createGridBgRaw(canvasWidth, canvasHeight);
      const bgBuffer = await sharp(rawBgArray, { raw: { width: canvasWidth, height: canvasHeight, channels: 4 } }).png().toBuffer();
      composites.push({ input: bgBuffer, top: 0, left: 0 });

      try {
        const textUrl = `https://placehold.co/${canvasWidth}x${headerHeight}/000000/FFFFFF/png?text=BATTLE+TEAM&font=Rajdhani`;
        const textRes = await axios.get(textUrl, { responseType: 'arraybuffer' });
        const textBuffer = Buffer.from(textRes.data);
        composites.push({ input: textBuffer, top: 0, left: 0, blend: 'screen' });
      } catch (textErr: any) {
        console.error("Text generation error:", textErr.message);
      }

      const rarityColors: any = { 5: '#FFD700', 4: '#B366FF', 3: '#4DA6FF' };
      const rarityGradients: any = { 5: ['#FFF0B3', '#D4AF37'], 4: ['#D9B3FF', '#8A2BE2'], 3: ['#B3D9FF', '#1E90FF'] };

      for (let i = 0; i < 4; i++) {
        const x = padding + i * (cardWidth + padding);
        const y = headerHeight + padding;

        let charName = null;
        if (userData && userData.team && userData.team.length > i) charName = userData.team[i];
        const item = charName && teamCharacters ? teamCharacters.find((c: any) => c.name === charName) : null;

        let slotBuffer: Buffer;
        const rawMaskArray = this.createCardMaskRaw(cardWidth, cardHeight, 24);
        const cardMaskBuffer = await sharp(rawMaskArray, { raw: { width: cardWidth, height: cardHeight, channels: 4 } }).png().toBuffer();

        if (item) {
          try {
            let imageUrl = item.image_url;
            const game = item.game?.toLowerCase();
            let imageBuffer: Buffer | null = null;
            let useCover = ['genshin', 'wuwa'].includes(game);

            if (game === 'genshin') {
              let apiId = item.name.toLowerCase().trim().replace(/ /g, '-');
              const genshinOverrides: any = { 'kamisato-ayato': 'ayato', 'kamisato-ayaka': 'ayaka', 'sangonomiya-kokomi': 'kokomi', 'kaedehara-kazuha': 'kazuha', 'shikanoin-heizou': 'heizou', 'kuki-shinobu': 'shinobu', 'kujou-sara': 'sara', 'arataki-itto': 'itto', 'tartaglia': 'childe' };
              if (genshinOverrides[apiId]) apiId = genshinOverrides[apiId];
              imageUrl = `https://genshin.jmp.blue/characters/${apiId}/icon-big`;
              try {
                const jmpRes = await axios.get(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, responseType: 'arraybuffer', timeout: 8000 });
                const jmpBuf = Buffer.from(jmpRes.data);
                if (jmpRes.headers['content-type']?.includes('image/') && this.isValidImageBuffer(jmpBuf)) imageBuffer = jmpBuf;
                else throw new Error('invalid format');
              } catch (e: any) {
                const fileName = `File:${item.name.trim()} Icon.png`;
                const apiUrl = `https://genshin-impact.fandom.com/api.php?action=query&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
                const res = await axios.get(apiUrl, { timeout: 8000 });
                const pageId = Object.keys(res.data.query.pages)[0];
                if (pageId !== '-1' && res.data.query.pages[pageId].imageinfo) {
                  const wikiRes = await axios.get(res.data.query.pages[pageId].imageinfo[0].url, { responseType: 'arraybuffer', timeout: 8000 });
                  const wikiBuf = Buffer.from(wikiRes.data);
                  if (this.isValidImageBuffer(wikiBuf)) imageBuffer = wikiBuf;
                }
              }
              useCover = false;
            } else if (game === 'hsr') {
               try {
                  const fileName = `File:Character ${item.name.trim()} Icon.png`;
                  const apiUrl = `https://honkai-star-rail.fandom.com/api.php?action=query&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
                  const res = await axios.get(apiUrl, { timeout: 8000 });
                  const pageId = Object.keys(res.data.query.pages)[0];
                  if (pageId !== '-1') {
                    const wikiRes = await axios.get(res.data.query.pages[pageId].imageinfo[0].url, { responseType: 'arraybuffer', timeout: 8000 });
                    imageBuffer = Buffer.from(wikiRes.data);
                  }
               } catch (e) {}
               useCover = false;
            } else if (game === 'wuwa') {
               try {
                  const fileName = `File:Resonator ${item.name.trim()}.png`;
                  const apiUrl = `https://wutheringwaves.fandom.com/api.php?action=query&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
                  const res = await axios.get(apiUrl, { timeout: 8000 });
                  const pageId = Object.keys(res.data.query.pages)[0];
                  if (pageId !== '-1') {
                    const wikiRes = await axios.get(res.data.query.pages[pageId].imageinfo[0].url, { responseType: 'arraybuffer', timeout: 8000 });
                    imageBuffer = Buffer.from(wikiRes.data);
                  }
               } catch(e) {}
               useCover = false;
            } else if (game === 'zzz') {
               try {
                  const fileName = `File:Agent ${item.name.trim()} Icon.png`;
                  const apiUrl = `https://zenless-zone-zero.fandom.com/api.php?action=query&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
                  const res = await axios.get(apiUrl, { timeout: 8000 });
                  const pageId = Object.keys(res.data.query.pages)[0];
                  if (pageId !== '-1') {
                    const wikiRes = await axios.get(res.data.query.pages[pageId].imageinfo[0].url, { responseType: 'arraybuffer', timeout: 8000 });
                    imageBuffer = Buffer.from(wikiRes.data);
                  }
               } catch(e) {}
               useCover = false;
            }

            if (!imageBuffer && imageUrl) {
              const fallbackRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 8000 });
              imageBuffer = Buffer.from(fallbackRes.data);
            }

            if (!imageBuffer) throw new Error("Could not acquire image");

            const rGrad = rarityGradients[item.rarity] || ['#777', '#444'];
            const cardBg = await sharp({ create: { width: cardWidth, height: cardHeight, channels: 4, background: '#181a20' } }).png().toBuffer();
            let charLayer = sharp(imageBuffer).resize(cardWidth, cardHeight, { fit: useCover ? 'cover' : 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
            
            const rawGradientArray = this.createCardGradientRaw(cardWidth, cardHeight, rGrad);
            const gradientBg = await sharp(rawGradientArray, { raw: { width: cardWidth, height: cardHeight, channels: 4 } }).png().toBuffer();

            let slotBaseBuffer = await sharp(cardBg)
              .composite([ { input: await charLayer.png().toBuffer(), blend: 'over' }, { input: gradientBg, blend: 'over' } ])
              .png().toBuffer();

            slotBuffer = await sharp(slotBaseBuffer)
              .composite([{ input: cardMaskBuffer, blend: 'dest-in' }])
              .png().toBuffer();

          } catch (err: any) {
            console.error(`Error generating card for ${item?.name || 'Unknown'}:`, err.message);
            slotBuffer = await sharp({ create: { width: cardWidth, height: cardHeight, channels: 4, background: '#ff0000' } }).png().toBuffer();
          }
        } else {
          const emptyRawArray = this.createEmptySlotRaw(cardWidth, cardHeight);
          const emptyBaseBuffer = await sharp(emptyRawArray, { raw: { width: cardWidth, height: cardHeight, channels: 4 } }).png().toBuffer();

          slotBuffer = await sharp({ create: { width: cardWidth, height: cardHeight, channels: 4, background: '#181a20' } })
            .composite([ { input: emptyBaseBuffer, blend: 'over' }, { input: cardMaskBuffer, blend: 'dest-in' } ])
            .png().toBuffer();
        }

        composites.push({ input: slotBuffer, top: y, left: x });
      }

      const outputPath = path.join(TEMP_DIR, `team-banner-${Date.now()}.png`);
      await sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite(composites)
        .png().toFile(outputPath);
      return outputPath;
    } catch (globalErr) {
      console.error('CRITICAL GENERATOR ERROR:', globalErr);
      return null;
    }
  }
}
