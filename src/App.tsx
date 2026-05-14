import { useEffect } from "react";
import Background from "./components/Background";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import DownloaderForm from "./components/DownloaderForm";
import Footer from "./components/Footer";

export default function App() {
  useEffect(() => {
    // Always dark — background image provides the visual variation
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      <Background />
      <div className="relative z-10 flex flex-col w-full">
        <Navbar />
        <main className="flex-1 w-full">
          <Hero />
          <DownloaderForm />
        </main>
        <Footer />
      </div>
    </div>
  );
}
