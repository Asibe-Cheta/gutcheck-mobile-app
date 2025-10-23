const fs = require('fs');
const path = require('path');

// iOS icon sizes required
const iosIconSizes = [
  { name: 'icon-20.png', size: 20 },
  { name: 'icon-29.png', size: 29 },
  { name: 'icon-40.png', size: 40 },
  { name: 'icon-50.png', size: 50 },
  { name: 'icon-57.png', size: 57 },
  { name: 'icon-60.png', size: 60 },
  { name: 'icon-72.png', size: 72 },
  { name: 'icon-76.png', size: 76 },
  { name: 'icon-80.png', size: 80 },
  { name: 'icon-87.png', size: 87 },
  { name: 'icon-114.png', size: 114 },
  { name: 'icon-120.png', size: 120 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-152.png', size: 152 },
  { name: 'icon-167.png', size: 167 },
  { name: 'icon-180.png', size: 180 },
  { name: 'icon-1024.png', size: 1024 }
];

console.log('iOS Icon Sizes Required:');
iosIconSizes.forEach(icon => {
  console.log(`${icon.name}: ${icon.size}x${icon.size}px`);
});

console.log('\nTo generate these icons:');
console.log('1. Use an online tool like https://www.appicon.co/');
console.log('2. Upload your gc-dark.png file');
console.log('3. Generate all iOS sizes');
console.log('4. Save them to the assets folder');
console.log('5. Update app.config.js to point to the correct icon');
