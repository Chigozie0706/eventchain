import Link from "next/link";
import Home from "@/app/view_events/page";

export default function HeroSection() {
  return (
    <>
      {/* <section>
        <div className="relative w-full h-[70vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/images/banner.png"
              alt="Event background"
              className="object-cover opacity-90"
            />
          </div>
          <div className="z-10 max-w-3xl">
            <h2 className="text-4xl font-extrabold md:text-6xl">
              Discover & Book Events Anywhere!
            </h2>
            <p className="text-lg mt-4 md:text-xl">
              Find exciting concerts, workshops, and conferences worldwide. Stay
              connected to what matters!
            </p>
            <div className="mt-6 flex space-x-4 justify-center">
              <Link href="/create-event">
                <button className="bg-orange-500 px-6 py-3 rounded-md text-lg hover:bg-orange-600 transition">
                  Host an Event
                </button>
              </Link>
              <Link href="/view-events">
                <button className="bg-blue-600 px-6 py-3 rounded-md text-lg hover:bg-blue-700 transition">
                  View Events
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section> */}

      <section className="relative w-full h-[70vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-black opacity-50"></div>{" "}
          {/* Dark Overlay */}
          <img
            src="/images/banner.png"
            alt="Event background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text Content */}
        <div className="relative z-10 max-w-3xl text-white">
          <h2 className="text-3xl font-extrabold sm:text-4xl md:text-5xl lg:text-6xl">
            Discover & Book Events Anywhere!
          </h2>
          <p className="mt-4 text-lg sm:text-xl md:text-2xl">
            Find exciting concerts, workshops, and conferences worldwide. Stay
            connected to what matters!
          </p>

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
            <Link href="/create_event">
              <button className="bg-orange-500 px-6 py-3 rounded-md text-lg font-semibold hover:bg-orange-600 transition">
                Create an Event
              </button>
            </Link>
            <Link href="/">
              <button className="bg-blue-600 px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition">
                View Tickets
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Home />
    </>
  );
}
