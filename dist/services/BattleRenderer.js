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
 * (｡♥‿♥｡) Pixel-perfect combat visualization!
 */
class BattleRenderer {
    BG_PATH = path_1.default.join(process.cwd(), 'assets', 'battle_bg.png');
    WIDTH = 800;
    HEIGHT = 400;
    /**
     * Render a complete battle frame for a 3v3 matchup.
     */
    async renderFrame(teamA, teamB, options = {}) {
        const composites = [];
        // 1. Prepare Background
        // If background doesn't exist, use a solid dark blue
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
        // 2. Positions
        // Team A (Left): x=100, y=[80, 200, 320]
        // Team B (Right): x=700, y=[80, 200, 320]
        const positionsA = [
            { x: 120, y: 80 },
            { x: 80, y: 200 },
            { x: 120, y: 320 }
        ];
        const positionsB = [
            { x: 680, y: 80 },
            { x: 720, y: 200 },
            { x: 680, y: 320 }
        ];
        // 3. Render Team A
        for (let i = 0; i < teamA.length; i++) {
            const p = teamA[i];
            const pos = positionsA[i];
            const sprite = await this.getSprite(p.speciesKey, p.hp <= 0);
            if (sprite) {
                composites.push({
                    input: sprite,
                    top: pos.y - 60,
                    left: pos.x - 60,
                });
            }
            // Consolidated HP Plate (Name + Bar)
            composites.push({
                input: Buffer.from(this.generateHPPlate(p, pos.x, pos.y - 70, 'left', options.highlightId === p.id)),
                top: 0,
                left: 0,
            });
        }
        // 4. Render Team B
        for (let i = 0; i < teamB.length; i++) {
            const p = teamB[i];
            const pos = positionsB[i];
            const sprite = await this.getSprite(p.speciesKey, p.hp <= 0, true);
            if (sprite) {
                composites.push({
                    input: sprite,
                    top: pos.y - 60,
                    left: pos.x - 60,
                });
            }
            // Consolidated HP Plate
            composites.push({
                input: Buffer.from(this.generateHPPlate(p, pos.x, pos.y - 70, 'right', options.highlightId === p.id)),
                top: 0,
                left: 0,
            });
        }
        // 5. Action Dialog Overlay
        if (options.actionText) {
            composites.push({
                input: Buffer.from(this.generateActionOverlay(options.actionText)),
                top: 0,
                left: 0,
            });
        }
        return await base.composite(composites).png().toBuffer();
    }
    async getSprite(key, isFainted, flip = false) {
        let buffer = await AnimalService_1.default.getPokemonSpriteBuffer(key);
        if (!buffer)
            return null;
        let s = (0, sharp_1.default)(buffer).resize(120, 120, { kernel: 'nearest' });
        if (flip)
            s = s.flop();
        if (isFainted)
            s = s.grayscale().modulate({ brightness: 0.4 });
        return await s.toBuffer();
    }
    generateHPPlate(p, x, y, align, isHighlighted) {
        const hpPct = Math.max(0, p.hp / p.maxHp);
        const plateWidth = 130;
        const barWidth = 110;
        const barHeight = 6;
        const hpColor = hpPct > 0.5 ? '#00ff00' : hpPct > 0.2 ? '#ffff00' : '#ff0000';
        const plateX = align === 'left' ? x - 65 : x - 65; // Center it over the sprite
        const highlightColor = isHighlighted ? '#ffffff' : '#333333';
        return `
      <svg width="${this.WIDTH}" height="${this.HEIGHT}">
        <g transform="translate(${plateX}, ${y})">
          <!-- Background Plate -->
          <rect x="0" y="0" width="${plateWidth}" height="32" fill="rgba(0,0,0,0.6)" rx="4" stroke="${highlightColor}" stroke-width="1.5" />
          
          <!-- Name -->
          <text x="6" y="14" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="white">
            ${p.name.toUpperCase()} <tspan fill="#ccc" font-size="9">Lv.${p.level}</tspan>
          </text>
          
          <!-- HP Bar Background -->
          <rect x="10" y="19" width="${barWidth}" height="${barHeight}" fill="#222" rx="2" />
          
          <!-- HP Bar Fill -->
          <rect x="10" y="19" width="${barWidth * hpPct}" height="${barHeight}" fill="${hpColor}" rx="2" />
        </g>
      </svg>
    `;
    }
    generateActionOverlay(text) {
        // Escape XML entities just in case
        const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').toUpperCase();
        return `
      <svg width="${this.WIDTH}" height="${this.HEIGHT}">
        <!-- Classic Dialog Box -->
        <rect x="40" y="330" width="720" height="60" fill="white" rx="8" stroke="#333" stroke-width="4" />
        <rect x="45" y="335" width="710" height="50" fill="none" rx="6" stroke="#ccc" stroke-width="1" />
        
        <text x="400" y="367" font-family="Arial, sans-serif" font-size="16" fill="#111" font-weight="bold" text-anchor="middle">
          ${safeText}
        </text>
      </svg>
    `;
    }
}
const instance = new BattleRenderer();
exports.default = instance;
