import sharp from 'sharp';
import AnimalService from './AnimalService';

/**
 * 🎨 BENCH RENDERER — Premium Pokémon Team Roster
 * Renders a visually stunning card grid showing trained Pokémon
 * with official artwork, type colors, and active team indicators.
 */

export interface BenchPokemon {
  _id: string | any;
  speciesKey: string;
  level: number;
  exp?: number;
}

// ─── TYPE COLOR MAP ──────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  normal:   { primary: '#a8a878', secondary: '#6d6d4e', glow: 'rgba(168,168,120,0.3)' },
  fire:     { primary: '#f08030', secondary: '#9c531f', glow: 'rgba(240,128,48,0.4)' },
  water:    { primary: '#6890f0', secondary: '#445e9c', glow: 'rgba(104,144,240,0.4)' },
  grass:    { primary: '#78c850', secondary: '#4e8234', glow: 'rgba(120,200,80,0.4)' },
  electric: { primary: '#f8d030', secondary: '#a1871f', glow: 'rgba(248,208,48,0.4)' },
  ice:      { primary: '#98d8d8', secondary: '#638d8d', glow: 'rgba(152,216,216,0.4)' },
  fighting: { primary: '#c03028', secondary: '#7d1f1a', glow: 'rgba(192,48,40,0.4)' },
  poison:   { primary: '#a040a0', secondary: '#682a68', glow: 'rgba(160,64,160,0.4)' },
  ground:   { primary: '#e0c068', secondary: '#927d44', glow: 'rgba(224,192,104,0.4)' },
  flying:   { primary: '#a890f0', secondary: '#6d5e9c', glow: 'rgba(168,144,240,0.4)' },
  psychic:  { primary: '#f85888', secondary: '#a13959', glow: 'rgba(248,88,136,0.4)' },
  bug:      { primary: '#a8b820', secondary: '#6d7815', glow: 'rgba(168,184,32,0.4)' },
  rock:     { primary: '#b8a038', secondary: '#786824', glow: 'rgba(184,160,56,0.4)' },
  ghost:    { primary: '#705898', secondary: '#493963', glow: 'rgba(112,88,152,0.4)' },
  dragon:   { primary: '#7038f8', secondary: '#4924a1', glow: 'rgba(112,56,248,0.4)' },
  dark:     { primary: '#705848', secondary: '#49392f', glow: 'rgba(112,88,72,0.4)' },
  steel:    { primary: '#b8b8d0', secondary: '#787887', glow: 'rgba(184,184,208,0.4)' },
  fairy:    { primary: '#ee99ac', secondary: '#9b6470', glow: 'rgba(238,153,172,0.4)' },
  bird:     { primary: '#a890f0', secondary: '#6d5e9c', glow: 'rgba(168,144,240,0.4)' },
};

class BenchRenderer {
  private readonly W = 800;
  private readonly H = 480;
  private readonly CARD_W = 240;
  private readonly CARD_H = 200;
  private readonly SPRITE = 120;
  private readonly COLS = 3;
  private readonly ROWS = 2;

  /**
   * Render a paginated view of up to 6 trained Pokémon as premium cards
   */
  public async renderPage(
    pokemon: BenchPokemon[],
    teamIds: Set<string>,
    types?: Map<string, string[]>
  ): Promise<Buffer> {
    // ─── DARK GRADIENT BACKGROUND ──────────────────────────────────
    const bgSvg = `
      <svg width="${this.W}" height="${this.H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0a0e1a"/>
            <stop offset="50%" stop-color="#0f1628"/>
            <stop offset="100%" stop-color="#0a0e1a"/>
          </linearGradient>
          <!-- Subtle grid pattern -->
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="${this.W}" height="${this.H}" fill="url(#bg)"/>
        <rect width="${this.W}" height="${this.H}" fill="url(#grid)"/>
      </svg>`;

    let base = sharp(Buffer.from(bgSvg));

    const composites: sharp.OverlayOptions[] = [];

    // Calculate grid positioning — center everything
    const totalGridW = this.COLS * this.CARD_W + (this.COLS - 1) * 16;
    const totalGridH = this.ROWS * this.CARD_H + (this.ROWS - 1) * 16;
    const offsetX = Math.floor((this.W - totalGridW) / 2);
    const offsetY = Math.floor((this.H - totalGridH) / 2) + 20; // +20 for title area

    // ─── TITLE HEADER ────────────────────────────────────────────────
    let overlaySvg = '';
    overlaySvg += `<text x="${this.W / 2}" y="30" font-family="Arial,sans-serif" font-weight="bold" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="middle" letter-spacing="4">TRAINED  ROSTER</text>`;

    // ─── RENDER EACH CARD ────────────────────────────────────────────
    for (let i = 0; i < pokemon.length && i < 6; i++) {
      const p = pokemon[i];
      const col = i % this.COLS;
      const row = Math.floor(i / this.COLS);

      const cx = offsetX + col * (this.CARD_W + 16);
      const cy = offsetY + row * (this.CARD_H + 16);

      const inTeam = teamIds.has(p._id.toString());
      const pTypes = types?.get(p._id.toString()) || [];
      const primaryType = pTypes[0] || 'normal';
      const tc = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;

      // ── Card Background ──
      const cardId = `card_${i}`;
      const glowId = `glow_${i}`;

      if (inTeam) {
        // Active team: golden glow border
        overlaySvg += `
          <defs>
            <filter id="${glowId}" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feFlood flood-color="#eab308" flood-opacity="0.5" result="color"/>
              <feComposite in="color" in2="blur" operator="in" result="glow"/>
              <feMerge>
                <feMergeNode in="glow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect x="${cx}" y="${cy}" width="${this.CARD_W}" height="${this.CARD_H}" 
                fill="rgba(234,179,8,0.08)" rx="12"
                stroke="#eab308" stroke-width="2" filter="url(#${glowId})"/>`;
      } else {
        // Normal card: type-tinted glassmorphism
        overlaySvg += `
          <rect x="${cx}" y="${cy}" width="${this.CARD_W}" height="${this.CARD_H}" 
                fill="rgba(15,20,35,0.85)" rx="12"
                stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
      }

      // ── Type accent strip at top of card ──
      overlaySvg += `
        <rect x="${cx}" y="${cy}" width="${this.CARD_W}" height="4" 
              fill="${tc.primary}" rx="12"/>
        <rect x="${cx}" y="${cy}" width="${this.CARD_W}" height="12" 
              fill="${tc.primary}" rx="12"/>
        <rect x="${cx}" y="${cy + 8}" width="${this.CARD_W}" height="4" 
              fill="${tc.primary}" opacity="0"/>`;
      // Cover the bottom radius of the accent strip
      overlaySvg += `
        <rect x="${cx}" y="${cy + 6}" width="${this.CARD_W}" height="6" 
              fill="rgba(15,20,35,0.85)"/>`;

      // ── Pokémon Name ──
      const name = p.speciesKey.charAt(0).toUpperCase() + p.speciesKey.slice(1);
      const nameY = cy + this.SPRITE + 30;

      overlaySvg += `
        <text x="${cx + this.CARD_W / 2}" y="${nameY}" 
              font-family="Arial,sans-serif" font-weight="bold" font-size="16" 
              fill="white" text-anchor="middle">${this.escXml(name)}</text>`;

      // ── Level Badge ──
      const lvlText = `Lv.${p.level}`;
      const badgeX = cx + this.CARD_W / 2;
      const badgeY = nameY + 18;
      const badgeW = 50;
      const badgeH = 20;

      overlaySvg += `
        <rect x="${badgeX - badgeW / 2}" y="${badgeY - 14}" width="${badgeW}" height="${badgeH}" 
              fill="${tc.primary}" rx="10" opacity="0.9"/>
        <text x="${badgeX}" y="${badgeY}" 
              font-family="Arial,sans-serif" font-weight="bold" font-size="11" 
              fill="white" text-anchor="middle">${lvlText}</text>`;

      // ── Type Tags ──
      if (pTypes.length > 0) {
        const tagY = badgeY + 14;
        const totalTagW = pTypes.length * 50 + (pTypes.length - 1) * 4;
        let tagStartX = cx + (this.CARD_W - totalTagW) / 2;

        for (const t of pTypes) {
          const ttc = TYPE_COLORS[t] || TYPE_COLORS.normal;
          const typeName = t.charAt(0).toUpperCase() + t.slice(1);

          overlaySvg += `
            <rect x="${tagStartX}" y="${tagY}" width="50" height="16" 
                  fill="${ttc.primary}" rx="8" opacity="0.7"/>
            <text x="${tagStartX + 25}" y="${tagY + 12}" 
                  font-family="Arial,sans-serif" font-size="9" font-weight="bold"
                  fill="white" text-anchor="middle">${typeName}</text>`;
          tagStartX += 54;
        }
      }

      // ── Active Team Indicator ──
      if (inTeam) {
        overlaySvg += `
          <text x="${cx + this.CARD_W / 2}" y="${cy + this.CARD_H - 8}" 
                font-family="Arial,sans-serif" font-weight="bold" font-size="10" 
                fill="#eab308" text-anchor="middle" letter-spacing="2">⚔ ACTIVE</text>`;
      }

      // ── Sprite composite (done separately for proper alpha) ──
      const spriteBuf = await AnimalService.getPokemonSpriteBuffer(p.speciesKey);
      if (spriteBuf) {
        const resized = await sharp(spriteBuf)
          .resize(this.SPRITE, this.SPRITE, {
            kernel: 'nearest',
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toBuffer();

        composites.push({
          input: resized,
          top: cy + 14,
          left: cx + Math.floor((this.CARD_W - this.SPRITE) / 2),
        });
      }
    }

    // ── Empty slots ──
    for (let i = pokemon.length; i < 6; i++) {
      const col = i % this.COLS;
      const row = Math.floor(i / this.COLS);
      const cx = offsetX + col * (this.CARD_W + 16);
      const cy = offsetY + row * (this.CARD_H + 16);

      overlaySvg += `
        <rect x="${cx}" y="${cy}" width="${this.CARD_W}" height="${this.CARD_H}" 
              fill="rgba(15,20,35,0.4)" rx="12"
              stroke="rgba(255,255,255,0.04)" stroke-width="1" stroke-dasharray="8 4"/>
        <text x="${cx + this.CARD_W / 2}" y="${cy + this.CARD_H / 2 + 4}" 
              font-family="Arial,sans-serif" font-size="12" 
              fill="rgba(255,255,255,0.15)" text-anchor="middle">EMPTY</text>`;
    }

    // ─── COMPOSITE EVERYTHING ────────────────────────────────────────
    composites.push({
      input: Buffer.from(
        `<svg width="${this.W}" height="${this.H}" xmlns="http://www.w3.org/2000/svg">${overlaySvg}</svg>`
      ),
      top: 0,
      left: 0,
    });

    return await base.composite(composites).png().toBuffer();
  }

  private escXml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

const instance = new BenchRenderer();
export default instance;
