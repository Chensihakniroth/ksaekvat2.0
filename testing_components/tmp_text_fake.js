const axios = require('axios');
const fs = require('fs');

async function test() {
    const url = 'https://fakeimg.pl/600x100/0,0/ffffff/?text=BATTLE+TEAM&font=noto'; // fakeimg supports noto, roboto, lobstertwo, ptex, bebas? They might not have gaming font.
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync('test_text_fake.png', res.data);
        console.log('fakeimg Success!');
    } catch (e) {
        console.log('Error:', e.message);
    }
}
test();
