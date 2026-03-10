const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');

async function test() {
    const url = 'https://placehold.co/600x100/121318/FFFFFF/png?text=BATTLE+TEAM&font=Oswald';
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync('test_text.png', res.data);
        const meta = await sharp(res.data).metadata();
        console.log('Success!', meta.format, meta.width);
    } catch (e) {
        console.log('Error:', e.message);
    }
}
test();
