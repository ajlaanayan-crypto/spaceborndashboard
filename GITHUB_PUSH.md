# GitHub Push Instructions

## Problem
Git push failed with permission error: `Permission denied to eternal0208`

## Solutions

### Option 1: Use Personal Access Token (Easiest)

1. **Generate Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Push with Token:**
```bash
git push https://YOUR_TOKEN@github.com/ajlaanayan-crypto/spaceborndashboard.git main
```

Replace `YOUR_TOKEN` with the token you copied.

### Option 2: SSH Key Setup

1. **Generate SSH Key:**
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. **Add to GitHub:**
   - Copy the public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste and save

3. **Change Remote URL:**
```bash
git remote set-url origin git@github.com:ajlaanayan-crypto/spaceborndashboard.git
```

4. **Push:**
```bash
git push -u origin main
```

### Option 3: Clear Git Credentials

If you need to login with a different GitHub account:

```bash
# Clear credentials
git credential-osxkeychain erase
# Then type:
host=github.com
protocol=https
# Press Enter twice

# Try push again - will prompt for login
git push -u origin main
```

---

## Current Status

✅ Code is committed locally  
✅ Remote URL is set to: `https://github.com/ajlaanayan-crypto/spaceborndashboard.git`  
❌ Need authentication to push

Choose one of the options above to complete the push!
