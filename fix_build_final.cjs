const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

// The issue might be that the upload artifacts step looks for a static build in dist, but it fails if something is not right.
// Wait, the error is "An error occurred during artifact upload: Build artifacts are empty."
// The platform's artifact uploader probably looks at the dist directory.
// Let's make sure the build script finishes correctly and leaves dist fully populated.
// We noticed that the build script is finishing correctly.
