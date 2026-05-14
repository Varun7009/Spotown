/**
 * DownloaderForm — optimized for performance and clean UI.
 * - rAF-batched socket progress updates
 * - React.memo on every track row
 * - CSS transform:scaleX for progress (GPU composited)
 * - Custom dropdown rendered in a fixed portal — always on top
 */

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  memo,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  Search,
  FolderOpen,
  Settings2,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Music2,
  Database,
  Zap,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { io, type Socket } from "socket.io-client";

// ─── Types ─────────────────────────────────────────────────────────────────
type Status = "wait" | "downloading" | "completed" | "error";

type Track = {
  id: string;
  name: string;
  artist: string;
  duration: string;
  thumbnail: string;
  status: Status;
  progress: number;
};

// ─── TrackRow ───────────────────────────────────────────────────────────────
const TrackRow = memo(function TrackRow({
  track,
  index,
}: {
  track: Track;
  index: number;
}) {
  return (
    <div className="track-row grid grid-cols-[44px_1fr_auto] md:grid-cols-[44px_1fr_1fr_130px] items-center gap-2 px-5 py-3.5">
      <span className="text-[11px] font-mono text-white/30 text-center">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{track.name}</p>
        <p className="text-xs text-white/40 truncate md:hidden">{track.artist}</p>
      </div>
      <p className="text-xs text-white/40 truncate hidden md:block">{track.artist}</p>
      <div className="flex items-center justify-end md:justify-start">
        {track.status === "wait" && (
          <span className="badge-wait text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            Queue
          </span>
        )}
        {track.status === "downloading" && (
          <div className="w-full max-w-[110px] flex flex-col gap-1.5">
            <span className="badge-downloading text-[10px] font-bold flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 spin" />
              {track.progress}%
            </span>
            <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-g bar-fill rounded-full"
                style={{ transform: `scaleX(${track.progress / 100})` }}
              />
            </div>
          </div>
        )}
        {track.status === "completed" && (
          <span className="badge-done text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
            <CheckCircle2 className="w-3 h-3" />
            Done
          </span>
        )}
        {track.status === "error" && (
          <span className="badge-error text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
            <XCircle className="w-3 h-3" />
            Error
          </span>
        )}
      </div>
    </div>
  );
});

// ─── Skeleton Row ────────────────────────────────────────────────────────────
function SkeletonRow({ i }: { i: number }) {
  return (
    <div
      className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[44px_1fr_1fr_130px] items-center gap-2 px-5 py-3.5 border-b border-white/[0.04]"
      style={{ animationDelay: `${i * 0.04}s` }}
    >
      <div className="shimmer h-3 w-6 rounded mx-auto" />
      <div className="space-y-2">
        <div className="shimmer h-3 rounded w-3/5" />
        <div className="shimmer h-2.5 rounded w-2/5" />
      </div>
      <div className="shimmer h-3 rounded w-20 hidden md:block" />
      <div className="shimmer h-5 rounded-full w-14 hidden md:block" />
    </div>
  );
}

// ─── Quality Portal — always topmost, tracks scroll position ────────────────
function QualityPortal({
  triggerRef,
  dropdownRef,
  quality,
  options,
  onSelect,
  onClose,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  quality: string;
  options: readonly string[];
  onSelect: (opt: string) => void;
  onClose: () => void;
}) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Recompute position — called on mount and on every scroll/resize
  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    // If trigger has scrolled off screen, close the dropdown
    if (r.bottom < 0 || r.top > window.innerHeight) {
      onClose();
      return;
    }
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  }, [triggerRef, onClose]);

  useLayoutEffect(() => {
    reposition();
    window.addEventListener('scroll', reposition, { passive: true, capture: true });
    window.addEventListener('resize', reposition, { passive: true });
    return () => {
      window.removeEventListener('scroll', reposition, { capture: true });
      window.removeEventListener('resize', reposition);
    };
  }, [reposition]);

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 99999,
        borderRadius: "16px",
        overflow: "hidden",
        background: "rgba(6, 6, 6, 0.85)",
        backdropFilter: "blur(32px) saturate(220%)",
        WebkitBackdropFilter: "blur(32px) saturate(220%)",
        border: "1px solid rgba(255,255,255,0.13)",
        boxShadow: "0 28px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(opt);
          }}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "14px 20px",
            fontSize: "13px",
            fontWeight: 600,
            background: opt === quality ? "rgba(29,185,84,0.12)" : "transparent",
            color: opt === quality ? "#1DB954" : "rgba(255,255,255,0.85)",
            cursor: "pointer",
            border: "none",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (opt !== quality) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            if (opt !== quality) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          {opt}
        </button>
      ))}
    </div>,
    document.body
  );
}

// ─── Info Cards ──────────────────────────────────────────────────────────────
const INFO_CARDS = [
  {
    icon: Music2,
    title: "Metadata Embedded",
    body: "Full ID3 tags, high-res album artwork baked into every file.",
  },
  {
    icon: Database,
    title: "Smart Folders",
    body: "Tracks auto-organized by playlist and artist name.",
  },
  {
    icon: Zap,
    title: "Parallel Fetch",
    body: "Concurrent downloads with live per-track progress.",
  },
] as const;

const QUALITY_OPTIONS = ["MP3 (320kbps)", "FLAC (Lossless)", "WAV (Uncompressed)"];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DownloaderForm() {
  const [url, setUrl] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [playlistImage, setPlaylistImage] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [quality, setQuality] = useState("MP3 (320kbps)");
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const [phase, setPhase] = useState<"idle" | "searching" | "ready" | "downloading" | "done">("idle");
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [donePath, setDonePath] = useState("");

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const pendingRef = useRef<Map<string, { status: Status; progress?: number }>>(new Map());
  const rafRef = useRef<number | null>(null);
  const latestOverallRef = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showQualityDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setShowQualityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showQualityDropdown]);

  // Socket setup
  useEffect(() => {
    const sock = io("http://localhost:3001");
    socketRef.current = sock;

    sock.on(
      "progress",
      (data: {
        trackId: string;
        status: string;
        trackProgress?: number;
        overallProgress: number;
      }) => {
        pendingRef.current.set(data.trackId, {
          status: data.status as Status,
          progress: data.trackProgress,
        });
        latestOverallRef.current = data.overallProgress;

        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const updates = new Map(pendingRef.current);
            pendingRef.current.clear();

            setTracks((prev) =>
              prev.map((t) => {
                const u = updates.get(t.id);
                if (!u) return t;
                return { ...t, status: u.status, progress: u.progress ?? t.progress };
              })
            );
            setOverallProgress(latestOverallRef.current);
          });
        }
      }
    );

    sock.on("done", (data: { path: string }) => {
      setPhase("done");
      setDonePath(data.path);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      sock.disconnect();
    };
  }, []);

  const handleSearch = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!url.trim()) return;
      setPhase("searching");
      setError(null);

      try {
        const res = await fetch(
          `http://localhost:3001/api/playlist?url=${encodeURIComponent(url)}`
        );
        if (!res.ok) throw new Error("Could not fetch playlist — check the URL.");
        const data = await res.json();

        setTracks(
          data.tracks.map((t: Omit<Track, "status" | "progress">) => ({
            ...t,
            status: "wait" as Status,
            progress: 0,
          }))
        );
        setPlaylistName(data.title);
        setPlaylistImage(data.image);
        setPhase("ready");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setPhase("idle");
      }
    },
    [url]
  );

  const startDownload = useCallback(async () => {
    if (!socketRef.current?.id) return;
    setPhase("downloading");
    setOverallProgress(0);
    latestOverallRef.current = 0;
    setError(null);

    try {
      const res = await fetch("http://localhost:3001/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracks,
          playlistName,
          quality,
          playlistImage,
          socketId: socketRef.current.id,
        }),
      });
      if (!res.ok) throw new Error("Download failed to start.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("ready");
    }
  }, [tracks, playlistName, quality]);

  const reset = useCallback(() => {
    setPhase("idle");
    setUrl("");
    setTracks([]);
    setPlaylistName("");
    setPlaylistImage("");
    setOverallProgress(0);
    setError(null);
    setDonePath("");
  }, []);

  const isSearching = phase === "searching";
  const showPreview = phase === "ready" || phase === "downloading" || phase === "done";

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-16">

      {/* ── Search Form ───────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="fade-up space-y-3 mb-8">
        {/* URL Row */}
        <div className="relative flex items-center">
          <Search className="absolute left-5 w-5 h-5 text-white/30 pointer-events-none z-10" />
          <input
            type="url"
            placeholder="Paste Spotify playlist, album or track URL…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSearching}
            className="w-full rounded-2xl py-4 pl-14 pr-40 text-sm font-semibold
                       bg-[#0d0d0d]/80 border border-white/[0.08]
                       text-white placeholder:text-white/30
                       focus:outline-none focus:border-g/40
                       transition-all duration-200 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSearching || !url.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 rounded-xl text-sm font-bold
                       bg-g text-black flex items-center gap-2
                       hover:brightness-110 active:scale-95
                       transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSearching ? <Loader2 className="w-4 h-4 spin" /> : <Download className="w-4 h-4" />}
            {isSearching ? "Fetching…" : "Get Tracks"}
          </button>
        </div>

        {/* Settings Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Folder Name */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-3
                          bg-[#0d0d0d]/80 border border-white/[0.08]
                          focus-within:border-g/40 transition-all duration-200 group">
            <Music2 className="w-4 h-4 text-white/30 group-focus-within:text-g transition-colors shrink-0" />
            <input
              type="text"
              placeholder="Folder name…"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-semibold
                         text-white placeholder:text-white/30 flex-1 min-w-0"
            />
          </div>

          {/* Quality — Portal Dropdown (renders at body level, always top layer) */}
          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setShowQualityDropdown((v) => !v)}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3
                         bg-[#0d0d0d]/80 border border-white/[0.08]
                         text-white text-sm font-semibold
                         hover:border-white/15 active:scale-[0.99]
                         transition-all duration-200"
            >
              <Settings2 className="w-4 h-4 text-white/40 shrink-0" />
              <span className="flex-1 text-left">{quality}</span>
              <ChevronDown
                className={`w-4 h-4 text-white/40 transition-transform duration-300 ${
                  showQualityDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showQualityDropdown && <QualityPortal
              triggerRef={triggerRef}
              dropdownRef={dropdownRef}
              quality={quality}
              options={QUALITY_OPTIONS}
              onSelect={(opt) => { setQuality(opt); setShowQualityDropdown(false); }}
              onClose={() => setShowQualityDropdown(false)}
            />}
          </div>
        </div>
      </form>

      {/* ── Error Banner ───────────────────────────────────────────── */}
      {error && (
        <div className="fade-up mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Skeleton Loading ───────────────────────────────────────── */}
      {isSearching && (
        <div className="fade-up rounded-2xl overflow-hidden mb-6"
             style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="shimmer h-4 rounded w-48 mb-2" />
            <div className="shimmer h-3 rounded w-24" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} i={i} />)}
        </div>
      )}

      {/* ── Playlist Preview + Track List ─────────────────────────── */}
      {showPreview && (
        <div className="fade-up space-y-4">

          {/* Playlist Header */}
          <div className="rounded-2xl p-5 flex items-center gap-5"
               style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0 bg-white/5">
              {playlistImage && (
                <img
                  src={playlistImage}
                  alt={playlistName}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-g uppercase tracking-widest mb-1">
                Playlist Ready
              </p>
              <h2 className="text-xl md:text-2xl font-black text-white truncate">{playlistName}</h2>
              <p className="text-sm text-white/40 mt-1">{tracks.length} tracks · {quality}</p>
            </div>
            {phase === "ready" && (
              <button
                onClick={startDownload}
                className="bg-g text-black font-bold shrink-0 px-6 py-3 rounded-xl text-sm
                           flex items-center gap-2 hover:brightness-110 active:scale-95
                           transition-all duration-150 shadow-lg shadow-g/20"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
          </div>

          {/* Overall Progress Bar */}
          {phase === "downloading" && (
            <div className="rounded-xl px-5 py-4 space-y-2.5"
                 style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white/60 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 spin text-g" />
                  Downloading…
                </span>
                <span className="text-g font-mono">{overallProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-g rounded-full bar-fill"
                  style={{ transform: `scaleX(${overallProgress / 100})` }}
                />
              </div>
            </div>
          )}

          {/* Track Table */}
          <div className="rounded-2xl overflow-hidden"
               style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
            {/* Table Header */}
            <div className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[44px_1fr_1fr_130px] gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest text-center">#</span>
              <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Track</span>
              <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest hidden md:block">Artist</span>
              <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest hidden md:block">Status</span>
            </div>

            {/* Rows */}
            <div className="scroll" style={{ maxHeight: "420px" }}>
              {tracks.map((track, i) => (
                <TrackRow key={track.id} track={track} index={i} />
              ))}
            </div>
          </div>

          {/* Reset Button */}
          {phase !== "downloading" && (
            <div className="flex justify-end">
              <button
                onClick={reset}
                className="text-xs text-white/40 hover:text-white/70 px-4 py-2 rounded-xl
                           flex items-center gap-1.5 transition-colors duration-150
                           hover:bg-white/5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Over
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Done State ────────────────────────────────────────────── */}
      {phase === "done" && (
        <div className="fade-up mt-4 rounded-2xl px-8 py-12 text-center space-y-5"
             style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(29,185,84,0.2)", backdropFilter: "blur(20px)" }}>
          <div className="w-16 h-16 rounded-full bg-g/10 border border-g/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-g" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-2">All Done!</h3>
            <p className="text-white/50 text-sm max-w-sm mx-auto">
              Saved to your Downloads folder under{" "}
              <span className="font-mono text-white/70 text-xs bg-white/5 px-2 py-0.5 rounded">
                {playlistName || donePath}
              </span>
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white/70
                         border border-white/10 hover:bg-white/5 transition-colors"
            >
              Download Another
            </button>
            <button className="bg-g text-black font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2
                               hover:brightness-110 transition-all shadow-lg shadow-g/20">
              <FolderOpen className="w-4 h-4" />
              Open Folder
            </button>
          </div>
        </div>
      )}

      {/* ── Feature Cards (idle only) ─────────────────────────────── */}
      {phase === "idle" && (
        <div className="fade-up grid sm:grid-cols-3 gap-3 mt-10">
          {INFO_CARDS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl p-5 space-y-3 group transition-colors duration-200
                         hover:border-g/20"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-g/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-g" />
              </div>
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-white/40 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
