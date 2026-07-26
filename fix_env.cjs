const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The issue might be that in esbuild, process.env.NODE_ENV is not statically evaluated to "production", or maybe it is. Let's check how esbuild is called.
// wait, esbuild is called like this: esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
