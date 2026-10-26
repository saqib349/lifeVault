// Imported first in index.js: ES module imports run before the importing
// file's own code, so .env must be loaded from a module of its own for
// other modules (e.g. utils/tokens.js) to see the variables at import time.
if (process.env.NODE_ENV !== "production") {
    process.loadEnvFile?.();
}
