const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

let pkg = JSON.parse(code);
pkg.scripts.build = "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs && cp -r dist build";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
