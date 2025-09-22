// utils/tokens.ts

export interface Token {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
}

// Normalize all addresses to lowercase
export const tokenOptions: Token[] = [
  {
    symbol: "CELO",
    address:
      "0x0000000000000000000000000000000000000000".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "cUSD",
    address:
      "0x765de816845861e75a25fca122bb6898b8b1282a".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "cEUR",
    address:
      "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "cREAL",
    address:
      "0xe8537a3d056da446677b9e9d6c5db704eaab4787".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "G$",
    address:
      "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "USDT",
    address:
      "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e".toLowerCase() as `0x${string}`,
    decimals: 6,
  },
];

// Helper function to normalize any address to lowercase
export const normalizeAddress = (address: string): `0x${string}` => {
  return address.toLowerCase() as `0x${string}`;
};

// Get token by address (case-insensitive)
export const getTokenByAddress = (address: string): Token | undefined => {
  const normalizedAddr = normalizeAddress(address);
  return tokenOptions.find((token) => token.address === normalizedAddr);
};

// Get token by symbol
export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return tokenOptions.find(
    (token) => token.symbol.toUpperCase() === symbol.toUpperCase()
  );
};

// ///////////

// <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg my-20">
//   <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
//     Create Your Event
//   </h2>

//   {/* Form fields (same as your existing JSX) */}
//   <div className="mb-4">
//     <label className="block text-gray-700 font-medium text-sm mb-2">
//       Event Title *
//     </label>
//     <input
//       type="text"
//       name="eventName"
//       value={eventData.eventName}
//       onChange={handleChange}
//       placeholder="Enter event title"
//       className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
//     />
//   </div>

//   <div className="mb-4">
//     <label className="block text-gray-700 font-medium text-sm mb-2">
//       Event Image *
//     </label>
//     <div
//       className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
//       onDrop={handleDrop}
//       onDragOver={handleDragOver}
//     >
//       <div className="space-y-1 text-center">
//         <svg
//           className="mx-auto h-12 w-12 text-gray-400"
//           stroke="currentColor"
//           fill="none"
//           viewBox="0 0 48 48"
//           aria-hidden="true"
//         >
//           <path
//             d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
//             strokeWidth={2}
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />
//         </svg>
//         <div className="flex justify-center text-sm text-gray-600">
//           <label
//             htmlFor="file-upload"
//             className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
//           >
//             <span>Upload a file</span>
//             <input
//               id="file-upload"
//               name="file-upload"
//               type="file"
//               accept="image/*"
//               onChange={handleFileChange}
//               className="sr-only"
//             />
//           </label>
//           <p className="pl-1">or drag and drop</p>
//         </div>
//         <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
//         {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
//       </div>
//     </div>

//     {/* Single Preview Section */}
//     {preview && (
//       <div className="mt-4">
//         <img
//           src={preview}
//           alt="Preview"
//           className="max-w-full h-auto max-h-60 rounded-lg border border-gray-200"
//         />
//         <button
//           type="button"
//           onClick={() => {
//             setPreview(null);
//             setFile(null);
//           }}
//           className="mt-2 text-sm text-red-600 hover:text-red-500"
//         >
//           Remove image
//         </button>
//       </div>
//     )}
//   </div>

//   {/* Event Details */}
//   <div className="mb-4">
//     <label className="block text-gray-700 font-medium mb-2 text-sm">
//       Event Description *
//     </label>
//     <textarea
//       name="eventDetails"
//       value={eventData.eventDetails}
//       onChange={handleChange}
//       placeholder="Enter event description"
//       rows={4}
//       className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//     ></textarea>
//   </div>

//   {/* Start Date */}
//   <div className="mb-4">
//     <label className="block text-gray-700 font-medium mb-2 text-sm">
//       Start Date *
//     </label>
//     <input
//       type="date"
//       name="startDate"
//       value={eventData.startDate}
//       onChange={handleChange}
//       className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
//     />
//   </div>

//   {/* End Date */}
//   <div className="mb-4">
//     <label className="block text-gray-700 font-medium mb-2 text-sm">
//       End Date *
//     </label>
//     <input
//       type="date"
//       name="endDate"
//       value={eventData.endDate}
//       onChange={handleChange}
//       className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
//     />
//   </div>

//   {/* Start & End Time */}
//   <div className="flex gap-4 mb-4">
//     <div className="flex-1">
//       <label className="block text-gray-700 font-medium mb-2 text-sm">
//         Start Time *
//       </label>
//       <input
//         type="time"
//         name="startTime"
//         value={eventData.startTime}
//         onChange={handleChange}
//         className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
//       />
//     </div>
//     <div className="flex-1">
//       <label className="block text-gray-700 font-medium mb-2 text-sm">
//         End Time *
//       </label>
//       <input
//         type="time"
//         name="endTime"
//         value={eventData.endTime}
//         onChange={handleChange}
//         className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
//       />
//     </div>
//   </div>

//   {/* Event Location */}
//   <div className="mb-4">
//     <label className="block text-gray-700 font-medium mb-2 text-sm">
//       Location *
//     </label>
//     <input
//       type="text"
//       name="eventLocation"
//       value={eventData.eventLocation}
//       onChange={handleChange}
//       placeholder="Enter event location"
//       className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
//     />
//   </div>

//   {/* Minimum Age */}
//   <div className="mb-4">
//     <label className="block text-gray-700 font-medium mb-2 text-sm">
//       Minimum Age Requirement *
//     </label>
//     <input
//       type="number"
//       name="minimumAge"
//       value={eventData.minimumAge}
//       onChange={handleChange}
//       placeholder="Enter minimum age (0 for no restriction)"
//       min="0"
//       max="120"
//       className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
//     />
//   </div>

//   {/* Select Payment Token */}
//   <div className="mb-4">
//     <label className="block text-gray-700 font-medium text-sm mb-2">
//       Payment Token (cUSD, cEUR, cREAL, USDT)*
//     </label>
//     <select
//       name="paymentToken"
//       value={eventData.paymentToken}
//       onChange={handleTokenChange}
//       className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
//     >
//       <option value="" disabled>
//         Select a payment token
//       </option>
//       {tokenOptions.map((token) => (
//         <option key={token.address} value={token.address}>
//           {token.symbol}
//         </option>
//       ))}
//     </select>
//   </div>

//   {/* Event Price */}
//   <div className="mb-4">
//     <label className="block text-gray-700 font-medium mb-2 text-sm">
//       Ticket Price *
//     </label>
//     <input
//       type="number"
//       name="eventPrice"
//       value={eventData.eventPrice}
//       onChange={handleChange}
//       placeholder="Enter ticket price"
//       className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
//     />
//   </div>

//   <button
//     className="w-full bg-orange-700 text-white p-3 rounded-lg font-semibold hover:bg-orange-800 transition"
//     onClick={createEvent}
//     disabled={loading}
//   >
//     {loading ? "Processing..." : "Create Event"}
//   </button>
// </div>
