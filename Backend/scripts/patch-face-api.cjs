const fs   = require('fs');
const path = require('path');

const targets = [
  '../node_modules/@vladmandic/face-api/dist/face-api.esm.js',
  '../node_modules/@vladmandic/face-api/dist/face-api.js'
];

targets.forEach(relPath => {
    const target = path.join(__dirname, relPath);
    if (!fs.existsSync(target)) return;

    let content = fs.readFileSync(target, 'utf-8');
    
    // The crash site is: new this.util.TextEncoder()
    // We replace it with: new (this.util.TextEncoder || globalThis.TextEncoder)()
    const pattern = /this\.util\.TextEncoder/g;
    if (content.match(pattern)) {
        content = content.replace(pattern, '(this.util.TextEncoder || globalThis.TextEncoder)');
        fs.writeFileSync(target, content, 'utf-8');
        console.log(`✅ ${path.basename(target)} patched for Node 22.`);
    } else {
        console.log(`ℹ️  ${path.basename(target)} already patched or pattern not found.`);
    }
});
