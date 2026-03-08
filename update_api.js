const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Replace fetch("/api/ with fetch("https://qms-sjuv.onrender.com/api/
  content = content.replace(/fetch\("\/api\//g, 'fetch("https://qms-sjuv.onrender.com/api/');
  
  // Replace fetch('/api/ with fetch('https://qms-sjuv.onrender.com/api/
  content = content.replace(/fetch\('\/api\//g, "fetch('https://qms-sjuv.onrender.com/api/");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated:', filePath);
  }
}

const srcDir = './src';
const files = fs.readdirSync(srcDir);

files.forEach(f => {
  if (f.endsWith('.jsx')) {
    processFile(path.join(srcDir, f));
  }
});

console.log('Done!');
