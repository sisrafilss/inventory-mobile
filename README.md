# 📱 Smart Inventory Management - Android Mobile App (Expo & React Native)

A modern, high-performance Android mobile application built with **React Native**, **Expo SDK 52**, and **TypeScript**, seamlessly connected to the Inventory Management System backend API.

---

## 🚀 Key Features

1. **Authentication & Session:**
   - Secure token storage with `expo-secure-store`.
   - **1-Tap Admin Demo Login**: Instantly signs in with seeded credentials (`admin@inventory.local` / `SuperAdminInitialPassword123!`).
   - Dynamic API Host Switcher (configure your computer's local Wi-Fi IP or emulator URL right on screen).

2. **Mobile POS & Barcode Selling:**
   - **Camera Barcode Scanner**: Built using `expo-camera` with live viewfinder and reticle target.
   - **Virtual Barcode Simulation Chips**: Tap demo chips (e.g. Aarong Milk, Pran Frooto, Teer Oil) to test scanning without any physical barcode scanner.
   - Real-time cart drawer with quantity stepper, subtotal, discount, customer selection, and cash/credit payment.
   - **Digital Cash Memo & Receipt**: Generates a clean receipt with itemized breakdown, due/paid status, and 1-tap WhatsApp/SMS/Email sharing.

3. **Products Catalog:**
   - Fast virtualized `FlatList` with search by name, SKU, or barcode.
   - Category filtering and Stock status badges (In Stock, Low Stock, Out of Stock).
   - **Fast Rate Update Modal**: Update selling prices directly on the go.
   - Detailed product view with gross margin calculation and warehouse stock breakdown.

4. **Parties & Dues Management:**
   - Dual-tab list for **Customers** and **Suppliers**.
   - Live Dues Summary (Customer Receivables vs Supplier Payables).
   - **1-Tap Phone Call**: Directly launch the phone dialer (`tel:...`).
   - **Collect / Pay Due Modal**: Record customer debt collections and supplier payments with Cash, bKash, Nagad, or Bank.

5. **Commercial Balance Sheet:**
   - Mobile-first **Trading Account Ledger** (Debit vs Credit).
   - Opening Stock, Purchases, Sales, Closing Stock, and Gross Profit/Loss.
   - Executive financial KPIs: Operating Expenses, Net Operating Income, and Net Working Capital.
   - Filter by Today, This Month, or All Time with 1-tap shareable statement.

6. **Warehouses & Stock Adjustments:**
   - Track inventory across warehouses.
   - Stock adjustments (Restock, Damage, Loss, Return, Correction) with audit notes.

7. **Procurement & Operating Expenses:**
   - Supplier purchase bills list with paid and due status.
   - Daily expense tracker categorized by Rent, Electricity, Salaries, Tea/Snacks, Transport, etc.

---

## 🛠️ How to Run on Android

### 1. Install Dependencies
In your terminal, navigate to the `mobile` folder:
```bash
cd mobile
pnpm install
```

### 2. Configure Backend API Connection
When running on a physical Android phone, `localhost` points to the phone itself.
To connect to your computer's backend:
1. Find your computer's local IP address on Wi-Fi:
   - On Windows PowerShell: Run `ipconfig` and look for **IPv4 Address** (e.g. `192.168.0.105` or `192.168.1.10`).
2. Your backend runs on port `5000`:
   - URL: `http://<YOUR_IP>:5000/api` (e.g. `http://192.168.0.105:5000/api`).
3. You can also change the API Base URL directly inside the mobile app on the **Sign In** screen or in the **More -> API Server URL** settings!

> **Android Emulator**: If running inside an Android Studio emulator, use `http://10.0.2.2:5000/api`.

### 3. Start the Backend
In a separate terminal:
```bash
cd backend
pnpm dev
```

### 4. Start the Mobile App
In the `mobile` directory, run:
```bash
cd mobile
pnpm start
```

This will launch the Metro bundler and display a **QR code** in your terminal.

### 5. Open on Your Android Phone
1. Install the free **Expo Go** app from the Google Play Store on your Android device.
2. Ensure your phone and computer are on the **same Wi-Fi network**.
3. Open Expo Go and scan the QR code displayed in your terminal.
4. The app will build and launch immediately on your device with fast hot reloading!

