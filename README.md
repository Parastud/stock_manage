# Stock Manage 📦

A mobile stock and inventory management app built with Expo (React Native). Designed to help track, manage, and monitor stock levels on the go.


---

## ✨ Features

- 📦 Add, update, and remove stock items
- 📊 Track inventory levels in real time
- 📱 Cross-platform — runs on Android and iOS
- 🎨 Styled with NativeWind (Tailwind CSS for React Native)
- 🗂️ File-based routing via Expo Router
- 🚀 EAS Build configured for Play Store / App Store deployment

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo (React Native) |
| Routing | Expo Router (file-based) |
| Styling | NativeWind / Tailwind CSS |
| Language | JavaScript |
| Build | EAS Build |

---

## 📁 Project Structure

```
stock_manage/
├── app/              # Expo Router screens (file-based routing)
├── src/              # Components, hooks, utilities
├── assets/           # Images, fonts, icons
├── app.json          # Expo config
├── eas.json          # EAS Build config
├── tailwind.config.js
└── global.css
```


## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- Expo CLI — `npm install -g expo-cli`
- EAS CLI — `npm install -g eas-cli` *(for builds only)*
- Expo Go app on your phone *(for quick preview)*

### Installation

```bash
# Clone the repository
git clone https://github.com/Parastud/stock_manage.git
cd stock_manage

# Install dependencies
npm install

# Start the development server
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS) to preview on your device.

### Running on Emulator

```bash
# Android
npx expo start --android

# iOS
npx expo start --ios
```

---

## 📦 Building for Production

```bash
# Android APK / AAB
eas build --platform android

# iOS IPA
eas build --platform ios
```

Make sure you're logged in to your Expo account (`eas login`) before building.

---

## 🤝 Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> Built by [Parth Sharma](https://github.com/parastud)
