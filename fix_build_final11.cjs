const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

// If the platform specifically looks for a `build` directory, we'll configure it. Wait, the deployment platform script might be just looking for `dist`.
let pkg = JSON.parse(code);
pkg.scripts.build = "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

