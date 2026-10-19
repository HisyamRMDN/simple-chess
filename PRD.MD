# Product Requirements Document: Vibe Chess

## 1. Overview

Aplikasi catur berbasis web modern dan interaktif yang mendukung mode lokal (Player vs Player) serta mode PvE melawan AI. Aplikasi ini dirancang dengan antarmuka pengguna yang elegan, pengaturan tema yang dinamis, dan pengalaman bermain yang imersif (vibe-focused).

## 2. Tech Stack

- **Frontend Architecture:** React.js dengan Vite (ES6+, JSX).
- **Styling:** Tailwind CSS untuk desain responsif dan styling utilitas yang cepat.
- **Chess Logic:** Library `chess.js` untuk validasi gerakan legal, skak, skakmat, dan notasi FEN/PGN.
- **AI Engine:** `stockfish.js` terintegrasi dengan _artificial delay_ agar pergerakan komputer terasa natural.
- **State Management:** React Hooks (`useState`, `useEffect`) untuk mengelola status alur permainan (Landing -> Setup -> Game).

## 3. Core Features (Implemented)

- **Sistem Navigasi Berlapis:**
    - **Landing Menu:** Halaman awal yang bersih (_hero section_) sebelum masuk ke konfigurasi.
    - **Setup Screen:** Pemilihan mode (Lokal/Bot), pengaturan waktu permainan (Bullet, Blitz, Rapid), dan pemilihan warna bidak.
- **Papan Catur Interaktif:**
    - Papan 8x8 dengan dukungan _drag-and-drop_ dan klik untuk memindahkan bidak.
    - Indikator visual/highlight untuk langkah terakhir dan kotak langkah legal.
    - UI Modal Promosi Bidak (Pawn Promotion) kustom.
- **Pengalaman Visual & Audio (Vibe):**
    - **Pengaturan Tema:** Sistem Dark Mode & Light Mode yang disimpan via `localStorage`.
    - **Audio Latar:** Fitur Background Music (BGM) bernuansa _lo-fi/calm_ dengan _toggle_ On/Off.
    - **SFX:** Efek suara saat bidak melangkah atau melakukan _capture_.
- **Mekanik Waktu & Histori:**
    - Jam catur (_Timer_) dinamis yang menyesuaikan giliran pemain.
    - Pencatatan riwayat langkah (Move History).

## 4. Phase 2: Future Roadmap (Competitive Update)

- Sistem notifikasi _Killfeed_ untuk momen penting (Skak, Capture Perwira).
- _Post-Match Analytics_ untuk menampilkan akurasi langkah membandingkan evaluasi Stockfish.
- Efek _3D tilt_ pada papan catur saat di-_hover_ menggunakan kursor.
- Mode Online Multiplayer berbasis WebSocket (Node.js & Socket.io) untuk bermain dengan teman jarak jauh.
