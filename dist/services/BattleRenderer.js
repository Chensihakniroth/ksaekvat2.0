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
 * 🎨 BATTLE RENDERER — OWO-Style Card Layout
 * Each row: [Player Sprite][Player HP][···gap···][Enemy HP][Enemy Sprite]
 * No text overlays. Battle log goes in Discord embed.
 */
class BattleRenderer {
    BG_PATH = path_1.default.join(process.cwd(), 'assets', 'battle_bg.png');
    W = 800;
    H = 400;
    SPRITE = 80;
    CARD_H = 105;
    CARD_W = 780;
    CARD_X = 10;
    ROW_GAP = 12;
    BAR_W = 160;
    BAR_H = 10;
    async renderFrame(teamA, teamB, hpOverrides) {
        // Background
        let base;
        if (fs_1.default.existsSync(this.BG_PATH)) {
            base = (0, sharp_1.default)(this.BG_PATH).resize(this.W, this.H);
        }
        else {
            base = (0, sharp_1.default)({
                create: {
                    width: this.W,
                    height: this.H,
                    channels: 4,
                    background: { r: 15, g: 15, b: 30, alpha: 1 },
                },
            });
        }
        const composites = [];
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
                const ov = hpOverrides?.teamA.find((o) => o.id === pA.id);
                svg += this.statsBlock(pA, sx, cy, 'left', ov);
            }
            // Right side stats (Team B) — anchored left of sprite
            if (pB) {
                const sx = this.CARD_X + this.CARD_W - this.SPRITE - 20;
                const ov = hpOverrides?.teamB.find((o) => o.id === pB.id);
                svg += this.statsBlock(pB, sx, cy, 'right', ov);
            }
        }
        composites.push({
            input: Buffer.from(`<svg width="${this.W}" height="${this.H}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`),
            top: 0,
            left: 0,
        });
        // Composite sprites — use hpOverrides snapshot to detect fainted state
        for (let i = 0; i < 3; i++) {
            const ry = startY + i * (this.CARD_H + this.ROW_GAP);
            const sy = ry + Math.floor((this.CARD_H - this.SPRITE) / 2);
            if (i < teamA.length) {
                const ovA = hpOverrides?.teamA.find((o) => o.id === teamA[i].id);
                const faintedA = ovA ? ovA.hp <= 0 : teamA[i].hp <= 0;
                const sp = await this.getSprite(teamA[i].speciesKey, faintedA);
                if (sp)
                    composites.push({ input: sp, top: sy, left: this.CARD_X + 8 });
            }
            if (i < teamB.length) {
                const ovB = hpOverrides?.teamB.find((o) => o.id === teamB[i].id);
                const faintedB = ovB ? ovB.hp <= 0 : teamB[i].hp <= 0;
                const sp = await this.getSprite(teamB[i].speciesKey, faintedB, true);
                if (sp)
                    composites.push({
                        input: sp,
                        top: sy,
                        left: this.CARD_X + this.CARD_W - this.SPRITE - 8,
                    });
            }
        }
        return await base.composite(composites).png().toBuffer();
    }
    statsBlock(p, ax, cy, side, hpOv) {
        const currentHp = hpOv ? hpOv.hp : p.hp;
        const maxHp = hpOv ? hpOv.maxHp : p.maxHp;
        const pct = Math.max(0, currentHp / maxHp);
        const col = pct > 0.5 ? '#22c55e' : pct > 0.2 ? '#eab308' : '#ef4444';
        const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const name = esc(`${p.name.toUpperCase()} Lv.${p.level}`);
        const hp = esc(`${Math.max(0, currentHp)}/${maxHp}`);
        let s = '';
        if (side === 'left') {
            s += `<text x="${ax}" y="${cy - 12}" font-family="Arial,sans-serif" font-weight="bold" font-size="13" fill="white">${name}</text>`;
            s += `<rect x="${ax}" y="${cy}" width="${this.BAR_W}" height="${this.BAR_H}" fill="#1a1a2e" rx="4"/>`;
            s += `<rect x="${ax}" y="${cy}" width="${this.BAR_W * pct}" height="${this.BAR_H}" fill="${col}" rx="4"/>`;
            s += `<text x="${ax}" y="${cy + 24}" font-family="Arial,sans-serif" font-size="11" fill="#bbb">${hp}</text>`;
        }
        else {
            s += `<text x="${ax}" y="${cy - 12}" font-family="Arial,sans-serif" font-weight="bold" font-size="13" fill="white" text-anchor="end">${name}</text>`;
            s += `<rect x="${ax - this.BAR_W}" y="${cy}" width="${this.BAR_W}" height="${this.BAR_H}" fill="#1a1a2e" rx="4"/>`;
            s += `<rect x="${ax - this.BAR_W}" y="${cy}" width="${this.BAR_W * pct}" height="${this.BAR_H}" fill="${col}" rx="4"/>`;
            s += `<text x="${ax}" y="${cy + 24}" font-family="Arial,sans-serif" font-size="11" fill="#bbb" text-anchor="end">${hp}</text>`;
        }
        return s;
    }
    async getSprite(key, fainted, flip = false) {
        const buf = await AnimalService_1.default.getPokemonSpriteBuffer(key);
        if (!buf)
            return null;
        let s = (0, sharp_1.default)(buf).resize(this.SPRITE, this.SPRITE, {
            kernel: 'nearest',
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        });
        if (flip)
            s = s.flop();
        if (fainted)
            s = s.ensureAlpha().linear(1, 0).composite([{
                    input: Buffer.from([0, 0, 0, Math.round(255 * 0.6)]),
                    raw: { width: 1, height: 1, channels: 4 },
                    tile: true,
                    blend: 'dest-in',
                }]);
        return s.toBuffer();
    }
}
const instance = new BattleRenderer();
exports.default = instance;
