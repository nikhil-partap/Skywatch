# Service Worker Registration Fix for GitHub Pages

## Issue
The service worker was failing to register on GitHub Pages with the error:
```
SW registration failed: TypeError: ServiceWorker script at https://nikhil-partap.github.io/sw.js for scope https://nikhil-partap.github.io/ encountered an error during installation.
```

## Root Cause
1. **Path Issues**: GitHub Pages serves files from `/Skywatch/` subdirectory, but the service worker was looking for `/sw.js`
2. **Missing Files**: Icon files referenced in manifest.json didn't exist
3. **Jekyll Processing**: GitHub Pages processes files with Jekyll by default

## Fixes Applied

### 1. Updated Service Worker Registration
```javascript
// Check if we're on GitHub Pages and adjust the path
const isGitHubPages = window.location.hostname === 'nikhil-partap.github.io';
const swPath = isGitHubPages ? '/Skywatch/sw.js' : '/sw.js';

// Added file existence check before registration
fetch(swPath, { method: 'HEAD' })
    .then(response => {
        if (response.ok) {
            return navigator.serviceWorker.register(swPath);
        } else {
            throw new Error(`Service worker file not found at ${swPath}`);
        }
    })
```

### 2. Updated Service Worker File
- Added GitHub Pages path detection
- Updated cache paths to include `/Skywatch/` prefix
- Added better error handling and logging
- Removed references to non-existent icon files

### 3. Updated Manifest.json
- Changed `start_url` from `/` to `./`
- Added `scope: "./"`
- Removed icon references (since files don't exist)
- Updated icon paths to use relative paths

### 4. Added .nojekyll File
- Prevents GitHub Pages from processing files with Jekyll
- Ensures service worker files are served correctly

### 5. Enhanced Error Handling
- Added comprehensive logging for debugging
- Fallback registration attempts
- Better error messages

## Testing
1. **Local Development**: Works on `http://127.0.0.1:5500/`
2. **GitHub Pages**: Should now work on `https://nikhil-partap.github.io/Skywatch/`

## Debugging
Check browser console for detailed logs:
- Service worker path detection
- File existence checks
- Registration success/failure
- Cache operations

## Notes
- Service worker registration is optional and won't break the app if it fails
- The app works perfectly without service worker functionality
- PWA features (offline support, push notifications) require successful registration 