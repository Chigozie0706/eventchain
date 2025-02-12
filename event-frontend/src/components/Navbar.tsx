export default function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-white px-6 py-3 shadow-md fixed w-full z-50">
      {/* Left: Logo */}
      <div className="text-orange-500 text-2xl font-bold">EventCelo</div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-6 text-gray-700">
        <button className="flex items-center text-sm">
          ➕ <span className="ml-1">Event erstellen</span>
        </button>
        <button className="flex items-center text-sm">
          ❤️ <span className="ml-1">Likes</span>
        </button>
        <button className="flex items-center text-sm">
          🎟️ <span className="ml-1 ">Tickets</span>
        </button>
        <div className="flex items-center space-x-2 text-xs">
          <div className="bg-gray-300 rounded-full p-2">👤</div>
          <span className="">chigoziejacob@gmail.com</span>
        </div>
      </div>
    </nav>
  );
}
