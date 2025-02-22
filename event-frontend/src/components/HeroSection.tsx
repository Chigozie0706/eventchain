import { useContract } from "../context/ContractContext";

export default function HeroSection() {
  const { contract } = useContract();

  const getEventLength = async () => {
    if (!contract) {
      console.error("Contract is not loaded");
      return;
    }

    try {
      const length = await contract.getEventLength(); // Replace with actual contract method
      // setEventLength(length);
      console.log(length);
    } catch (error) {
      console.error("Error fetching event length:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      if (!contract) {
        console.error("Contract not found");
        return;
      }

      const eventData = await contract.getAllEvents();
      //setEvents(eventData);
      console.log(eventData);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  return (
    <section className="relative w-full min-h-screen">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/image1.jpg')" }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white px-8 md:px-16 max-w-xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold">
              Discover & Book Events Anywhere!
            </h1>
            <p className="mt-3 text-lg md:text-xl">
              Find exciting concerts, workshops, and conferences worldwide. Stay
              connected to what matters!
            </p>

            <div className="flex gap-4 justify-center mt-5">
              <button
                className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-700 transition"
                onClick={getEventLength}
              >
                Create Event
              </button>

              <button className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-700 transition">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
