const sharp = require('sharp');
const fs = require('fs');

function createGridBg(width, height) {
    const buf = Buffer.alloc(width * height * 4);
    const bgColor = [18, 19, 24]; // #121318
    const gridColor = [255, 255, 255]; // white 

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            let alpha = 255;
            let r = bgColor[0], g = bgColor[1], b = bgColor[2];

            // Radial glow in center
            const dx = x - width / 2;
            const dy = y - height / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = (width > height ? width : height) * 0.7;
            let light = 1 - (dist / maxDist);
            if (light < 0) light = 0;

            r += light * 24; g += light * 26; b += light * 34; // add #2a2d3a glow
            if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;

            // Grid lines
            if (x % 40 === 0 || y % 40 === 0) {
                r = r * 0.97 + 255 * 0.03;
                g = g * 0.97 + 255 * 0.03;
                b = b * 0.97 + 255 * 0.03;
            }

            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
            buf[idx + 3] = alpha;
        }
    }
    return buf;
}

function createCardMask(width, height, radius) {
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

function createCardGradientOverlay(width, height, rarityGradientHex) {
    const buf = Buffer.alloc(width * height * 4);

    // Parse rarity glow color (assuming first hex from ['#FFF0B3', '#D4AF37'])
    const hex = rarityGradientHex;
    const rr = parseInt(hex.substring(1, 3), 16) || 200;
    const gg = parseInt(hex.substring(3, 5), 16) || 150;
    const bb = parseInt(hex.substring(5, 7), 16) || 200;

    for (let y = 0; y < height; y++) {
        const fadeYStart = height * 0.4;
        let fadeAlpha = 0;
        if (y > fadeYStart) {
            fadeAlpha = (y - fadeYStart) / (height - fadeYStart);
            if (fadeAlpha > 0.85) fadeAlpha = 0.85 + (fadeAlpha - 0.85) * (0.15 / 0.15);
        }

        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = Math.floor(fadeAlpha * 255);

            // Top-left triangle (role badge) glow
            // points="0,0 120,0 90,30 0,30"
            if (y < 30 && x < (120 - y)) {
                // gradient alpha
                const glowAlpha = 1 - (x / 120);
                const finalA = Math.floor(glowAlpha * 0.8 * 255);
                if (finalA > a) { r = rr; g = gg; b = bb; a = finalA; }
            }

            // Frame border
            if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) {
                // gradient y
                const t = y / height;
                // interpolate between rGrad[0] and rGrad[1]. Let's just use #777 to #444 or simple
                r = rr; g = gg; b = bb;
                a = 200; // 0.8 opacity
            }

            const idx = (y * width + x) * 4;
            buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b; buf[idx + 3] = a;
        }
    }
    return buf;
}

async function test() {
    const cw = 280; const ch = 420;
    const maskRaw = createCardMask(cw, ch, 24);
    const gradRaw = createCardGradientOverlay(cw, ch, '#D9B3FF'); // testing 4-star

    const emptyCardRaw = createGridBg(cw, ch);

    try {
        const mask = await sharp(maskRaw, { raw: { width: cw, height: ch, channels: 4 } }).png().toBuffer();
        const overlay = await sharp(gradRaw, { raw: { width: cw, height: ch, channels: 4 } }).png().toBuffer();
        const bg = await sharp(emptyCardRaw, { raw: { width: cw, height: ch, channels: 4 } }).png().toBuffer();

        // Test base card
        const finalCard = await sharp(bg)
            .composite([
                { input: overlay, blend: 'over' },
                { input: mask, blend: 'dest-in' }
            ]).png().toFile('test_output.png');

        console.log('Success test output! Check test_output.png');
    } catch (e) {
        console.log('Error:', e.message);
    }
}
test();
