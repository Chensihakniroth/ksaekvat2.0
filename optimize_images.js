const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Target multiple directories for optimization
const targetDirs = [
  path.join(__dirname, 'dashboard', 'src', 'assets', 'char_icon'),
  path.join(__dirname, '.tmp', 'pokemon_cache'),
  path.join(__dirname, 'assets', 'bsd'),
  path.join(__dirname, 'assets', 'element_icon'),
  path.join(__dirname, 'assets', 'raritypokemon'),
];

function getFiles(dir, allFiles) {
  if (!fs.existsSync(dir)) return allFiles || [];
  const files = fs.readdirSync(dir);
  allFiles = allFiles || [];
  files.forEach(function(file) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      allFiles = getFiles(fullPath, allFiles);
    } else {
      if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
        allFiles.push(fullPath);
      }
    }
  });
  return allFiles;
}

async function convert() {
  console.log('🚀 Starting Universal WebP Conversion & Optimization...');
  
  let totalFiles = [];
  targetDirs.forEach(dir => {
    console.log(`Scanning: ${dir}`);
    totalFiles = totalFiles.concat(getFiles(dir));
  });

  console.log(`Found ${totalFiles.length} images to optimize.`);

  let saved = 0;
  let skipped = 0;

  for (const file of totalFiles) {
    const ext = path.extname(file);
    const webpPath = file.replace(ext, '.webp');
    
    // Skip if webp already exists (optional, but good for speed)
    if (fs.existsSync(webpPath) && fs.statSync(webpPath).size > 0) {
      skipped++;
      continue;
    }

    try {
      await sharp(file)
        .webp({ quality: 80, effort: 6 }) // High effort for better compression
        .toFile(webpPath);
      
      // Note: We'll keep original for now to avoid breaking existing code that might expect .png
      // In a real production environment, you'd switch the code to use .webp and delete the .png
      
      saved++;
      if (saved % 50 === 0) console.log(`Optimized ${saved}/${totalFiles.length}...`);
    } catch (err) {
      console.error(`Failed to convert ${file}:`, err.message);
    }
  }

  console.log(`✅ Finished! Optimized ${saved} new images, skipped ${skipped} existing.`);
}

convert();
