import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Earthquake {
  id: string;
  magnitude: number;
  location: string;
  time: string;
  depth: number;
  coordinates: { lat: number; lng: number };
  state: string;
  region: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching earthquake data from NCS India...");
    
    // NCS doesn't have a public API, so we'll use USGS data filtered for India region
    // India's bounding box: lat 6.5-35.5, lon 68-97.5
    const usgsUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=6.5&maxlatitude=35.5&minlongitude=68&maxlongitude=97.5&limit=50&orderby=time";
    
    const response = await fetch(usgsUrl);
    
    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.features?.length || 0} earthquakes from USGS for India region`);
    
    // Map Indian states based on coordinates
    const getIndianState = (lat: number, lng: number): string => {
      // Approximate state boundaries
      if (lat > 32 && lng < 77) return "Jammu & Kashmir";
      if (lat > 30 && lat <= 32 && lng < 77) return "Himachal Pradesh";
      if (lat > 29 && lat <= 32 && lng >= 77 && lng < 80) return "Uttarakhand";
      if (lat > 26 && lat <= 30 && lng >= 72 && lng < 76) return "Rajasthan";
      if (lat > 28 && lat <= 30 && lng >= 76 && lng < 78) return "Delhi NCR";
      if (lat > 27 && lat <= 31 && lng >= 78 && lng < 85) return "Uttar Pradesh";
      if (lat > 24 && lat <= 27 && lng >= 80 && lng < 88) return "Bihar";
      if (lat > 25 && lat <= 28 && lng >= 88 && lng < 92) return "West Bengal";
      if (lat > 26 && lat <= 28 && lng >= 92 && lng < 95) return "Assam";
      if (lat > 25 && lat <= 27 && lng >= 93 && lng < 95) return "Manipur";
      if (lat > 24 && lat <= 26 && lng >= 91 && lng < 93) return "Meghalaya";
      if (lat > 23 && lat <= 25 && lng >= 91 && lng < 93) return "Tripura";
      if (lat > 21 && lat <= 24 && lng >= 91 && lng < 93) return "Mizoram";
      if (lat > 26 && lat <= 28 && lng >= 93 && lng < 96) return "Nagaland";
      if (lat > 27 && lat <= 29 && lng >= 93 && lng < 95) return "Arunachal Pradesh";
      if (lat > 27 && lat <= 29 && lng >= 88 && lng < 89) return "Sikkim";
      if (lat > 21 && lat <= 26 && lng >= 80 && lng < 88) return "Jharkhand";
      if (lat > 19 && lat <= 22 && lng >= 84 && lng < 88) return "Odisha";
      if (lat > 20 && lat <= 24 && lng >= 78 && lng < 85) return "Chhattisgarh";
      if (lat > 20 && lat <= 26 && lng >= 74 && lng < 80) return "Madhya Pradesh";
      if (lat > 18 && lat <= 24 && lng >= 69 && lng < 75) return "Gujarat";
      if (lat > 15 && lat <= 22 && lng >= 72 && lng < 80) return "Maharashtra";
      if (lat > 13 && lat <= 18 && lng >= 74 && lng < 81) return "Karnataka";
      if (lat > 8 && lat <= 14 && lng >= 74 && lng < 78) return "Kerala";
      if (lat > 8 && lat <= 13 && lng >= 77 && lng < 80) return "Tamil Nadu";
      if (lat > 13 && lat <= 19 && lng >= 78 && lng < 85) return "Andhra Pradesh";
      if (lat > 15 && lat <= 20 && lng >= 78 && lng < 81) return "Telangana";
      if (lat > 14 && lat <= 16 && lng >= 73 && lng < 75) return "Goa";
      if (lat > 6 && lat <= 12 && lng >= 92 && lng < 94) return "Andaman & Nicobar Islands";
      return "India";
    };

    const getRegion = (state: string): string => {
      const northEast = ["Assam", "Manipur", "Meghalaya", "Tripura", "Mizoram", "Nagaland", "Arunachal Pradesh", "Sikkim"];
      const north = ["Jammu & Kashmir", "Himachal Pradesh", "Uttarakhand", "Delhi NCR", "Uttar Pradesh", "Punjab", "Haryana"];
      const central = ["Madhya Pradesh", "Chhattisgarh", "Jharkhand"];
      const west = ["Gujarat", "Maharashtra", "Rajasthan", "Goa"];
      const south = ["Karnataka", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Telangana"];
      const east = ["Bihar", "West Bengal", "Odisha"];
      
      if (northEast.includes(state)) return "North-East India";
      if (north.includes(state)) return "North India";
      if (central.includes(state)) return "Central India";
      if (west.includes(state)) return "West India";
      if (south.includes(state)) return "South India";
      if (east.includes(state)) return "East India";
      return "India";
    };

    const earthquakes: Earthquake[] = data.features?.map((feature: any) => {
      const [lng, lat, depth] = feature.geometry.coordinates;
      const state = getIndianState(lat, lng);
      const region = getRegion(state);
      
      return {
        id: feature.id,
        magnitude: feature.properties.mag || 0,
        location: feature.properties.place || `${state}, India`,
        time: new Date(feature.properties.time).toISOString(),
        depth: depth || 0,
        coordinates: { lat, lng },
        state,
        region,
      };
    }) || [];

    console.log(`Processed ${earthquakes.length} earthquakes for India`);

    return new Response(JSON.stringify({ earthquakes, count: earthquakes.length }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error fetching earthquake data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
