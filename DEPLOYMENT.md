# Firebase Hosting Deployment Guide

## Quick Start

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase Hosting
```bash
firebase init hosting
```

When prompted:
- **Select your Firebase project** (the one you created earlier)
- **Public directory:** Enter `out`
- **Configure as single-page app:** Yes
- **Set up automatic builds:** No
- **Overwrite existing files:** No

### 4. Build and Deploy
```bash
npm run deploy
```

This will:
1. Build your Next.js app as static HTML
2. Deploy to Firebase Hosting
3. Give you a live URL like: `https://your-project.web.app`

---

## Manual Deployment Steps

If you prefer to do it manually:

```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

---

## Configuration Files

### `firebase.json`
Configures Firebase Hosting to serve your static files from the `out` directory.

### `next.config.ts`
Updated to enable static export:
- `output: 'export'` - Generates static HTML files
- `images: { unoptimized: true }` - Required for static export

---

## Deployment URL

After deployment, your app will be available at:
- **Primary:** `https://YOUR-PROJECT-ID.web.app`
- **Secondary:** `https://YOUR-PROJECT-ID.firebaseapp.com`

You can also add a custom domain in Firebase Console → Hosting → Add custom domain

---

## Continuous Deployment

For automatic deployments on git push, you can set up GitHub Actions:

1. Generate a Firebase token:
```bash
firebase login:ci
```

2. Add the token to GitHub Secrets as `FIREBASE_TOKEN`

3. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_TOKEN }}'
          channelId: live
          projectId: YOUR-PROJECT-ID
```

---

## Important Notes

> [!IMPORTANT]
> **Environment Variables**
> 
> Make sure your Firebase configuration is set in `.env.local` before building. The build process will embed these values into the static files.

> [!WARNING]
> **Security**
> 
> Since this is a static export, all environment variables prefixed with `NEXT_PUBLIC_` will be visible in the client-side code. Never put sensitive secrets in these variables.

---

## Troubleshooting

**Build fails:**
- Check that all Firebase env variables are set in `.env.local`
- Ensure no server-side only features are being used

**404 errors:**
- Firebase Hosting is configured to serve `index.html` for all routes (SPA mode)
- Check `firebase.json` rewrites configuration

**Images not loading:**
- Ensure `images.unoptimized: true` is set in `next.config.ts`
- Use absolute paths for images in the `public` directory
