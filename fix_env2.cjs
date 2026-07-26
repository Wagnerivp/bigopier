const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/process\.env\.NODE_ENV !== "production"/g, "process.env.NODE_ENV !== 'production' && !process.env.IS_PROD_BUILD");
fs.writeFileSync('server.ts', code);
