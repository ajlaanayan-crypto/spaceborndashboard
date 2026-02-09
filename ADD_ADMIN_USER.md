# Add Admin User to Firebase

## Option 1: Using Firebase Console (Easiest)

### Step 1: Create User in Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **spaceborn-8cb5f**
3. Go to **Authentication** → **Users**
4. Click **Add user**
5. Enter:
   - **Email:** `admin@spaceborn.io` (or your preferred email)
   - **Password:** `admin123456` (or your preferred password)
6. Click **Add user**
7. **Copy the UID** that appears in the user list

### Step 2: Create User Document in Firestore
1. Go to **Firestore Database**
2. Click **Start collection** (if first time) or find the `users` collection
3. Collection ID: `users`
4. Click **Next** or **Add document**
5. Document ID: **Paste the UID from step 1**
6. Add the following fields:

| Field | Type | Value |
|-------|------|-------|
| uid | string | (paste the UID) |
| id | number | 1 |
| username | string | admin |
| email | string | admin@spaceborn.io |
| role | string | admin |
| createdAt | timestamp | (click "Set to current time") |
| updatedAt | timestamp | (click "Set to current time") |

7. Click **Save**

### Step 3: Test Login
1. Go to http://localhost:3000 or your deployed URL
2. Login with:
   - Email: `admin@spaceborn.io`
   - Password: `admin123456`

---

## Option 2: Using Admin Script (Advanced)

### Prerequisites
```bash
npm install firebase-admin
```

### Steps

1. **Download Service Account Key:**
   - Go to Firebase Console → Project Settings
   - Go to **Service Accounts** tab
   - Click **Generate new private key**
   - Save as `scripts/serviceAccountKey.json`

2. **Run the script:**
```bash
node scripts/createAdmin.js
```

3. **Follow the prompts** to enter email, password, and username

---

## Quick Manual Method (Recommended)

If you just want to get started quickly, use the Firebase Console method above. It takes about 2 minutes and doesn't require any additional setup.

**Default credentials suggestion:**
- Email: `admin@spaceborn.io`
- Password: `Admin@123456`
- Username: `admin`
- Role: `admin`

After creating the admin user, you can create more users (including interns) directly from the application's User Management interface!
