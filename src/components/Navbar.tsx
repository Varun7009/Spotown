import { Github } from "lucide-react";

export default function Navbar() {
  return (
    <header
      className="flex items-center justify-between px-8 py-5 border-b border-white/[0.07]"
      style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-g flex items-center justify-center shrink-0 shadow-lg shadow-g/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.321c-.215.353-.679.467-1.032.251-2.864-1.748-6.47-2.143-10.718-1.173-.404.093-.809-.162-.902-.566-.093-.404.162-.809.566-.902 4.654-1.066 8.64-.616 11.835 1.332.353.215.467.679.251 1.058zm1.467-3.265c-.271.442-.848.583-1.289.312-3.28-2.016-8.28-2.598-12.16-1.42-.497.151-1.026-.128-1.178-.625-.152-.497.128-1.026.625-1.178 4.433-1.344 9.94-.683 13.7 1.623.441.27.583.847.302 1.288zm.139-3.411c-3.931-2.333-10.428-2.548-14.215-1.398-.603.183-1.24-.165-1.422-.767-.183-.603.165-1.24.767-1.422 4.354-1.321 11.536-1.066 16.03 1.601.541.321.72 1.022.4 1.562-.321.54-.102.719-.56.401v.024z" />
          </svg>
        </span>
        <span className="font-black text-xl tracking-tight text-white">Spotown</span>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/Varun7009/Spotown/issues"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/5 hover:border-white/20 transition-all duration-200"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
          </svg>
          Support
        </a>
        <a
          href="https://github.com/Varun7009/Spotown"
          target="_blank"
          rel="noreferrer"
          className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all duration-200"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <Github className="w-5 h-5 text-white/50 hover:text-white/80 transition-colors" />
        </a>
      </div>
    </header>
  );
}
