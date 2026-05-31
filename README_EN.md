> [!NOTE]
> This project is a fork of [imsyy/home](https://github.com/imsyy/home), with added features including a visual admin panel, Xiaomi Weather API integration, and multi-source weather auto-fallback. Thanks to the original author.

<p align="center">
  <strong><h2>🏠 Personal Homepage</h2></strong>
  A minimal personal homepage with weather, music, hitokoto, and time capsule.
</p>

![Screenshot](/screenshots/main.jpg)

> Forked from [imsyy/home](https://github.com/imsyy/home), with visual admin panel and multi-source weather fallback added.

---

## ✨ Features

- [x] Loading animation
- [x] Site intro / Hitokoto quotes
- [x] Date & time / Time progress bar
- [x] **Live weather — 5-source auto fallback** (Xiaomi / Amap / Open-Meteo / wttr.in)
- [x] Music player (NetEase / QQ Music)
- [x] **Visual admin panel** (`Ctrl+Shift+E`, password-protected)
- [x] Mobile responsive / PWA offline support

---

## 🚀 Quick Start

```bash
git clone https://github.com/rswcdcbxc/zhuye.git
cd zhuye
cp .env.example .env
pnpm install
pnpm dev      # development
pnpm build    # production → dist/
```

---

## 🔧 Admin Panel

Edit contacts, site links, and info **without touching code**.

| Entry | Method |
| --- | --- |
| Shortcut | `Ctrl + Shift + E` |
| Footer | Click the gear icon in the footer |

- 🔗 Social Links — add/edit/remove + drag to reorder
- 🌐 Site Links — add/edit/remove + icon picker
- 📝 Site Info — name, author, description, ICP, etc.
- 🔑 Change Password — default is `admin`
- 📥 Export / 📤 Import JSON config

> Config is stored in localStorage. Export JSON for permanent deployment.

---

## ☁ Weather

5 sources with automatic fallback:

| Priority | Source | Note |
| --- | --- | --- |
| 1 | Xiaomi Weather | Free, richest data (AQI, minutely rain, 15-day forecast) |
| 2 | Amap (高德) | Requires API key |
| 3 | Open-Meteo | Free, global |
| 4 | wttr.in | Free, IP-based |
| 5 | Backup | Legacy fallback |

> Works out of the box — no API key needed.

---

## 🛠 Tech Stack

- Vue 3 + Vite 4
- Pinia (state + localStorage persistence)
- Element Plus / IconPark / xicons
- Aplayer / Swiper / PWA

---

## 📄 License

Based on [imsyy/home](https://github.com/imsyy/home).
