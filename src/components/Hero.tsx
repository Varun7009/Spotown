export default function Hero() {
  return (
    <section className="text-center px-6 pt-20 pb-10">
      <div className="fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full border border-g/25 text-xs font-bold text-g mb-8 tracking-wide"
           style={{ background: "rgba(29,185,84,0.08)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-g inline-block" />
        Spotown · MP3 · FLAC · WAV
      </div>

      <h1 className="fade-up text-6xl md:text-8xl font-black tracking-tighter leading-[0.92] mb-6 text-white">
        Your Music,
        <br />
        <span
          style={{
            background: "linear-gradient(135deg, #1DB954 0%, #4ade80 60%, #1DB954 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Everywhere.
        </span>
      </h1>

      <p className="fade-up text-white/50 text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-medium mb-12">
        Paste any Spotify playlist, album or track URL and get your music as
        high-quality files — fully organized, zero ads.
      </p>
    </section>
  );
}
