const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');
let pkg = JSON.parse(code);

if (pkg.devDependencies && pkg.devDependencies['vite']) {
  delete pkg.devDependencies['vite'];
}
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
