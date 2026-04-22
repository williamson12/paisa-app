# Paisa 💰
### Premium Personal Finance Tracker for India

A production-ready, mobile-first expense tracker built with React + Firebase. Tracks every rupee, syncs across devices via Google Sign-In, and provides AI-powered CA advice via Gemini.

---

## ✨ Features

- **Google Sign-In** — Secure auth. Data syncs to your account across all devices.
- **Expense & Income Tracking** — 15 categories, 7 payment modes, date + note.
- **Live Dashboard** — Balance, savings rate, budget ring, financial health score.
- **AI CA Advisor** — Gemini-powered personalised Indian finance advice (SIP, FD, PPF, ELSS).
- **Charts & Insights** — Last 7 days bar chart, category pie chart, payment method breakdown.
- **Offline Fallback** — localStorage backup if Firestore is unreachable.
- **Error Boundary** — No blank screens; graceful recovery on unexpected errors.
- **PWA-ready** — Installable on iOS/Android homescreen.

---

## 🚀 Setup

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd Expens
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Firebase — https://console.firebase.google.com
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Gemini — https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_key
```

> ⚠️ **Important:** Always restart `npm run dev` after editing `.env` for Vite to pick up new variables.

### 3. Firebase Console Setup
1. Enable **Firestore Database** (Start in production mode).
2. Enable **Authentication → Google provider**.
3. Under **Authentication → Settings → Authorized Domains**, add:
   - `localhost`
   - Your Netlify/Vercel domain (e.g. `paisa-tracker.netlify.app`)

### 4. Firestore Security Rules
In Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🛠 Development

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

---

## 🌐 Deployment (Netlify)

1. Push to GitHub.
2. Connect repo in Netlify → Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Add all `VITE_*` environment variables in **Netlify → Site Settings → Environment Variables**.
4. Add your Netlify domain to Firebase Authorized Domains.

---

## 🔑 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Recharts, Vite |
| Auth | Firebase Authentication (Google) |
| Database | Cloud Firestore |
| AI | Google Gemini 1.5 Flash |
| Styling | Vanilla CSS (Glassmorphism, dark mode) |
| Fonts | Bricolage Grotesque, Outfit |

---

## 📁 Project Structure

```
src/
├── App.jsx          # All components (monolith for performance)
├── lib/
│   └── firebase.js  # Firebase init + exports
└── main.jsx         # React entry point
```

---

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| "API key missing" on CA Advisor | Add `VITE_GEMINI_API_KEY` to `.env` and restart dev server |
| "auth/popup-closed-by-user" | User dismissed the Google popup — try again |
| "auth/unauthorized-domain" | Add your domain to Firebase Authorized Domains |
| Data not syncing | Check Firestore rules and internet connection |
| Blank screen | Hard refresh (`Ctrl+Shift+R`) or clear cache |

---

*Built with ❤️ for India*
