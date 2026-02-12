import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="
        relative pb-1
        flex items-center gap-2
        text-sm font-medium
        text-gray-600
        hover:text-[#00336C]
        transition-all duration-200
      "
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}
