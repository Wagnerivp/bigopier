const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

// The platform might look for `index.html` not inside dist but expect `vite build` to put it in `dist` which it does.
// But we use a custom server. Maybe the deployment platform checks `package.json` and if `"start": "NODE_ENV=production node dist/server.cjs"` is there, it expects `node dist/server.cjs` to just work.
// But the error says: "Build artifacts are empty." This usually happens when the framework is recognized as "Vite" but Vite's default output directory (`dist`) is not correctly populated, or the platform thinks it's a static site.
// Let's change the start script to just "node dist/server.cjs".
let pkg = JSON.parse(code);
pkg.scripts.start = "node dist/server.cjs";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

