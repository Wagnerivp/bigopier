const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

// Some deployment scripts might require a main field
let pkg = JSON.parse(code);
pkg.main = "dist/server.cjs";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

