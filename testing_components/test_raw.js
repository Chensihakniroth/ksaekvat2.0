const sharp = require('sharp');

function createGradientRaw(width, height) {
    const buf = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
        const alpha = Math.floor((y / height) * 255);
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            buf[idx] = 0;     // R
            buf[idx + 1] = 0;   // G
            buf[idx + 2] = 0;   // B
            buf[idx + 3] = alpha; // A
        }
    }
    return buf;
}

async function test() {
    const w = 280;
    const h = 420;
    try {
        const rawMask = createGradientRaw(w, h); // 280x420x4 = 470400 bytes

        const bgBuffer = await sharp({ create: { width: w, height: h, channels: 4, background: '#181a20' } }).png().toBuffer();

        // We must wrap the raw object to use it as input properly
        const gradLayer = await sharp(rawMask, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();

        const output = await sharp(bgBuffer)
            .composite([{
                input: gradLayer,
                blend: 'over'
            }])
            .png()
            .toBuffer();

        console.log('Success!', output.length);
    } catch (e) {
        console.log('Error:', e.message);
    }
}
test();
