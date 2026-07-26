const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

// The platform seems to think there are no artifacts. If dist/ is populated, the deployment builder probably copies everything that is not gitignored.
// Is `dist` in `.gitignore`? If it is, the deploy script might be ignoring it!
