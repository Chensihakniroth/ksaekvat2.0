"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const AnimalService_1 = __importDefault(require("./AnimalService"));
// ─── TYPE COLOR MAP ──────────────────────────────────────────────────
const TYPE_COLORS = {
    normal: { primary: '#a8a878', secondary: '#6d6d4e', glow: 'rgba(168,168,120,0.3)' },
    fire: { primary: '#f08030', secondary: '#9c531f', glow: 'rgba(240,128,48,0.4)' },
    water: { primary: '#6890f0', secondary: '#445e9c', glow: 'rgba(104,144,240,0.4)' },
    grass: { primary: '#78c850', secondary: '#4e8234', glow: 'rgba(120,200,80,0.4)' },
    electric: { primary: '#f8d030', secondary: '#a1871f', glow: 'rgba(248,208,48,0.4)' },
    ice: { primary: '#98d8d8', secondary: '#638d8d', glow: 'rgba(152,216,216,0.4)' },
    fighting: { primary: '#c03028', secondary: '#7d1f1a', glow: 'rgba(192,48,40,0.4)' },
    poison: { primary: '#a040a0', secondary: '#682a68', glow: 'rgba(160,64,160,0.4)' },
    ground: { primary: '#e0c068', secondary: '#927d44', glow: 'rgba(224,192,104,0.4)' },
    flying: { primary: '#a890f0', secondary: '#6d5e9c', glow: 'rgba(168,144,240,0.4)' },
    psychic: { primary: '#f85888', secondary: '#a13959', glow: 'rgba(248,88,136,0.4)' },
    bug: { primary: '#a8b820', secondary: '#6d7815', glow: 'rgba(168,184,32,0.4)' },
    rock: { primary: '#b8a038', secondary: '#786824', glow: 'rgba(184,160,56,0.4)' },
    ghost: { primary: '#705898', secondary: '#493963', glow: 'rgba(112,88,152,0.4)' },
    dragon: { primary: '#7038f8', secondary: '#4924a1', glow: 'rgba(112,56,248,0.4)' },
    dark: { primary: '#705848', secondary: '#49392f', glow: 'rgba(112,88,72,0.4)' },
    steel: { primary: '#b8b8d0', secondary: '#787887', glow: 'rgba(184,184,208,0.4)' },
    fairy: { primary: '#ee99ac', secondary: '#9b6470', glow: 'rgba(238,153,172,0.4)' },
    bird: { primary: '#a890f0', secondary: '#6d5e9c', glow: 'rgba(168,144,240,0.4)' },
};
class TeamRenderer {
    W = 800;
    H = 320;
    CARD_W = 240;
    CARD_H = 260;
    SPRITE = 120;
    COLS = 3;
    /**
     * Render the active 3 Pokémon battle squad
     */
    async renderTeam(pokemon, statsMap, typesMap) {
        // ─── DARK GRADIENT BACKGROUND ──────────────────────────────────
        const bgSvg = `
      <svg width="${this.W}" height="${this.H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0a0e1a"/>
            <stop offset="50%" stop-color="#0f1628"/>
            <stop offset="100%" stop-color="#0a0e1a"/>
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="${this.W}" height="${this.H}" fill="url(#bg)"/>
        <rect width="${this.W}" height="${this.H}" fill="url(#grid)"/>
      </svg>`;
        let base = (0, sharp_1.default)(Buffer.from(bgSvg));
        const composites = [];
        // Calculate grid positioning — center the 3 columns horizontally
        const totalGridW = this.COLS * this.CARD_W + (this.COLS - 1) * 16;
        const offsetX = Math.floor((this.W - totalGridW) / 2);
        const offsetY = Math.floor((this.H - this.CARD_H) / 2) + 15; // Shift down slightly for title
        // ─── TITLE HEADER ────────────────────────────────────────────────
        let overlaySvg = '';
        overlaySvg += `<text x="${this.W / 2}" y="28" font-family="Arial,sans-serif" font-weight="bold" font-size="14" fill="rgba(255,255,255,0.4)" text-anchor="middle" letter-spacing="4">ACTIVE BATTLE TEAM</text>`;
        // ─── RENDER EACH CARD ────────────────────────────────────────────
        for (let i = 0; i < 3; i++) {
            const cx = offsetX + i * (this.CARD_W + 16);
            const cy = offsetY;
            const p = i < pokemon.length ? pokemon[i] : null;
            if (p) {
                const pTypes = typesMap.get(p._id.toString()) || [];
                const primaryType = pTypes[0] || 'normal';
                const tc = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;
                const pStats = statsMap.get(p._id.toString()) || { hp: 0, atk: 0, def: 0, speed: 0 };
                // ── Card Background with type accent glow ──
                const glowId = `glow_${i}`;
                overlaySvg += `
          <defs>
            <filter id="${glowId}" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feFlood flood-color="${tc.primary}" flood-opacity="0.3" result="color"/>
              <feComposite in="color" in2="blur" operator="in" result="glow"/>
              <feMerge>
                <feMergeNode in="glow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect x="${cx}" y="${cy}" width="${this.CARD_W}" height="${this.CARD_H}" 
                fill="rgba(15,20,35,0.85)" rx="12"
                stroke="rgba(255,255,255,0.1)" stroke-width="1.5" filter="url(#${glowId})"/>`;
                // ── Type accent strip at top of card ──
                overlaySvg += `
          <rect x="${cx}" y="${cy}" width="${this.CARD_W}" height="4" 
                fill="${tc.primary}" rx="12"/>
          <rect x="${cx}" y="${cy}" width="${this.CARD_W}" height="12" 
                fill="${tc.primary}" rx="12"/>
          <rect x="${cx}" y="${cy + 6}" width="${this.CARD_W}" height="6" 
                fill="rgba(15,20,35,0.85)"/>`;
                // ── Pokémon Name ──
                const name = p.speciesKey.charAt(0).toUpperCase() + p.speciesKey.slice(1);
                overlaySvg += `
          <text x="${cx + this.CARD_W / 2}" y="${cy + 148}" 
                font-family="Arial,sans-serif" font-weight="bold" font-size="15" 
                fill="white" text-anchor="middle">${this.escXml(name)}</text>`;
                // ── Level Badge ──
                const lvlText = `Lv.${p.level}`;
                const badgeX = cx + this.CARD_W / 2;
                const badgeY = cy + 172;
                const badgeW = 46;
                const badgeH = 18;
                overlaySvg += `
          <rect x="${badgeX - badgeW / 2}" y="${badgeY - 13}" width="${badgeW}" height="${badgeH}" 
                fill="${tc.primary}" rx="9" opacity="0.95"/>
          <text x="${badgeX}" y="${badgeY}" 
                font-family="Arial,sans-serif" font-weight="bold" font-size="10" 
                fill="white" text-anchor="middle">${lvlText}</text>`;
                // ── Type Tags ──
                if (pTypes.length > 0) {
                    const tagY = badgeY + 14;
                    const totalTagW = pTypes.length * 44 + (pTypes.length - 1) * 4;
                    let tagStartX = cx + (this.CARD_W - totalTagW) / 2;
                    for (const t of pTypes) {
                        const ttc = TYPE_COLORS[t] || TYPE_COLORS.normal;
                        const typeName = t.charAt(0).toUpperCase() + t.slice(1);
                        overlaySvg += `
              <rect x="${tagStartX}" y="${tagY}" width="44" height="14" 
                    fill="${ttc.primary}" rx="7" opacity="0.85"/>
              <text x="${tagStartX + 22}" y="${tagY + 10}" 
                    font-family="Arial,sans-serif" font-size="8" font-weight="bold"
                    fill="white" text-anchor="middle">${typeName}</text>`;
                        tagStartX += 48;
                    }
                }
                // ── Stats Display Grid (HP, ATK, DEF, SPD) ──
                const statsY = cy + 222;
                const statLabels = ['HP', 'ATK', 'DEF', 'SPD'];
                const statValues = [pStats.hp, pStats.atk, pStats.def, pStats.speed];
                const colW = this.CARD_W / 4;
                for (let s = 0; s < 4; s++) {
                    const sx = cx + s * colW + colW / 2;
                    overlaySvg += `
            <text x="${sx}" y="${statsY}" 
                  font-family="Arial,sans-serif" font-size="9" font-weight="bold" 
                  fill="rgba(255,255,255,0.4)" text-anchor="middle">${statLabels[s]}</text>
            <text x="${sx}" y="${statsY + 16}" 
                  font-family="Arial,sans-serif" font-size="12" font-weight="bold" 
                  fill="white" text-anchor="middle">${statValues[s]}</text>`;
                }
                // ── Sprite composite ──
                const spriteBuf = await AnimalService_1.default.getPokemonSpriteBuffer(p.speciesKey);
                if (spriteBuf) {
                    const resized = await (0, sharp_1.default)(spriteBuf)
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
            else {
                // Empty slot card
                overlaySvg += `
          <rect x="${cx}" y="${cy}" width="${this.CARD_W}" height="${this.CARD_H}" 
                fill="rgba(15,20,35,0.4)" rx="12"
                stroke="rgba(255,255,255,0.05)" stroke-width="1.5" stroke-dasharray="8 4"/>
          <text x="${cx + this.CARD_W / 2}" y="${cy + this.CARD_H / 2 - 12}" 
                font-family="Arial,sans-serif" font-size="24" font-weight="bold"
                fill="rgba(255,255,255,0.03)" text-anchor="middle">SLOT ${i + 1}</text>
          <text x="${cx + this.CARD_W / 2}" y="${cy + this.CARD_H / 2 + 10}" 
                font-family="Arial,sans-serif" font-size="11" font-weight="bold"
                fill="rgba(255,255,255,0.15)" text-anchor="middle" letter-spacing="1">EMPTY</text>`;
            }
        }
        // ─── COMPOSITE EVERYTHING ────────────────────────────────────────
        composites.push({
            input: Buffer.from(`<svg width="${this.W}" height="${this.H}" xmlns="http://www.w3.org/2000/svg">${overlaySvg}</svg>`),
            top: 0,
            left: 0,
        });
        return await base.composite(composites).png().toBuffer();
    }
    escXml(s) {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
const instance = new TeamRenderer();
exports.default = instance;
