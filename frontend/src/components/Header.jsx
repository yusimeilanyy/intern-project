import { useEffect, useState } from "react";
import SIKERMA from "../assets/SIKERMA.png";
import LogoutButton from "./LogoutButton";

export default function Header({
  currentPage = "dashboard",
  setCurrentPage = () => {},
  isAdmin = false,
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="
        sticky top-0 z-50 transition-all duration-300
        bg-transparent
        border-b border-[rgba(0,51,108,0.08)]
        backdrop-blur-md
      "
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20 relative">
          {/* LEFT SIDE - Logo */}
          <div className="flex items-center gap-3">
            <img
              src={SIKERMA}
              alt="Logo"
              className="h-26 w-auto object-contain"
            />
          </div>

          {/* CENTER - Navigation (absolutely positioned di tengah) */}
          <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              onClick={() => setCurrentPage("dashboard")}
              className={`relative pb-1 transition-all duration-200 ${
                currentPage === "dashboard"
                  ? "text-[#00336C] border-b-2 border-[#00B5AA]"
                  : "text-gray-400 hover:text-[#00336C]"
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => setCurrentPage("homepage")}
              className={`relative pb-1 transition-all duration-200 ${
                currentPage === "homepage"
                  ? "text-[#00336C] border-b-2 border-[#00B5AA]"
                  : "text-gray-400 hover:text-[#00336C]"
              }`}
            >
              Dokumen
            </button>

            {isAdmin && (
              <button
                onClick={() => setCurrentPage("user-management")}
                className={`relative pb-1 transition-all duration-200 ${
                  currentPage === "user-management"
                    ? "text-[#00336C] border-b-2 border-[#00B5AA]"
                    : "text-gray-400 hover:text-[#00336C]"
                }`}
              >
                User
              </button>
            )}
          </nav>

          {/* RIGHT SIDE - Logout */}
          <div className="flex items-center">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}