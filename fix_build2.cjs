const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

// I will remove the clean step before building since that might affect artifact uploading. Wait, there is no clean step in the build command.
// Maybe the platform expects "npm run build" to leave things in a specific format, and it is failing because `server.cjs` is in `dist/` but it wants to run it.
// The package.json has "start": "node dist/server.cjs", which matches.

// Wait, the error is: "Build artifacts are empty." This means the build script succeeded (exit 0) but didn't produce the expected artifacts in the right place. 
// Maybe the platform expects everything in `dist/` but esbuild modifies something? Or it expects `build` to ONLY create front-end things?
