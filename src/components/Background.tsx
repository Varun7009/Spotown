import backgroundImage from "../../Background.jpg";

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" style={{ background: "#080808" }}>
      {/* Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: "brightness(0.28) saturate(1.15)",
          willChange: "transform",
        }}
      />

      {/* Dark vignette overlay */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.15)" }} />

      {/* Static green-tinted blobs */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
    </div>
  );
}
