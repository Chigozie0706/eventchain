import Image from "next/image";

export default function EventCard() {
  return (
    <div className="max-w-xs rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-200 m-5">
      <Image
        src="/images/image1.jpg"
        width={500}
        height={300}
        alt="Event Banner"
      />

      <div className="p-4">
        <span className="bg-purple-200 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
          Verkauf endet bald
        </span>
        <h2 className="text-sm font-semibold mt-2">
          Learn D.R.I.V.E., Business Mastery & More (Online Event)
        </h2>
        <p className="text-gray-600 text-xs mt-1">heute um 02:00 + 161 more</p>
        <p className="text-gray-500 text-xs mt-1">*Online Only*</p>
        <p className="text-green-600 font-semibold mt-1">Kostenlos</p>
        <p className="text-gray-700 text-xs mt-1">
          Online REI Education for Life
        </p>
      </div>
    </div>
  );
}
