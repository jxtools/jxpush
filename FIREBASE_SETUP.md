# How to Get Firebase Admin SDK Service Account

## ❌ Current Issue

You have a `google-services.json` file (for Android client apps), but `jxpush` needs a **Firebase Admin SDK service account** file (for server-side use).

## ✅ How to Get the Correct File

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project (e.g., **my-app-project**)

### Step 2: Navigate to Service Accounts
1. Click the **⚙️ gear icon** (Settings) in the left sidebar
2. Click **Project settings**
3. Go to the **Service accounts** tab

### Step 3: Generate Private Key
1. You'll see a section that says "Firebase Admin SDK"
2. Select **Node.js** as the language
3. Click **Generate new private key**
4. Click **Generate key** in the confirmation dialog

### Step 4: Save the File
1. A JSON file will download (e.g., `my-app-project-firebase-adminsdk-xxxxx.json`)
2. **Rename it to**: `firebase-service-account.json`
3. **Move it to your project root**: `./firebase-service-account.json`
4. This file is already in `.gitignore` and won't be committed

## 🔍 What the Correct File Looks Like

The **correct** service account file should have these fields:

```json
{
  "type": "service_account",
  "project_id": "my-app-project",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@my-app-project.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/..."
}
```

## ⚠️ Important Notes

- **Never commit this file to Git** - It contains sensitive credentials
- The file is already in `.gitignore`
- Keep this file secure - it has admin access to your Firebase project

## 🚀 After Getting the File

Once you have the correct service account file, run:

```bash
npm run test:integration
```

The tests will send real notifications to your device! 🎉
