const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

let pkg = JSON.parse(code);
pkg.scripts.start = "NODE_ENV=production node dist/server.cjs";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

