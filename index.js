// Cloud Dashboard Compatibility Shim
// Many PaaS providers (Railway, Heroku) cache 'node index.js' as a hardcoded dashboard override.
// This file serves as a transparent forwarder to our compiled TypeScript binary.

try {
    require('./dist/core/index.js');
} catch (error) {
    console.error("CRITICAL: Failed to load compiled binary. Did you construct 'dist/' via 'npm run build' before launching?");
    console.error(error);
    process.exit(1);
}
