export default function LogoutButton() {
  const handleLogout = () => {
    // hapus token login
    localStorage.removeItem("token");

    // arahkan ke halaman login 
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white text-xs px-2 py-1 rounded-md hover:bg-red-700"
    >
      Logout
    </button>
  );
}