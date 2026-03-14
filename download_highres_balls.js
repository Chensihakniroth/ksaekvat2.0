const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function download(name, fileName) {
  const url = `https://pokemon.fandom.com/wiki/Special:FilePath/${name}.png`;
  const dest = path.join(__dirname, 'assets', 'pokeball', fileName);
  
  console.log(`Downloading ${name} from Fandom to ${dest}...`);
  
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });

    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (err) {
    console.error(`Failed to download ${name}: ${err.message}`);
  }
}

async function run() {
  await download('Ultra_Ball', 'ultra_ball_full.png');
  await download('Master_Ball', 'master_ball_full.png');
  console.log('Download complete! (｡♥‿♥｡)');
}

run();
