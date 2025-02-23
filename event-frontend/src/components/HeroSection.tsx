import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[calc(100vh-50px)]">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/image1.jpg')" }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white px-8 md:px-16 max-w-2xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold">
              Discover & Book Events Anywhere!
            </h1>
            <p className="mt-3 text-lg md:text-xl font-bold">
              Find exciting concerts, workshops, and conferences worldwide. Stay
              connected to what matters!
            </p>

            <div className="flex gap-4 justify-center mt-5">
              <button className="bg-orange-500 text-white font-bold px-4 py-2 rounded shadow-md hover:bg-orange-600 transition">
                <Link href="/create_event">Host an Event</Link>
              </button>

              <button className="bg-blue-600 text-white font-bold px-4 py-2 rounded shadow-md hover:bg-blue-700 transition">
                <Link href="/view_events">View Events</Link>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
