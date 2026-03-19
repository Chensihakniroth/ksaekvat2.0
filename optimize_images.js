const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconDir = path.join(__dirname, 'dashboard', 'src', 'assets', 'char_icon');

function getFiles(dir, allFiles) {
  const files = fs.readdirSync(dir);
  allFiles = allFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      allFiles = getFiles(dir + '/' + file, allFiles);
    } else {
      if (file.endsWith('.png')) {
        allFiles.push(path.join(dir, file));
      }
    }
  });
  return allFiles;
}

async function convert() {
  console.log('🚀 Starting WebP Conversion...');
  
  const files = getFiles(iconDir);
  console.log(`Found ${files.length} images to optimize.`);

  let saved = 0;

  for (const file of files) {
    const webpPath = file.replace('.png', '.webp');
    
    try {
      await sharp(file)
        .webp({ quality: 85 })
        .toFile(webpPath);
      
      // Remove the old PNG
      fs.unlinkSync(file);
      
      saved++;
      if (saved % 20 === 0) console.log(`Optimized ${saved}/${files.length}...`);
    } catch (err) {
      console.error(`Failed to convert ${file}:`, err.message);
    }
  }

  console.log(`✅ Finished! Optimized ${saved} images.`);
}

convert();
