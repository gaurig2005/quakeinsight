const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const minMag = parseFloat(url.searchParams.get("minMagnitude") || "2.5");

    // Bounding box: lat [-1.143, 36.386], lon [64.6, 93.34]
    const minLat = -1.143;
    const maxLat = 36.386;
    const minLon = 64.6;
    const maxLon = 93.34;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLon}&maxlongitude=${maxLon}&minmagnitude=${minMag}&starttime=${startDate}&orderby=time&limit=500`;

    console.log(`Fetching USGS: days=${days}, minMag=${minMag}`);

    const resp = await fetch(usgsUrl);
    if (!resp.ok) {
      const text = await resp.text();
      // Check if response is HTML (Cloudflare block)
      if (text.includes("<!DOCTYPE") || text.includes("<html")) {
        console.error("USGS returned HTML (likely blocked). Returning empty.");
        return new Response(JSON.stringify({
          earthquakes: [],
          count: 0,
          source: "usgs_blocked",
          fetchedAt: new Date().toISOString(),
          message: "USGS API temporarily unavailable",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`USGS API error: ${resp.status}`);
    }

    const contentType = resp.headers.get("content-type") || "";
    const text = await resp.text();
    
    if (!contentType.includes("json") || text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      console.error("USGS returned non-JSON response");
      return new Response(JSON.stringify({
        earthquakes: [],
        count: 0,
        source: "usgs_blocked",
        fetchedAt: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usgsData = JSON.parse(text);
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

    console.log(`Returning ${earthquakes.length} live earthquakes`);

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
    'andaman': 'Andaman & Nicobar', 'nicobar': 'Andaman & Nicobar',
    'manipur': 'Manipur', 'assam': 'Assam', 'meghalaya': 'Meghalaya',
    'mizoram': 'Mizoram', 'nagaland': 'Nagaland', 'sikkim': 'Sikkim',
    'gyalshing': 'Sikkim', 'arunachal': 'Arunachal Pradesh',
    'himachal': 'Himachal Pradesh', 'chamba': 'Himachal Pradesh',
    'uttarakhand': 'Uttarakhand', 'chamoli': 'Uttarakhand',
    'kashmir': 'Jammu & Kashmir', 'ladakh': 'Ladakh',
    'delhi': 'Delhi', 'bihar': 'Bihar', 'gujarat': 'Gujarat',
    'rajasthan': 'Rajasthan', 'maharashtra': 'Maharashtra',
    'karnataka': 'Karnataka', 'tamil nadu': 'Tamil Nadu', 'kerala': 'Kerala',
    'nepal': 'Nepal', 'pakistan': 'Pakistan', 'afghanistan': 'Afghanistan',
    'bangladesh': 'Bangladesh', 'myanmar': 'Myanmar', 'burma': 'Myanmar',
    'china': 'China', 'tibet': 'China', 'xizang': 'China',
    'indonesia': 'Indonesia', 'tajikistan': 'Tajikistan', 'bhutan': 'Bhutan',
    'sri lanka': 'Sri Lanka', 'iran': 'Iran',
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
  if (['Afghanistan', 'Pakistan', 'Nepal', 'Bangladesh', 'Myanmar', 'China', 'Indonesia', 'Tajikistan', 'Bhutan', 'Sri Lanka', 'Iran'].includes(state)) return state;
  return 'India';
}
