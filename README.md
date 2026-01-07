# eRPH Pro - Deployment Guide

This application is powered by Google Gemini AI for lesson planning and Firebase for data persistence. To deploy this successfully to Netlify, follow these steps.

## 1. Obtain API Keys

### Google Gemini API
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Create or find your **API Key**.
3. This will be used for the `API_KEY` variable.

### Firebase Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Add a "Web App" to your project.
4. Note down the `firebaseConfig` object, which looks like this:
   ```js
   {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   }
   ```
5. Enable **Authentication** (Email/Password provider) and **Cloud Firestore** in the Firebase console.

## 2. Configure Netlify Environment Variables

Log in to your Netlify account, go to **Site Settings > Environment Variables**, and add the following keys:

| Key | Value | Purpose |
|-----|-------|---------|
| `API_KEY` | `your_gemini_key` | Powers the AI Lesson Assistant |
| `VITE_FIREBASE_API_KEY` | `apiKey` from config | Firebase Auth & DB |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` from config | Firebase Auth |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` from config | Firestore Database |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` from config | File Storage (Signatures) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | Cloud Messaging |
| `VITE_FIREBASE_APP_ID` | `appId` from config | Firebase Core |

## 3. Build & Deploy

### Build Settings
Netlify should automatically detect these, but verify them in the **Build & Deploy** section:
- **Build command:** `npm run build`
- **Publish directory:** `build` (Note: This project uses `build` as the output directory in `vite.config.ts`)

### Persistence Mode
The application automatically switches between **Demo Mode** (Local Storage) and **Cloud Mode** (Firebase) based on the presence of the `VITE_FIREBASE_API_KEY`. Once you add the environment variables in Netlify and re-deploy, your data will be saved permanently to your Firebase project.

## ⚙️ Project Structure Notes

- **Gemini Service**: Uses the `@google/genai` SDK. It expects `process.env.API_KEY` to be available.
- **Firebase Service**: Uses standard Firebase v11 SDK. It maps `VITE_` prefixed variables from the environment to initialize the database.
- **Super Admin**: The email `cchoong2020@gmail.com` is hardcoded as the Super Admin for system initialization.
