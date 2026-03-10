const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
async function test() {
    const cardWidth = 280;
    const cardHeight = 420;
    const canvasWidth = 280 + 50;
    const canvasHeight = 420 + 125;

    try {
        const bgBuffer = await sharp({
            create: { width: canvasWidth, height: canvasHeight, channels: 4, background: '#121318' }
        }).png().toBuffer();

        const url = 'https://genshin.jmp.blue/characters/nahida/icon-big';
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const buf = Buffer.from(res.data);

        let charLayer = sharp(buf)
            .resize(cardWidth, cardHeight, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            });

        const gradientBg = await sharp({
            create: { width: cardWidth, height: Math.floor(cardHeight / 3), channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.7 } }
        }).png().toBuffer();

        const cardBg = await sharp({
            create: { width: cardWidth, height: cardHeight, channels: 4, background: '#181a20' }
        }).png().toBuffer();

        let slotBuffer = await sharp(cardBg)
            .composite([
                { input: await charLayer.png().toBuffer(), blend: 'over' },
                { input: gradientBg, top: cardHeight - Math.floor(cardHeight / 3), left: 0, blend: 'over' }
            ])
            .png()
            .toBuffer();

        const finalBuffer = await sharp({
            create: { width: canvasWidth, height: canvasHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
        }).composite([
            { input: bgBuffer, top: 0, left: 0 },
            { input: slotBuffer, top: 100, left: 25 }
        ]).png().toBuffer();

        console.log('SUCCESS!');
    } catch (err) {
        console.log('ERROR:', err.message);
    }
}
test();
