import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import spotifyUrlInfo from 'spotify-url-info';
import fetch from 'isomorphic-fetch';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import https from 'https';

const { getDetails, getTracks } = spotifyUrlInfo(fetch);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const PORT = 3001;

// ── Sanitise filename ────────────────────────────────────────────────────────
function safe(s: string) {
  return s.replace(/[<>:"/\\|?*\u0000]/g, '').trim();
}

// ── Download album art as cover.jpg ─────────────────────────────────────────
function downloadImage(url: string, dest: string): Promise<void> {
  return new Promise((resolve) => {
    if (!url) return resolve();
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', () => resolve()); // non-fatal
  });
}

// ── Playlist metadata ────────────────────────────────────────────────────────
app.get('/api/playlist', async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const details = await getDetails(url);
    const tracks  = await getTracks(url);

    res.json({
      title: details.preview.title,
      image: details.preview.image,
      tracks: tracks.map((t: any, index: number) => ({
        id:        index.toString(),
        name:      t.name,
        artist:    t.artists ? t.artists.map((a: any) => a.name).join(', ') : (t.artist ?? 'Unknown'),
        album:     t.album?.name ?? details.preview.title ?? '',
        duration:  t.duration_ms
          ? `${Math.floor(t.duration_ms / 60000)}:${Math.floor((t.duration_ms % 60000) / 1000).toString().padStart(2, '0')}`
          : '0:00',
        thumbnail: t.album?.images?.[0]?.url || details.preview.image,
      })),
    });
  } catch (err: any) {
    console.error('Playlist fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch playlist metadata' });
  }
});

// ── Download endpoint ────────────────────────────────────────────────────────
app.post('/api/download', async (req, res) => {
  const { tracks, playlistName, quality, socketId, playlistImage } = req.body;
  if (!tracks || !playlistName || !socketId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Save directly to Downloads/<PlaylistName> — no SoundFlow folder
  const downloadDir = path.join(os.homedir(), 'Downloads', safe(playlistName));
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  // Save playlist cover art as folder.jpg
  if (playlistImage) {
    await downloadImage(playlistImage, path.join(downloadDir, 'folder.jpg'));
  }

  res.json({ message: 'Download started', path: downloadDir });

  const total     = tracks.length;
  let   completed = 0;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const searchQuery = `ytsearch1:${track.artist} - ${track.name} official audio`;

    io.to(socketId).emit('progress', {
      trackId: track.id, status: 'downloading', trackProgress: 0,
      overallProgress: Math.round((completed / total) * 100),
    });

    try {
      const filePath = await downloadTrack(searchQuery, track, downloadDir, quality, (p) => {
        io.to(socketId).emit('progress', {
          trackId: track.id, status: 'downloading', trackProgress: p,
          overallProgress: Math.round(((completed + p / 100) / total) * 100),
        });
      });

      // Download individual track thumbnail alongside audio
      if (track.thumbnail) {
        const imgName = safe(`${track.artist} - ${track.name}`) + '.jpg';
        await downloadImage(track.thumbnail, path.join(downloadDir, imgName));
      }

      // Enhance audio with Python
      if (filePath) await enhanceAudio(filePath);

      completed++;
      io.to(socketId).emit('progress', {
        trackId: track.id, status: 'completed', trackProgress: 100,
        overallProgress: Math.round((completed / total) * 100),
      });
    } catch (err) {
      console.error(`Download failed [${track.name}]:`, err);
      io.to(socketId).emit('progress', {
        trackId: track.id, status: 'error',
        overallProgress: Math.round((completed / total) * 100),
      });
    }
  }

  io.to(socketId).emit('done', { path: downloadDir });
});

// ── Download a single track ─────────────────────────────────────────────────
function downloadTrack(
  query: string,
  track: { name: string; artist: string; album?: string },
  outputDir: string,
  quality: string,
  onProgress: (p: number) => void
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const fileName   = safe(`${track.artist} - ${track.name}`);
    let   audioFmt: string;
    let   qualityArgs: string[];

    if (quality.includes('FLAC')) {
      audioFmt    = 'flac';
      qualityArgs = [];
    } else if (quality.includes('WAV')) {
      audioFmt    = 'wav';
      qualityArgs = [];
    } else {
      audioFmt    = 'mp3';
      qualityArgs = ['--audio-quality', '0'];   // VBR best (≈320kbps)
    }

    const args = [
      '--no-playlist',
      '--newline',
      // Select best audio-only stream — no video whatsoever
      '--format', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
      '--output', path.join(outputDir, `${fileName}.%(ext)s`),
      '--extract-audio',
      '--audio-format', audioFmt,
      ...qualityArgs,
      // Metadata injection
      '--add-metadata',
      '--postprocessor-args',
      [
        'ffmpeg:',
        '-metadata', `title=${track.name}`,
        '-metadata', `artist=${track.artist}`,
        '-metadata', `album=${track.album ?? ''}`,
        // Ensure pure audio container (no residual video stream)
        '-vn',
      ].join(' '),
      query,
    ];

    let resolvedPath: string | null = null;
    const child = spawn('yt-dlp', args);

    child.stdout.on('data', (d: Buffer) => {
      const line = d.toString();
      // Capture destination path from yt-dlp output
      const m1 = line.match(/\[ExtractAudio\] Destination:\s*(.+)/);
      if (m1) resolvedPath = m1[1].trim();
      const m2 = line.match(/\[ffmpeg\] Destination:\s*(.+)/);
      if (m2) resolvedPath = m2[1].trim();
      // Progress
      const mp = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
      if (mp) onProgress(parseFloat(mp[1]));
    });

    child.stderr.on('data', (d: Buffer) => {
      const line = d.toString();
      const m1 = line.match(/\[ExtractAudio\] Destination:\s*(.+)/);
      if (m1) resolvedPath = m1[1].trim();
      console.error('[yt-dlp]', line.trim());
    });

    child.on('close', (code) => {
      if (code === 0) {
        if (!resolvedPath) {
          resolvedPath = path.join(outputDir, `${fileName}.${audioFmt}`);
        }
        resolve(resolvedPath);
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
}

// ── Python audio enhancer ────────────────────────────────────────────────────
function enhanceAudio(filePath: string): Promise<void> {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'enhance_audio.py');
    if (!fs.existsSync(scriptPath) || !fs.existsSync(filePath)) return resolve();

    const py = spawn('python', [scriptPath, filePath]);
    py.stdout.on('data', (d: Buffer) => console.log('[enhancer]', d.toString().trim()));
    py.stderr.on('data', (d: Buffer) => console.error('[enhancer]', d.toString().trim()));
    py.on('close', () => resolve());
  });
}

httpServer.listen(PORT, () => {
  console.log(`✅ Spotown server running → http://localhost:${PORT}`);
});
