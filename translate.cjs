const fs = require('fs');
const path = require('path');
const https = require('https');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function translateText(text, targetLang) {
  return new Promise((resolve, reject) => {
    // Some texts have interpolations like {{date}}. We should be careful, but Google Translate usually keeps them intact or spaces them out (e.g., {{ date }}).
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          let translated = '';
          if (json && json[0]) {
            json[0].forEach(t => {
              if (t[0]) translated += t[0];
            });
          }
          // Fix spacing around interpolations that Google might have messed up
          translated = translated.replace(/\{\{ /g, '{{').replace(/ \}\}/g, '}}');
          resolve(translated || text);
        } catch (e) {
          resolve(text);
        }
      });
    }).on('error', (e) => {
      resolve(text);
    });
  });
}

async function traverseAndTranslate(obj, targetLang) {
  const result = {};
  const tasks = [];
  
  const traverse = (currentObj, currentResult) => {
    for (const key in currentObj) {
      if (typeof currentObj[key] === 'string') {
        tasks.push(async () => {
          const translated = await translateText(currentObj[key], targetLang);
          currentResult[key] = translated;
        });
      } else if (typeof currentObj[key] === 'object') {
        currentResult[key] = {};
        traverse(currentObj[key], currentResult[key]);
      }
    }
  };
  
  traverse(obj, result);
  
  // Run tasks in chunks of 20 to avoid rate limits while being fast
  const chunkSize = 20;
  for (let i = 0; i < tasks.length; i += chunkSize) {
    const chunk = tasks.slice(i, i + chunkSize);
    await Promise.all(chunk.map(task => task()));
    await delay(100);
  }
  
  return result;
}

async function main() {
  const langs = ['de', 'it', 'nl', 'ja', 'zh-CN', 'ko', 'ar'];
  const sourcePath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.json');
  const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

  for (const lang of langs) {
    console.log(`Translating to ${lang}...`);
    try {
      const translatedData = await traverseAndTranslate(sourceData, lang);
      const fileLang = lang === 'zh-CN' ? 'zh' : lang;
      const destPath = path.join(__dirname, 'src', 'i18n', 'locales', `${fileLang}.json`);
      fs.writeFileSync(destPath, JSON.stringify(translatedData, null, 2));
      console.log(`Saved ${fileLang}.json`);
    } catch (e) {
      console.error(`Failed for ${lang}`, e);
    }
  }
}

main();
