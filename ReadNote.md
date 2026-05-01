# Install Expo CLI
npm install -g expo-cli

# Create the project
npx create-expo-app@latest MyGroceryListTracker --template blank-typescript

# Go into the project folder
cd MyGroceryListTracker

---

# MyGroceryListTracker — Master Build Guide

## Project Info
- **App Name:** MyGroceryListTracker
- **Framework:** React Native + Expo
- **Language:** TypeScript
- **Currency:** Philippine Peso (₱)
- **Storage:** expo-sqlite (fully offline)
- **Testing:** Expo Go app on Android phone

## ✅ Setup Completed
- Expo project created with blank TypeScript template
- All dependencies installed
- Base App.tsx created

## 📦 Installed Dependencies
```
expo-sqlite
expo-camera
@react-native-ml-kit/text-recognition
react-native-screens
react-native-safe-area-context
@react-navigation/native
@react-navigation/bottom-tabs
react-native-paper
```

## 📁 File Structure
```
MyGroceryListTracker/
├── App.tsx
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── list.tsx
│   ├── scanner.tsx
│   └── history.tsx
├── components/
│   ├── ItemModal.tsx
│   ├── GroceryItem.tsx
│   ├── BudgetBar.tsx
│   ├── SuggestionDropdown.tsx
│   └── ReceiptCard.tsx
├── database/
│   ├── db.ts
│   ├── items.ts
│   ├── list.tsx
│   └── receipts.ts
├── hooks/
│   ├── useOCR.ts
│   ├── useSuggestions.ts
│   └── useBudget.ts
└── constants/
    └── index.ts
```

---

Next - Step 6: OCR Scanner!

---

## 📁 File Structure
```
MyGroceryListTracker/
├── App.tsx
├── app/
│   ├── index.tsx
│   ├── list.tsx
│   └── history.tsx

├── components/

├── database/
│   ├── db.ts
│   ├── items.ts
│   ├── lists.ts
│   └── receipts.ts
├── hooks/
│   ├── useSuggestions.ts

├── constants/

```

---

## 🏗️ Build Steps

### Step 2: Database Setup
- Create `database/db.ts` — SQLite connection + initialize tables
- Create `database/items.ts` — CRUD operations for items
- Create `database/receipts.ts` — save and retrieve receipts
- Update `App.tsx` to call `initDB()` on startup

**Tables:**
- `lists` — id, name, store, budget, created_at
- `items` — id, list_id, name, price, quantity, category, notes, checked
- `receipts` — id, list_id, total, saved_at

### Step 3: Home Screen
- File: `app/index.tsx`
- Show all grocery lists
- Create new list button
- Tap to open list
- Delete a list

### Step 4: Grocery List Screen
- File: `app/list.tsx`
- Show all items in a list
- Manual add item form
- Check off items while shopping
- Running total display
- Budget warning bar
- Save as receipt button

### Step 5: Smart Suggestions
- File: `hooks/useSuggestions.ts`
- Suggest items from past receipts as user types
- Pre-fill last known price
- Highlight price difference from previous receipt

### Step 6: OCR Scanner
- Files: `app/scanner.tsx`, `hooks/useOCR.ts`
- Open camera
- Scan shelf label text
- Extract product name + price
- Open confirmation modal

### Step 7: Confirmation Modal
- File: `components/ItemModal.tsx`
- Editable name, price, quantity, category, notes
- Add to List / Cancel buttons

### Step 8: Receipt History
- File: `app/history.tsx`
- List all saved receipts
- Show date, store, total
- Tap to view full item breakdown

### Step 9: UI Polish
- Bottom tab navigation
- App branding and header
- Splash screen
- Colors, fonts, icons
- ₱ currency throughout

---

npx expo start