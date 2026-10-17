# Product Requirements Document: Simple Web Chess

## 1. Overview

Aplikasi catur berbasis web yang sederhana, interaktif, dan bisa dimainkan oleh dua pemain (Player vs Player) di perangkat yang sama (Local Multiplayer).

## 2. Tech Stack

- Frontend: HTML, CSS, JavaScript modern (ES6 Modules)
- Styling: Tailwind CSS (via CDN untuk kesederhanaan) atau CSS murni.
- Logic: Gunakan library open-source `chess.js` untuk memvalidasi gerakan legal, skak, dan skakmat agar tidak perlu membuat ulang aturan catur dari nol.
- UI Board: Gunakan library `chessboard.js` atau bangun papan 8x8 kustom menggunakan CSS Grid.

## 3. Core Features

- Papan catur 8x8 dengan warna kotak selang-seling.
- Render bidak catur (menggunakan ikon SVG atau Unicode).
- Pemain bisa melakukan _drag-and-drop_ atau klik-klik untuk memindahkan bidak.
- Validasi gerakan: Bidak hanya bisa pindah ke kotak yang diizinkan (legal moves).
- Indikator status: Menampilkan giliran siapa (Putih/Hitam) dan status permainan (Skak, Skakmat, Seri).
- Tombol "Reset Game".

## 4.phase 2 : fitur-fitur tambahan

- efek suara: ketika memindahkan bidak, efek suara akan berlaku.
- efek efek suara: ketika memindahkan bidak, efek suara akan berlaku.
- Tema Papan (Board Themes)
- Jam Catur (Chess Timer)
- Riwayat Langkah & Bidak Terbuang
- Bermain vs Komputer (Integrasi Stockfish)
