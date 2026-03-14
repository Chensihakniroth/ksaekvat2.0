const sharp = require('sharp');
const path = require('path');

async function check(name) {
  const p = path.join(__dirname, 'assets', 'pokeball', name);
  try {
    const metadata = await sharp(p).metadata();
    console.log(`${name}: ${metadata.width}x${metadata.height}`);
  } catch (err) {
    console.error(`Failed to check ${name}: ${err.message}`);
  }
}

async function run() {
  await check('master_ball.png');
  await check('ultra_ball.png');
}

run();
