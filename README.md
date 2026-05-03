# 🛒 MyGroceryListTracker

A fully offline grocery list tracker built with **Expo + React Native + TypeScript**.  
Track items, set budgets, scan receipts, and review your shopping history — no internet required.

---

## 📱 About

MyGroceryListTracker helps you plan and track grocery shopping trips on your Android phone.  
Everything is stored locally using SQLite — no accounts, no cloud, no internet needed.

---

## ✨ Features (v1.0.0)

- 📝 Create and manage multiple grocery lists with store name and budget
- ➕ Add, edit, and delete items with category, quantity, price, and notes
- ✔️ Check off items while shopping with a running total
- 💰 Budget progress bar with over-budget warning
- 🧾 Save shopping sessions as receipts
- 📜 Receipt history grouped by month with full item breakdown
- ♻️ Reuse a past receipt as a new grocery list in one tap
- 🔍 Smart item suggestions from past receipts as you type
- ❌ Permanently dismiss unwanted suggestions
- 🗑️ Bulk delete lists and receipts with select mode
- 💾 Fully offline — SQLite storage, no internet required
- 🇵🇭 Philippine Peso (₱) currency throughout

---

## 🧱 Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo + React Native |
| Language | TypeScript |
| Storage | expo-sqlite |
| Navigation | React Navigation (Stack + Bottom Tabs) |
| Icons | react-native-svg |
| Safe Area | react-native-safe-area-context |

---

## 📁 Project Structure

```
MyGroceryListTracker/
├── App.tsx                  # Root navigator
├── app/
│   ├── index.tsx            # My Lists screen
│   ├── list.tsx             # Grocery list screen
│   └── history.tsx          # Receipt history screen
├── database/
│   ├── db.ts                # SQLite init + migrations
│   ├── items.ts             # Item CRUD
│   ├── lists.ts             # List CRUD
│   └── receipts.ts          # Receipt CRUD
├── hooks/
│   ├── useSuggestions.ts    # Smart item suggestions
│   └── useBudget.ts         # Budget calculation hook
├── constants/
│   └── index.ts             # Colors, categories, currency
└── assets/
    ├── icon.png
    ├── adaptive-icon.png
    └── splash-icon.png
```

---

## ⚙️ Setup

### Install dependencies
```bash
npm install
```

### Start the app
```bash
npx expo start
```

### Run on your phone
1. Install **Expo Go** from the Play Store
2. Run `npx expo start`
3. Scan the QR code with your camera

---

## 🗄️ Database

Uses **expo-sqlite** with three tables:

- `lists` — grocery list name, store, budget
- `items` — name, price, quantity, category, notes, checked state
- `receipts` — saved shopping sessions linked to a list
- `dismissed_suggestions` — permanently hidden suggestion names

All migrations run automatically on first launch.

---

## 🚧 Todo (v2.0.0)

### 📷 OCR Receipt Scanner
- [ ] Add `app/scanner.tsx` screen with camera view
- [ ] Add `hooks/useOCR.ts` using `@react-native-ml-kit/text-recognition`
- [ ] Extract product name + price from shelf label photos
- [ ] Open `components/ItemModal.tsx` confirmation before adding to list
- [ ] Wire scanner button into the grocery list screen

### 🔔 Reminders
- [ ] Install `expo-notifications`
- [ ] Let users set a reminder day/time per list (e.g. "Remind me every Saturday 9am")
- [ ] Show push notification with list name and item count

---

## 🚀 Publishing to Google Play Store (when ready)

Follow these steps in order:

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Create a free Expo account
Go to [expo.dev](https://expo.dev) and sign up.

### 3. Log in and link your project
```bash
eas login
eas init
```
This fills in the `projectId` in `app.json` automatically.

### 4. Update `app.json`
Make sure these fields are set with your own unique package name:
```json
"android": {
  "package": "com.yourname.mygrocerylisttracker",
  "versionCode": 1
}
```
The package name must be unique on the Play Store and can never be changed after publishing.

### 5. Create `eas.json` in your project root
```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

### 6. Build a test APK (side-load on your phone)
```bash
eas build --platform android --profile preview
```
EAS builds it in the cloud (~5–10 min) and gives you a download link for the `.apk`.

### 7. Build for Play Store
```bash
eas build --platform android --profile production
```
This outputs an `.aab` (Android App Bundle) file.

### 8. Set up Google Play Console
- Go to [play.google.com/console](https://play.google.com/console)
- Pay the one-time $25 developer registration fee
- Create a new app
- Fill in the store listing: title, description, screenshots, category (Productivity)
- Upload the `.aab` from step 7 to the Internal Testing track first
- Test it, then promote to Production

### 9. Before each new release
- Bump `"version"` in `app.json` (e.g. `"1.1.0"`)
- Increment `"versionCode"` by 1 (e.g. `2`) — Play Store requires this to increase with every upload
- Rebuild with `eas build --platform android --profile production`
- Upload the new `.aab` to Play Console

---

## 👨‍💻 Author

Built by Melvs.

---

## 📄 License

MIT