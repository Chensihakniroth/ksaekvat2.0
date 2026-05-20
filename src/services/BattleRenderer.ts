import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import AnimalService from './AnimalService';
import type { BattlePokemon } from './PokemonBattleService';

/**
 * 🎨 BATTLE RENDERER — OWO-Style Card Layout
 * Each row: [Player Sprite][Player HP][···gap···][Enemy HP][Enemy Sprite]
 * No text overlays. Battle log goes in Discord embed.
 */
class BattleRenderer {
  private readonly BG_PATH = path.join(process.cwd(), 'assets', 'battle_bg.png');
  private readonly W = 800;
  private readonly H = 400;
  private readonly SPRITE = 80;
  private readonly CARD_H = 105;
  private readonly CARD_W = 780;
  private readonly CARD_X = 10;
  private readonly ROW_GAP = 12;
  private readonly BAR_W = 160;
  private readonly BAR_H = 10;

  public async renderFrame(
    teamA: BattlePokemon[],
    teamB: BattlePokemon[],
    hpOverrides?: { teamA: { id: string; hp: number; maxHp: number }[]; teamB: { id: string; hp: number; maxHp: number }[] }
  ): Promise<Buffer> {
    // Background
    let base: sharp.Sharp;
    if (fs.existsSync(this.BG_PATH)) {
      base = sharp(this.BG_PATH).resize(this.W, this.H);
    } else {
      base = sharp({ create: { width: this.W, height: this.H, channels: 4, background: { r: 15, g: 15, b: 30, alpha: 1 } } });
    }

    const composites: any[] = [];
    const totalH = this.CARD_H * 3 + this.ROW_GAP * 2;
    const startY = Math.floor((this.H - totalH) / 2);

    // Build ONE SVG for all cards + bars + text
    let svg = '';
    for (let i = 0; i < 3; i++) {
      const ry = startY + i * (this.CARD_H + this.ROW_GAP);
      const pA = i < teamA.length ? teamA[i] : null;
      const pB = i < teamB.length ? teamB[i] : null;

      // Card background
      svg += `<rect x="${this.CARD_X}" y="${ry}" width="${this.CARD_W}" height="${this.CARD_H}" fill="rgba(0,0,0,0.55)" rx="8" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>`;

      const cy = ry + Math.floor(this.CARD_H / 2); // vertical center

      // Left side stats (Team A) — anchored right of sprite
      if (pA) {
        const sx = this.CARD_X + this.SPRITE + 20;
        const ov = hpOverrides?.teamA.find(o => o.id === pA.id);
        svg += this.statsBlock(pA, sx, cy, 'left', ov);
      }

      // Right side stats (Team B) — anchored left of sprite
      if (pB) {
        const sx = this.CARD_X + this.CARD_W - this.SPRITE - 20;
        const ov = hpOverrides?.teamB.find(o => o.id === pB.id);
        svg += this.statsBlock(pB, sx, cy, 'right', ov);
      }
    }

    composites.push({
      input: Buffer.from(`<svg width="${this.W}" height="${this.H}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`),
      top: 0, left: 0,
    });

    // Composite sprites
    for (let i = 0; i < 3; i++) {
      const ry = startY + i * (this.CARD_H + this.ROW_GAP);
      const sy = ry + Math.floor((this.CARD_H - this.SPRITE) / 2);

      if (i < teamA.length) {
        const sp = await this.getSprite(teamA[i].speciesKey, teamA[i].hp <= 0);
        if (sp) composites.push({ input: sp, top: sy, left: this.CARD_X + 8 });
      }
      if (i < teamB.length) {
        const sp = await this.getSprite(teamB[i].speciesKey, teamB[i].hp <= 0, true);
        if (sp) composites.push({ input: sp, top: sy, left: this.CARD_X + this.CARD_W - this.SPRITE - 8 });
      }
    }

    return await base.composite(composites).png().toBuffer();
  }

  private statsBlock(p: BattlePokemon, ax: number, cy: number, side: 'left' | 'right', hpOv?: { hp: number; maxHp: number }): string {
    const currentHp = hpOv ? hpOv.hp : p.hp;
    const maxHp = hpOv ? hpOv.maxHp : p.maxHp;
    const pct = Math.max(0, currentHp / maxHp);
    const col = pct > 0.5 ? '#22c55e' : pct > 0.2 ? '#eab308' : '#ef4444';
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const name = esc(`${p.name.toUpperCase()} Lv.${p.level}`);
    const hp = esc(`${Math.max(0, currentHp)}/${maxHp}`);
    let s = '';

    if (side === 'left') {
      s += `<text x="${ax}" y="${cy - 12}" font-family="Arial,sans-serif" font-weight="bold" font-size="13" fill="white">${name}</text>`;
      s += `<rect x="${ax}" y="${cy}" width="${this.BAR_W}" height="${this.BAR_H}" fill="#1a1a2e" rx="4"/>`;
      s += `<rect x="${ax}" y="${cy}" width="${this.BAR_W * pct}" height="${this.BAR_H}" fill="${col}" rx="4"/>`;
      s += `<text x="${ax}" y="${cy + 24}" font-family="Arial,sans-serif" font-size="11" fill="#bbb">${hp}</text>`;
    } else {
      s += `<text x="${ax}" y="${cy - 12}" font-family="Arial,sans-serif" font-weight="bold" font-size="13" fill="white" text-anchor="end">${name}</text>`;
      s += `<rect x="${ax - this.BAR_W}" y="${cy}" width="${this.BAR_W}" height="${this.BAR_H}" fill="#1a1a2e" rx="4"/>`;
      s += `<rect x="${ax - this.BAR_W}" y="${cy}" width="${this.BAR_W * pct}" height="${this.BAR_H}" fill="${col}" rx="4"/>`;
      s += `<text x="${ax}" y="${cy + 24}" font-family="Arial,sans-serif" font-size="11" fill="#bbb" text-anchor="end">${hp}</text>`;
    }
    return s;
  }

  private async getSprite(key: string, fainted: boolean, flip = false): Promise<Buffer | null> {
    const buf = await AnimalService.getPokemonSpriteBuffer(key);
    if (!buf) return null;
    let s = sharp(buf).resize(this.SPRITE, this.SPRITE, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    if (flip) s = s.flop();
    if (fainted) s = s.grayscale().modulate({ brightness: 0.4 });
    return s.toBuffer();
  }
}

const instance = new BattleRenderer();
export default instance;
