import axios from "axios";

export default async function getPlaces(query: any) {
  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`,
      {
        params: {
          access_token: process.env.NEXT_PUBLIC_API_KEY,
        },
      }
    );

    return response.data.features;
  } catch (error) {
    console.error("There was an error while fetching places:", error);
  }
}
