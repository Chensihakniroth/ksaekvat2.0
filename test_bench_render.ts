import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Mock AnimalService just for getting sprites
const AnimalService = require('./src/services/AnimalService').default || require('./src/services/AnimalService');
const PokemonBattleService = require('./src/services/PokemonBattleService').default || require('./src/services/PokemonBattleService');

class BenchRenderer {
  private readonly BG_PATH = path.join(process.cwd(), 'assets', 'battle_bg.png');
  private readonly W = 800;
  private readonly H = 450;
  private readonly CARD_W = 380;
  private readonly CARD_H = 110;
  private readonly GAP_X = 20;
  private readonly GAP_Y = 20;
  private readonly SPRITE = 80;

  public async renderPage(pokemon: any[], teamIds: Set<string>): Promise<Buffer> {
    let base: sharp.Sharp;
    if (fs.existsSync(this.BG_PATH)) {
      base = sharp(this.BG_PATH).resize(this.W, this.H);
    } else {
      base = sharp({
        create: { width: this.W, height: this.H, channels: 4, background: { r: 15, g: 15, b: 30, alpha: 1 } },
      });
    }

    const startX = 10;
    const startY = 30;

    let svg = '';
    const composites: any[] = [];

    for (let i = 0; i < pokemon.length; i++) {
      const p = pokemon[i];
      const col = i % 2;
      const row = Math.floor(i / 2);

      const cx = startX + col * (this.CARD_W + this.GAP_X);
      const cy = startY + row * (this.CARD_H + this.GAP_Y);

      const inTeam = teamIds.has(p._id.toString());
      const strokeColor = inTeam ? '#eab308' : 'rgba(255,255,255,0.12)';
      const bgFill = inTeam ? 'rgba(234, 179, 8, 0.1)' : 'rgba(0,0,0,0.55)';

      // Card Backing
      svg += `<rect x="${cx}" y="${cy}" width="${this.CARD_W}" height="${this.CARD_H}" fill="${bgFill}" rx="8" stroke="${strokeColor}" stroke-width="2"/>`;

      // Text elements
      const name = p.speciesKey.charAt(0).toUpperCase() + p.speciesKey.slice(1);
      const textX = cx + this.SPRITE + 25;
      const textY = cy + 40;
      
      svg += `<text x="${textX}" y="${textY}" font-family="Arial,sans-serif" font-weight="bold" font-size="20" fill="white">${name}</text>`;
      svg += `<text x="${textX}" y="${textY + 25}" font-family="Arial,sans-serif" font-size="14" fill="#a1a1aa">Level ${p.level}</text>`;
      
      if (inTeam) {
        svg += `<text x="${textX}" y="${textY + 45}" font-family="Arial,sans-serif" font-weight="bold" font-size="12" fill="#eab308">⚔️ ACTIVE TEAM</text>`;
      }

      // Sprite Composite
      const spBuf = await AnimalService.getPokemonSpriteBuffer(p.speciesKey);
      if (spBuf) {
        const s = await sharp(spBuf).resize(this.SPRITE, this.SPRITE, {
          kernel: 'nearest',
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        }).toBuffer();
        
        composites.push({
          input: s,
          top: cy + 15,
          left: cx + 15,
        });
      }
    }

    composites.push({
      input: Buffer.from(`<svg width="${this.W}" height="${this.H}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`),
      top: 0,
      left: 0,
    });

    return await base.composite(composites).png().toBuffer();
  }
}

async function run() {
    const r = new BenchRenderer();
    const pokemon = [
        { _id: '1', speciesKey: 'mewtwo', level: 12 },
        { _id: '2', speciesKey: 'pikachu', level: 5 },
        { _id: '3', speciesKey: 'charizard', level: 100 },
        { _id: '4', speciesKey: 'bulbasaur', level: 12 },
        { _id: '5', speciesKey: 'squirtle', level: 50 },
        { _id: '6', speciesKey: 'snorlax', level: 42 },
    ];
    const team = new Set(['1', '3']);
    
    const buf = await r.renderPage(pokemon, team);
    fs.writeFileSync('C:\\Users\\Niroth\\.gemini\\antigravity\\brain\\f878b58f-f284-41b2-9f40-20bf35c4534e\\scratch\\bench_test.png', buf);
    console.log("Done");
}

run();
