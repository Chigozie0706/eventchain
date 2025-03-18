import Link from "next/link";
import Home from "@/app/view_events/page";

export default function HeroSection() {
  return (
    // <section className="relative w-full min-h-[calc(100vh-50px)]">
    //   {/* Background Image */}
    //   <div
    //     className="absolute inset-0 bg-cover bg-center"
    //     style={{ backgroundImage: "url('/images/image1.jpg')" }}
    //   >
    //     {/* Dark Overlay */}
    //     <div className="absolute inset-0 bg-black/50"></div>

    //     {/* Content */}
    //     <div className="absolute inset-0 flex items-center justify-center">
    //       <div className="text-white px-8 md:px-16 max-w-2xl text-center">
    //         <h1 className="text-4xl md:text-5xl font-bold">
    //           Discover & Book Events Anywhere!
    //         </h1>
    //         <p className="mt-3 text-lg md:text-xl font-bold">
    //           Find exciting concerts, workshops, and conferences worldwide. Stay
    //           connected to what matters!
    //         </p>

    //         <div className="flex gap-4 justify-center mt-5">
    //           <button className="bg-orange-500 text-white font-bold px-4 py-2 rounded shadow-md hover:bg-orange-600 transition">
    //             <Link href="/create_event">Host an Event</Link>
    //           </button>

    //           <button className="bg-blue-600 text-white font-bold px-4 py-2 rounded shadow-md hover:bg-blue-700 transition">
    //             <Link href="/view_events">View Events</Link>
    //           </button>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </section>
    <>
      <div className="relative w-full h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/images/image1.jpg'"
            alt="Event background"
            className="object-cover opacity-60"
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

      <Home />
    </>
  );
}
