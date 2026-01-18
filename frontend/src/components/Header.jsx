import LogoKomdigi from "../assets/logokominfo.png";
import LogoutButton from "./LogoutButton";

export default function Header() {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="h-20 flex items-center justify-between gap-4">
          {/* KIRI */}
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={LogoKomdigi}
              alt="Logo Komdigi"
              className="h-12 w-auto object-contain shrink-0"
            />

            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-gray-800 leading-tight truncate">
                Sistem Pelacakan MoU
              </h1>

              <p className="text-2xl md:text-sm text-gray-500 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
                Balai Pengembangan Sumber Daya Manusia dan Penelitian Komunikasi
                dan Informatika Manado
              </p>
            </div>
          </div>

          {/* KANAN */}
          <div className="shrink-0 flex items-center gap-2">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}