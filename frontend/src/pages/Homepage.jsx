import PemdaContent from "../components/PemdaContent";
import NonPemdaContent from "../components/NonPemdaContent";
import PemdaIcon from "../assets/pemda.svg";
import NonPemdaIcon from "../assets/nonpemda.svg";

export default function Homepage({ activeTab, onTabChange }) {
  const isPemda = activeTab === "pemda"; // Check if activeTab is 'pemda'

  return (
    <div className="pt-12 space-y-8"> {/* Dinaikkan dari pt-6 menjadi pt-12 */}
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Kategori MoU"
        className="relative w-full max-w-xl bg-slate-100/80 border border-slate-200 rounded-xl p-1 shadow-sm"
      >
        {/* Sliding indicator */}
        <div
          className={`absolute inset-y-1 left-1 w-1/2 rounded-lg bg-white shadow transition-transform duration-200 ease-out ${
            isPemda ? "translate-x-0" : "translate-x-full"
          }`}
        />

        <div className="relative grid grid-cols-2 gap-1">
          {/* TAB PEMDA */}
          <button
            type="button"
            role="tab"
            aria-selected={isPemda}
            onClick={() => onTabChange("pemda")}
            className={`group flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isPemda ? "text-blue-800" : "text-slate-600 hover:text-slate-900"
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
            className={`group flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              !isPemda ? "text-blue-800" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <img
              src={NonPemdaIcon}
              className="h-5 w-5 transition-transform duration-200 group-hover:scale-105"
              alt="Non Pemda Icon"
            />
            Non-Pemerintah Daerah
          </button>
        </div>
      </div>

      {/* Content Box */}
      <div className="animate-none">
        {/* Render appropriate content based on activeTab */}
        {isPemda ? <PemdaContent /> : <NonPemdaContent />}
      </div>
    </div>
  );
}