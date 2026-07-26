const fs = require('fs');
let code = fs.readFileSync('.gitignore', 'utf8');

// I will remove dist/ from .gitignore so the deployer copies it.
code = code.replace(/dist\/\n/g, '').replace(/dist\n/g, '').replace(/build\/\n/g, '').replace(/build\n/g, '');
fs.writeFileSync('.gitignore', code);
