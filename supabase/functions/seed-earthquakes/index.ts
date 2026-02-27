import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getIndianState = (lat: number, lng: number): string => {
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
  const map: Record<string, string[]> = {
    "North-East India": ["Assam", "Manipur", "Meghalaya", "Tripura", "Mizoram", "Nagaland", "Arunachal Pradesh", "Sikkim"],
    "North India": ["Jammu & Kashmir", "Himachal Pradesh", "Uttarakhand", "Delhi NCR", "Uttar Pradesh", "Punjab", "Haryana"],
    "Central India": ["Madhya Pradesh", "Chhattisgarh", "Jharkhand"],
    "West India": ["Gujarat", "Maharashtra", "Rajasthan", "Goa"],
    "South India": ["Karnataka", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Telangana"],
    "East India": ["Bihar", "West Bengal", "Odisha"],
  };
  for (const [region, states] of Object.entries(map)) {
    if (states.includes(state)) return region;
  }
  return "India";
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Last 50 years: 1976 to present
    const startYear = new Date().getFullYear() - 50;
    const endYear = new Date().getFullYear();
    
    // India bounding box
    const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=6.5&maxlatitude=35.5&minlongitude=68&maxlongitude=97.5&minmagnitude=3.0&starttime=${startYear}-01-01&endtime=${endYear}-12-31&orderby=time&limit=20000`;

    console.log(`Fetching India earthquakes from ${startYear} to ${endYear}...`);
    const response = await fetch(usgsUrl);
    if (!response.ok) throw new Error(`USGS API error: ${response.status}`);

    const data = await response.json();
    const features = data.features || [];
    console.log(`Got ${features.length} earthquakes from USGS`);

    // Transform and insert in batches
    const rows = features.map((f: any) => {
      const [lng, lat, depth] = f.geometry.coordinates;
      const state = getIndianState(lat, lng);
      const region = getRegion(state);
      return {
        id: f.id,
        magnitude: f.properties.mag || 0,
        location: f.properties.place || `${state}, India`,
        occurred_at: new Date(f.properties.time).toISOString(),
        depth: depth || 0,
        latitude: lat,
        longitude: lng,
        state,
        region,
        is_historical: new Date(f.properties.time).getFullYear() < 2000,
        source: "USGS",
      };
    });

    // Insert in batches of 500
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase
        .from("earthquakes")
        .upsert(batch, { onConflict: "id" });
      if (error) {
        console.error(`Batch ${i} error:`, error.message);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Inserted/updated ${inserted} earthquakes`);

    return new Response(JSON.stringify({ 
      success: true, 
      total_fetched: features.length,
      total_inserted: inserted,
      year_range: `${startYear}-${endYear}`,
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
