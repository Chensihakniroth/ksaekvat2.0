const sharp = require('sharp');
const axios = require('axios');

async function test() {
    const bgData = Buffer.alloc(800 * 120 * 4);
    for (let i = 0; i < bgData.length; i += 4) { bgData[i] = 18; bgData[i + 1] = 19; bgData[i + 2] = 24; bgData[i + 3] = 255; }

    const bg = await sharp(bgData, { raw: { width: 800, height: 120, channels: 4 } }).png().toBuffer();

    const url = 'https://placehold.co/800x120/000000/FFFFFF/png?text=BATTLE+TEAM&font=Rajdhani'; // Gaming vibe font! Rajdhani, Orbitron, or Teko
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const textImage = Buffer.from(res.data);

    try {
        const out = await sharp(bg)
            .composite([{ input: textImage, blend: 'screen' }])
            .png()
            .toBuffer();
        require('fs').writeFileSync('test_screen.png', out);
        console.log('Success test screen!');
    } catch (e) { console.log(e); }
}
test();
