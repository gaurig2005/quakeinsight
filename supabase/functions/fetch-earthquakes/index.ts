import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const dataType = url.searchParams.get("type") || "recent";
    const startYear = parseInt(url.searchParams.get("startYear") || (new Date().getFullYear() - 50).toString());
    const endYear = parseInt(url.searchParams.get("endYear") || new Date().getFullYear().toString());
    const minMagnitude = parseFloat(url.searchParams.get("minMagnitude") || "0");
    const stateFilter = url.searchParams.get("state") || null;
    const regionFilter = url.searchParams.get("region") || null;
    const limit = parseInt(url.searchParams.get("limit") || "500");

    console.log(`Fetching: type=${dataType}, years=${startYear}-${endYear}, minMag=${minMagnitude}, state=${stateFilter}`);

    let query = supabase
      .from("earthquakes")
      .select("*")
      .gte("magnitude", minMagnitude)
      .order("occurred_at", { ascending: false })
      .limit(Math.min(limit, 2000));

    // Date filtering
    if (dataType === "recent") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("occurred_at", thirtyDaysAgo);
    } else {
      query = query
        .gte("occurred_at", `${startYear}-01-01T00:00:00Z`)
        .lte("occurred_at", `${endYear}-12-31T23:59:59Z`);
    }

    if (stateFilter) {
      query = query.eq("state", stateFilter);
    }
    if (regionFilter) {
      query = query.eq("region", regionFilter);
    }

    const { data: earthquakes, error: dbError } = await query;

    if (dbError) throw dbError;

    // If DB is empty and type is recent, fallback to USGS live
    if ((!earthquakes || earthquakes.length === 0) && dataType === "recent") {
      console.log("DB empty, fetching live from USGS...");
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=6.5&maxlatitude=35.5&minlongitude=68&maxlongitude=97.5&minmagnitude=${Math.max(minMagnitude, 2)}&starttime=${startDate}&orderby=time&limit=200`;
      
      const resp = await fetch(usgsUrl);
      if (resp.ok) {
        const usgsData = await resp.json();
        const mapped = (usgsData.features || []).map((f: any) => {
          const [lng, lat, depth] = f.geometry.coordinates;
          return {
            id: f.id,
            magnitude: f.properties.mag || 0,
            location: f.properties.place || "India",
            time: new Date(f.properties.time).toISOString(),
            depth: depth || 0,
            coordinates: { lat, lng },
            state: "India",
            region: "India",
            isHistorical: false,
          };
        });
        
        return new Response(JSON.stringify({
          earthquakes: mapped,
          count: mapped.length,
          stats: buildStats(mapped),
          dataType,
          dateRange: { startYear, endYear },
          source: "usgs_live",
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Transform DB rows to API format
    const formatted = (earthquakes || []).map((eq: any) => ({
      id: eq.id,
      magnitude: Number(eq.magnitude),
      location: eq.location,
      time: eq.occurred_at,
      depth: Number(eq.depth),
      coordinates: { lat: Number(eq.latitude), lng: Number(eq.longitude) },
      state: eq.state,
      region: eq.region,
      isHistorical: eq.is_historical,
    }));

    const stats = buildStats(formatted);

    console.log(`Returning ${formatted.length} earthquakes from database`);

    return new Response(JSON.stringify({
      earthquakes: formatted,
      count: formatted.length,
      stats,
      dataType,
      dateRange: { startYear, endYear },
      source: "database",
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

function buildStats(earthquakes: any[]) {
  const stats: any = {
    total: earthquakes.length,
    avgMagnitude: earthquakes.length > 0
      ? (earthquakes.reduce((s: number, e: any) => s + e.magnitude, 0) / earthquakes.length).toFixed(1)
      : 0,
    maxMagnitude: earthquakes.length > 0
      ? Math.max(...earthquakes.map((e: any) => e.magnitude))
      : 0,
    byRegion: {},
    byDecade: {},
    byState: {},
  };

  earthquakes.forEach((eq: any) => {
    stats.byRegion[eq.region] = (stats.byRegion[eq.region] || 0) + 1;
    stats.byState[eq.state] = (stats.byState[eq.state] || 0) + 1;
    const decade = Math.floor(new Date(eq.time).getFullYear() / 10) * 10;
    stats.byDecade[`${decade}s`] = (stats.byDecade[`${decade}s`] || 0) + 1;
  });

  return stats;
}
