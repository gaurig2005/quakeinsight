import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const minMag = parseFloat(url.searchParams.get("minMagnitude") || "2.5");

    // Bounding box: 36.194°N 66.826°E, 4.888°N 70.145°E, 4.473°N 94.068°E, 35.753°N 94.023°E
    const minLat = 4.473;
    const maxLat = 36.194;
    const minLon = 66.826;
    const maxLon = 94.068;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLon}&maxlongitude=${maxLon}&minmagnitude=${minMag}&starttime=${startDate}&orderby=time&limit=500`;

    console.log(`Fetching USGS: days=${days}, minMag=${minMag}`);

    const resp = await fetch(usgsUrl);
    if (!resp.ok) {
      throw new Error(`USGS API error: ${resp.status} ${resp.statusText}`);
    }

    const usgsData = await resp.json();
    const earthquakes = (usgsData.features || []).map((f: any) => {
      const [lng, lat, depth] = f.geometry.coordinates;
      const loc = f.properties.place || "Unknown";
      
      return {
        id: f.id,
        magnitude: f.properties.mag || 0,
        location: loc,
        time: new Date(f.properties.time).toISOString(),
        depth: depth || 0,
        coordinates: { lat, lng },
        state: extractState(loc),
        region: extractRegion(loc),
        isHistorical: false,
      };
    });

    console.log(`Returning ${earthquakes.length} live earthquakes from USGS`);

    return new Response(JSON.stringify({
      earthquakes,
      count: earthquakes.length,
      source: "usgs_live",
      fetchedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message, earthquakes: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractState(location: string): string {
  const loc = location.toLowerCase();
  const map: Record<string, string> = {
    'andaman': 'Andaman & Nicobar', 'nicobar': 'Andaman & Nicobar', 'port blair': 'Andaman & Nicobar',
    'bamboo flat': 'Andaman & Nicobar', 'manipur': 'Manipur', 'assam': 'Assam',
    'meghalaya': 'Meghalaya', 'mizoram': 'Mizoram', 'nagaland': 'Nagaland',
    'sikkim': 'Sikkim', 'arunachal': 'Arunachal Pradesh', 'himachal': 'Himachal Pradesh',
    'chamba': 'Himachal Pradesh', 'uttarakhand': 'Uttarakhand', 'kashmir': 'Jammu & Kashmir',
    'ladakh': 'Ladakh', 'delhi': 'Delhi', 'bihar': 'Bihar', 'gujarat': 'Gujarat',
    'rajasthan': 'Rajasthan', 'maharashtra': 'Maharashtra', 'gyalshing': 'Sikkim',
    'nepal': 'Nepal', 'pakistan': 'Pakistan', 'afghanistan': 'Afghanistan',
    'bangladesh': 'Bangladesh', 'myanmar': 'Myanmar', 'burma': 'Myanmar',
    'china': 'China', 'tibet': 'China', 'indonesia': 'Indonesia',
    'tajikistan': 'Tajikistan', 'bhutan': 'Bhutan',
  };
  for (const [key, val] of Object.entries(map)) {
    if (loc.includes(key)) return val;
  }
  if (loc.includes('india')) return 'India';
  if (loc.includes('hindu kush')) return 'Afghanistan';
  return 'South Asia';
}

function extractRegion(location: string): string {
  const state = extractState(location);
  const ne = ['Manipur', 'Assam', 'Meghalaya', 'Mizoram', 'Nagaland', 'Arunachal Pradesh', 'Sikkim', 'Tripura'];
  const him = ['Uttarakhand', 'Himachal Pradesh', 'Jammu & Kashmir', 'Ladakh'];
  if (ne.includes(state)) return 'North-East India';
  if (him.includes(state)) return 'Himalayan Belt';
  if (state === 'Andaman & Nicobar') return 'Andaman & Nicobar';
  if (['Gujarat', 'Rajasthan'].includes(state)) return 'Western India';
  if (['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Kerala'].includes(state)) return 'Peninsular India';
  if (['Afghanistan', 'Pakistan', 'Nepal', 'Bangladesh', 'Myanmar', 'China', 'Indonesia', 'Tajikistan', 'Bhutan'].includes(state)) return state;
  return 'India';
}
