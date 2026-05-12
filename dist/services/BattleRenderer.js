"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const AnimalService_1 = __importDefault(require("./AnimalService"));
/**
 * 🎨 BATTLE RENDERER SERVICE
 * Generates dynamic 800x400 battle frames using Sharp + SVG.
 * Image contains ONLY: background, sprites, and HP plates.
 * Battle log text goes in the Discord embed, NOT in the image.
 */
class BattleRenderer {
    BG_PATH = path_1.default.join(process.cwd(), 'assets', 'battle_bg.png');
    WIDTH = 800;
    HEIGHT = 400;
    SPRITE_SIZE = 96;
    /**
     * Render a battle frame showing sprites and HP bars only.
     * No text overlays — battle log is handled by the Discord embed.
     */
    async renderFrame(teamA, teamB) {
        const composites = [];
        // 1. Background
        let base = (0, sharp_1.default)({
            create: {
                width: this.WIDTH,
                height: this.HEIGHT,
                channels: 4,
                background: { r: 10, g: 10, b: 25, alpha: 1 }
            }
        });
        if (fs_1.default.existsSync(this.BG_PATH)) {
            base = (0, sharp_1.default)(this.BG_PATH).resize(this.WIDTH, this.HEIGHT);
        }
        // 2. Layout — OWO-style: consistent columns, evenly spaced rows
        //    Each slot: sprite on top, HP plate directly below
        //    3 rows, centered vertically with padding
        const SPRITE = this.SPRITE_SIZE;
        const PLATE_H = 28;
        const SLOT_H = SPRITE + PLATE_H + 4; // sprite + gap + plate
        const TOTAL_H = SLOT_H * 3 + 20; // 3 slots + gaps between
        const START_Y = Math.floor((this.HEIGHT - TOTAL_H) / 2);
        const TEAM_A_X = 120; // center x for left team
        const TEAM_B_X = this.WIDTH - 120; // center x for right team
        // 3. Render each team
        for (let i = 0; i < 3; i++) {
            const rowY = START_Y + i * (SLOT_H + 10);
            // --- Team A (left) ---
            if (i < teamA.length) {
                const p = teamA[i];
                const sprite = await this.getSprite(p.speciesKey, p.hp <= 0);
                if (sprite) {
                    composites.push({
                        input: sprite,
                        top: rowY,
                        left: TEAM_A_X - Math.floor(SPRITE / 2),
                    });
                }
                // HP plate directly below sprite
                composites.push({
                    input: Buffer.from(this.generateHPPlate(p, TEAM_A_X, rowY + SPRITE + 2)),
                    top: 0,
                    left: 0,
                });
            }
            // --- Team B (right, flipped) ---
            if (i < teamB.length) {
                const p = teamB[i];
                const sprite = await this.getSprite(p.speciesKey, p.hp <= 0, true);
                if (sprite) {
                    composites.push({
                        input: sprite,
                        top: rowY,
                        left: TEAM_B_X - Math.floor(SPRITE / 2),
                    });
                }
                // HP plate directly below sprite
                composites.push({
                    input: Buffer.from(this.generateHPPlate(p, TEAM_B_X, rowY + SPRITE + 2)),
                    top: 0,
                    left: 0,
                });
            }
        }
        return await base.composite(composites).png().toBuffer();
    }
    async getSprite(key, isFainted, flip = false) {
        let buffer = await AnimalService_1.default.getPokemonSpriteBuffer(key);
        if (!buffer)
            return null;
        let s = (0, sharp_1.default)(buffer).resize(this.SPRITE_SIZE, this.SPRITE_SIZE, {
            kernel: 'nearest',
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        });
        if (flip)
            s = s.flop();
        if (isFainted)
            s = s.grayscale().modulate({ brightness: 0.4 });
        return await s.toBuffer();
    }
    /**
     * Generates a compact HP plate: [NAME Lv.X] + [████░░░░]
     * Centered horizontally at (centerX, topY).
     */
    generateHPPlate(p, centerX, topY) {
        const hpPct = Math.max(0, p.hp / p.maxHp);
        const plateW = 120;
        const barW = 100;
        const barH = 6;
        const plateH = 28;
        const hpColor = hpPct > 0.5 ? '#22c55e' : hpPct > 0.2 ? '#eab308' : '#ef4444';
        const px = centerX - Math.floor(plateW / 2);
        return `
      <svg width="${this.WIDTH}" height="${this.HEIGHT}">
        <g transform="translate(${px}, ${topY})">
          <!-- Plate background -->
          <rect x="0" y="0" width="${plateW}" height="${plateH}" fill="rgba(0,0,0,0.7)" rx="4" />
          <!-- Name + Level -->
          <text x="${plateW / 2}" y="12" font-family="Arial,sans-serif" font-weight="bold" font-size="10" fill="white" text-anchor="middle">
            ${p.name.toUpperCase()} Lv.${p.level}
          </text>
          <!-- HP bar bg -->
          <rect x="${(plateW - barW) / 2}" y="16" width="${barW}" height="${barH}" fill="#333" rx="3" />
          <!-- HP bar fill -->
          <rect x="${(plateW - barW) / 2}" y="16" width="${barW * hpPct}" height="${barH}" fill="${hpColor}" rx="3" />
        </g>
      </svg>
    `;
    }
}
const instance = new BattleRenderer();
exports.default = instance;
