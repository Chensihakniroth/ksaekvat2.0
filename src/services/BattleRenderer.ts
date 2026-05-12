import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import AnimalService from './AnimalService';
import type { BattlePokemon } from './PokemonBattleService';

/**
 * 🎨 BATTLE RENDERER SERVICE
 * Generates dynamic 800x400 battle frames using Sharp + SVG.
 * (｡♥‿♥｡) Pixel-perfect combat visualization!
 */

class BattleRenderer {
  private readonly BG_PATH = path.join(process.cwd(), 'assets', 'battle_bg.png');
  private readonly WIDTH = 800;
  private readonly HEIGHT = 400;

  /**
   * Render a complete battle frame for a 3v3 matchup.
   */
  public async renderFrame(
    teamA: BattlePokemon[],
    teamB: BattlePokemon[],
    options: { highlightId?: string; actionText?: string } = {}
  ): Promise<Buffer> {
    const composites: any[] = [];

    // 1. Prepare Background
    // If background doesn't exist, use a solid dark blue
    let base = sharp({
      create: {
        width: this.WIDTH,
        height: this.HEIGHT,
        channels: 4,
        background: { r: 10, g: 10, b: 25, alpha: 1 }
      }
    });

    if (fs.existsSync(this.BG_PATH)) {
      base = sharp(this.BG_PATH).resize(this.WIDTH, this.HEIGHT);
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
          top: pos.y - 48,
          left: pos.x - 48,
        });
      }
      
      // Add UI Overlay (HP Bar, Name)
      composites.push({
        input: Buffer.from(this.generatePokemonUI(p, pos.x + 60, pos.y, 'left', options.highlightId === p.id)),
        top: 0,
        left: 0,
      });
    }

    // 4. Render Team B
    for (let i = 0; i < teamB.length; i++) {
      const p = teamB[i];
      const pos = positionsB[i];
      const sprite = await this.getSprite(p.speciesKey, p.hp <= 0, true); // Flip for enemy
      if (sprite) {
        composites.push({
          input: sprite,
          top: pos.y - 48,
          left: pos.x - 48,
        });
      }

      // Add UI Overlay
      composites.push({
        input: Buffer.from(this.generatePokemonUI(p, pos.x - 60, pos.y, 'right', options.highlightId === p.id)),
        top: 0,
        left: 0,
      });
    }

    // 5. Action Text Overlay
    if (options.actionText) {
      composites.push({
        input: Buffer.from(this.generateActionOverlay(options.actionText)),
        top: 0,
        left: 0,
      });
    }

    return await base.composite(composites).png().toBuffer();
  }

  private async getSprite(key: string, isFainted: boolean, flip: boolean = false): Promise<Buffer | null> {
    let buffer = await AnimalService.getPokemonSpriteBuffer(key);
    if (!buffer) return null;

    let s = sharp(buffer).resize(120, 120, { kernel: 'nearest' });
    
    if (flip) s = s.flop();
    if (isFainted) s = s.grayscale().modulate({ brightness: 0.5 });

    return await s.toBuffer();
  }

  private generatePokemonUI(p: BattlePokemon, x: number, y: number, align: 'left' | 'right', isHighlighted: boolean): string {
    const hpPct = Math.max(0, p.hp / p.maxHp);
    const barWidth = 120;
    const barHeight = 8;
    const hpColor = hpPct > 0.5 ? '#00ff88' : hpPct > 0.2 ? '#ffcc00' : '#ff4444';
    
    const textAnchor = align === 'left' ? 'start' : 'end';
    const highlightStroke = isHighlighted ? 'stroke="#00ffff" stroke-width="2" filter="url(#glow)"' : '';

    return `
      <svg width="${this.WIDTH}" height="${this.HEIGHT}">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <g transform="translate(${x}, ${y - 20})">
          <!-- Name & Level -->
          <text x="0" y="-10" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="white" text-anchor="${textAnchor}" style="text-shadow: 2px 2px 2px black;">
            ${p.name} <tspan fill="#aaa" font-size="12">Lv.${p.level}</tspan>
          </text>
          
          <!-- HP Bar Background -->
          <rect x="${align === 'left' ? 0 : -barWidth}" y="0" width="${barWidth}" height="${barHeight}" fill="#333" rx="4" />
          
          <!-- HP Bar Fill -->
          <rect x="${align === 'left' ? 0 : -barWidth + (barWidth * (1 - hpPct))}" y="0" width="${barWidth * hpPct}" height="${barHeight}" fill="${hpColor}" rx="4" ${highlightStroke} />
          
          <!-- HP Text -->
          <text x="${align === 'left' ? barWidth : -barWidth}" y="20" font-family="monospace" font-size="10" fill="#ddd" text-anchor="${textAnchor}">
            ${Math.max(0, p.hp)}/${p.maxHp}
          </text>
        </g>
      </svg>
    `;
  }

  private generateActionOverlay(text: string): string {
    return `
      <svg width="${this.WIDTH}" height="${this.HEIGHT}">
        <rect x="0" y="350" width="800" height="50" fill="rgba(0,0,0,0.7)" />
        <text x="400" y="382" font-family="Arial, sans-serif" font-size="20" fill="#00ffff" font-weight="bold" text-anchor="middle" style="letter-spacing: 1px;">
          ${text.toUpperCase()}
        </text>
      </svg>
    `;
  }
}

const instance = new BattleRenderer();
export default instance;
