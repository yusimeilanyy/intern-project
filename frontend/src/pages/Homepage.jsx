import PemdaContent from "../components/PemdaContent";
import NonPemdaContent from "../components/NonPemdaContent";
import PemdaIcon from "../assets/pemda.svg";
import NonPemdaIcon from "../assets/nonpemda.svg";

export default function Homepage({ activeTab, onTabChange }) {
  const isPemda = activeTab === "pemda"; // Check if activeTab is 'pemda'

  return (
    <div className="mb-8">
  <h3 className="text-2xl font-bold text-[#006db0] mb-2">
    Manajemen Dokumen
  </h3>
  <p className="text-gray-500 text-sm mb-6">
    Kelola seluruh dokumen kerja sama, pantau masa berlaku, dan lakukan tindakan perpanjangan atau pembaharuan
  </p>

    <div className="pt-6 space-y-8">
{/* Tab Navigation */}
<div
  role="tablist"
  aria-label="Kategori MoU"
  className="relative w-full max-w-xl bg-slate-100/80 border border-slate-200 rounded-xl p-1 shadow-sm overflow-hidden"
>
  {/* Sliding indicator */}
  <div
    className={`absolute inset-y-1 left-1 w-1/2 rounded bg-white shadow transition-transform duration-200 ease-out ${
      isPemda ? "translate-x-0" : "translate-x-full"
    }`}
  />

  <div className="relative grid grid-cols-2">
    {/* TAB PEMDA */}
    <button
      type="button"
      role="tab"
      aria-selected={isPemda}
      onClick={() => onTabChange("pemda")}
      className={`group flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isPemda ? "text-gray-800" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      <img
        src={PemdaIcon}
        className="h-5 w-5 transition-transform duration-200 group-hover:scale-105"
        alt="Pemda Icon"
      />
      Pemerintah Daerah
    </button>

    {/* TAB NON PEMDA */}
    <button
      type="button"
      role="tab"
      aria-selected={!isPemda}
      onClick={() => onTabChange("non-pemda")}
      className={`group flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        !isPemda ? "text-gray-800" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      <img
        src={NonPemdaIcon}
        className="h-5 w-5 transition-transform duration-200 group-hover:scale-105"
        alt="Non Pemda Icon"
      />
      <span className="truncate">Non-Pemerintah Daerah</span>
    </button>
  </div>
</div>

      {/* Content Box */}
      <div className="animate-none">
        {/* Render appropriate content based on activeTab */}
        {isPemda ? <PemdaContent /> : <NonPemdaContent />}
      </div>

      <div className="h-15"></div> {/* 4rem = 64px ruang kosong */}

    </div>
  </div>
  );
}