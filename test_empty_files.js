const fs = require('fs');
function findEmpty(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = dir + '/' + file;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findEmpty(fullPath);
    } else {
      if (stat.size === 0) {
        console.log('Empty file:', fullPath);
      }
    }
  }
}
findEmpty('dist');
