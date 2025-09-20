#!/usr/bin/env node

/**
 * Generate icon manifest by scanning the public/icons directory
 * This script creates a JSON file with all available icons
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateIconManifest() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const manifestPath = path.join(__dirname, '..', 'public', 'icon-manifest.json');
  
  console.log('🔍 Scanning icons directory:', iconsDir);
  
  if (!fs.existsSync(iconsDir)) {
    console.error('❌ Icons directory not found:', iconsDir);
    process.exit(1);
  }
  
  try {
    const files = fs.readdirSync(iconsDir);
    const iconFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.svg', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
    });
    
    const manifest = {
      generated: new Date().toISOString(),
      totalIcons: iconFiles.length,
      icons: iconFiles.sort()
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Generated manifest with ${iconFiles.length} icons`);
    console.log(`📄 Manifest saved to: ${manifestPath}`);
    console.log(`📋 Sample icons:`, iconFiles.slice(0, 10));
    
    return manifest;
  } catch (error) {
    console.error('❌ Error generating manifest:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateIconManifest();
}

export default generateIconManifest;