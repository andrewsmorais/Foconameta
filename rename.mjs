import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Replace different casings
  content = content.replace(/Bateu a Meta/g, 'Foco na Meta');
  content = content.replace(/Bateu A Meta/g, 'Foco na Meta');
  content = content.replace(/bateu a meta/gi, 'foco na meta');
  content = content.replace(/Bateu a meta/g, 'Foco na meta');
  content = content.replace(/BATEU A META/g, 'FOCO NA META');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (['node_modules', '.git', 'dist'].includes(file)) continue;
      walkDir(fullPath);
    } else {
      // only replace in text files
      if (/\.(tsx|ts|jsx|js|html|json|md|css)$/.test(file)) {
        replaceInFile(fullPath);
      }
    }
  }
}

const targetDir = process.cwd();
walkDir(targetDir);
console.log('Rebranding complete.');
