# 🎵 Spotown — Spotify Playlist Downloader

> Download your Spotify playlists, albums and tracks in **MP3**, **FLAC (Lossless)**, or **WAV** — with full metadata, album art, and audio enhancement. Beautiful glass-morphic UI included.

![Spotown Banner](https://github.com/Varun7009/Spotown/raw/main/Background.jpg)

---

## ✨ Features

- 🎧 **Download any Spotify playlist, album, or track**
- 🎼 **3 quality options**: MP3 (320kbps), FLAC (Lossless), WAV (Studio)
- 🖼️ **Album art saved** alongside every track (+ `folder.jpg` for the playlist)
- 🏷️ **Full metadata**: Title, Artist, Album embedded into every file
- 🔊 **Audio enhancement** via Python — EBU R128 normalization + EQ boost
- 🌑 **Premium dark glass UI** — looks stunning, runs smooth
- 📂 Downloads go directly to `Downloads/<Playlist Name>/` — no extra folders

---

## 🖥️ Requirements

Before running Spotown you need these tools on your system:

| Tool | Purpose | Download |
|------|---------|----------|
| **Node.js LTS** | Runs the backend server | [nodejs.org](https://nodejs.org) |
| **Python 3.x** | Runs the audio enhancer | [python.org](https://www.python.org/downloads) |
| **FFmpeg** | Audio conversion and processing | [ffmpeg.org](https://ffmpeg.org/download.html) |
| **yt-dlp** | Downloads audio from YouTube | [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp#installation) |

> **Tip for Windows users:** Just run `install.bat` and it installs everything automatically (see below)!

---

## 🚀 Quick Start (Windows)

### Step 1 — Download the project

Click the green **Code** button above → **Download ZIP** → Extract it anywhere on your PC.

### Step 2 — Install everything (one click)

Double-click **`install.bat`** inside the folder.

It will:
- Detect what you already have installed
- Show you exactly what needs to be downloaded and how big it is
- Ask for your confirmation before installing anything
- Install Node.js, Python, FFmpeg, yt-dlp and all app packages automatically

> After it finishes, **close the window and open a new one** so your system PATH refreshes.

### Step 3 — Run the app

Double-click **`start.bat`**.

That's it. Your browser will open automatically at `http://localhost:3000`.

---

## 🔧 Manual Setup (Mac / Linux / Advanced Windows)

If you prefer doing it manually:

```bash
# 1. Install Node.js, Python, FFmpeg and yt-dlp using your package manager
# (brew on Mac, apt on Ubuntu, etc.)

# 2. Clone or download this repo
cd Spotown

# 3. Install app dependencies
npm install

# 4. Start the backend server (keep this terminal open)
npx ts-node server.ts

# 5. In a NEW terminal, start the frontend
npm run dev

# 6. Open your browser at
http://localhost:3000
```

---

## 📖 How to Use

1. **Paste a Spotify link** — playlist, album, or single track URL
2. **Click Fetch** — it loads all your tracks with names and durations
3. **Choose your quality** — MP3 (320kbps), FLAC Lossless, or WAV
4. **Rename the folder** if you want (defaults to the playlist name)
5. **Click Download** — watch the live per-track progress bar
6. **Find your music** at `Downloads/<Playlist Name>/`

Every song gets:
- The audio file (`Artist - Title.mp3/.flac/.wav`)
- The album art image (`Artist - Title.jpg`)
- The playlist cover (`folder.jpg`)
- Full ID3 tags (title, artist, album)

---

## 📁 Project Structure

```
Spotown/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # Top navigation
│   │   ├── Hero.tsx            # Landing section
│   │   ├── DownloaderForm.tsx  # Main download UI
│   │   ├── Background.tsx      # Animated background
│   │   └── Footer.tsx          # Footer
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Global dark glass styles
├── server.ts                   # Express + Socket.io backend
├── enhance_audio.py            # Python audio enhancer (ffmpeg)
├── install.bat                 # One-click Windows installer
├── start.bat                   # One-click launcher
├── package.json
└── vite.config.ts
```

---

## 🎛️ Audio Quality Guide

| Format | Best for | File size |
|--------|----------|-----------|
| **MP3 (320kbps)** | Everyday listening, saves space | Small |
| **FLAC (Lossless)** | Audiophiles, perfect quality, no data loss | Large |
| **WAV** | Music production, maximum compatibility | Largest |

> All formats get **EBU R128 loudness normalization** and a subtle presence EQ boost applied automatically.

---

## ⚠️ Disclaimer

This tool is for **personal, educational use only**.

- It is **not affiliated** with Spotify AB in any way.
- Only download music you have the **legal right** to download in your region.
- The developers are **not responsible** for misuse.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite
- **Backend**: Node.js, Express, Socket.io, yt-dlp
- **Audio Processing**: Python 3, FFmpeg
- **Metadata**: spotify-url-info, yt-dlp `--add-metadata`

---

## 📬 Support

Found a bug or have a question? [Open an issue](https://github.com/Varun7009/Spotown/issues) on GitHub.

---

<div align="center">
Made with ♥ for audiophiles
</div>
