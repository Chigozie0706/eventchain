import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-white px-6 py-3 shadow-md fixed w-full z-50 ">
      {/* Left: Logo */}
      <div className="text-orange-500 text-2xl font-bold">
        <Link href="/">EventCelo</Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-6 text-gray-700">
        <button className="flex items-center text-sm">
          <Link href="/create_event">
            ➕ <span className="ml-1">Create Event</span>
          </Link>
        </button>
        <button className="flex items-center text-sm">
          <Link href="view_events">
            ❤️ <span className="ml-1">View Events</span>
          </Link>
        </button>

        <button className="flex items-center text-sm">
          <Link href="view_event_details">
            ❤️ <span className="ml-1">View Event</span>
          </Link>
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
