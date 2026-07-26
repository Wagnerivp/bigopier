const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

// I will make sure the build script removes dist first, just to be sure.
let pkg = JSON.parse(code);
pkg.scripts.build = "rm -rf dist && vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

