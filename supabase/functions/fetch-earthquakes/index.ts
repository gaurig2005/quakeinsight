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
  isHistorical?: boolean;
}

// Historical earthquakes in India (pre-1900, significant events from various sources)
// Data compiled from NCS historical records, USGS, and geological surveys
const historicalEarthquakes: Earthquake[] = [
  // 16th-18th Century
  { id: "hist-1505", magnitude: 8.0, location: "Lo Mustang Region, Nepal-India Border", time: "1505-06-06T00:00:00Z", depth: 30, coordinates: { lat: 29.5, lng: 83.5 }, state: "Uttarakhand", region: "North India", isHistorical: true },
  { id: "hist-1555", magnitude: 7.6, location: "Kashmir Region", time: "1555-09-01T00:00:00Z", depth: 25, coordinates: { lat: 34.0, lng: 74.5 }, state: "Jammu & Kashmir", region: "North India", isHistorical: true },
  { id: "hist-1618", magnitude: 6.8, location: "Bombay (Mumbai) Region", time: "1618-05-26T00:00:00Z", depth: 20, coordinates: { lat: 19.0, lng: 72.8 }, state: "Maharashtra", region: "West India", isHistorical: true },
  { id: "hist-1668", magnitude: 7.6, location: "Samaji, Kutch Region", time: "1668-05-00T00:00:00Z", depth: 25, coordinates: { lat: 23.3, lng: 69.9 }, state: "Gujarat", region: "West India", isHistorical: true },
  { id: "hist-1720", magnitude: 6.5, location: "Delhi Region", time: "1720-07-15T00:00:00Z", depth: 15, coordinates: { lat: 28.6, lng: 77.2 }, state: "Delhi NCR", region: "North India", isHistorical: true },
  { id: "hist-1737", magnitude: 7.0, location: "Calcutta (Kolkata) Region", time: "1737-10-11T00:00:00Z", depth: 30, coordinates: { lat: 22.5, lng: 88.3 }, state: "West Bengal", region: "East India", isHistorical: true },
  { id: "hist-1762", magnitude: 7.5, location: "Arakan Coast, Bay of Bengal", time: "1762-04-02T00:00:00Z", depth: 35, coordinates: { lat: 22.0, lng: 91.5 }, state: "Tripura", region: "North-East India", isHistorical: true },
  
  // 19th Century (pre-instrumental)
  { id: "hist-1803", magnitude: 7.5, location: "Kumaon-Garhwal Region", time: "1803-09-01T00:00:00Z", depth: 20, coordinates: { lat: 30.0, lng: 79.5 }, state: "Uttarakhand", region: "North India", isHistorical: true },
  { id: "hist-1819", magnitude: 7.7, location: "Allah Bund, Kutch", time: "1819-06-16T00:00:00Z", depth: 25, coordinates: { lat: 23.6, lng: 69.6 }, state: "Gujarat", region: "West India", isHistorical: true },
  { id: "hist-1828", magnitude: 6.8, location: "Kashmir Valley", time: "1828-06-26T00:00:00Z", depth: 20, coordinates: { lat: 34.1, lng: 74.8 }, state: "Jammu & Kashmir", region: "North India", isHistorical: true },
  { id: "hist-1833", magnitude: 7.6, location: "Bihar-Nepal Border", time: "1833-08-26T00:00:00Z", depth: 35, coordinates: { lat: 27.7, lng: 85.5 }, state: "Bihar", region: "East India", isHistorical: true },
  { id: "hist-1842", magnitude: 6.5, location: "Jhelum Valley, Kashmir", time: "1842-02-19T00:00:00Z", depth: 15, coordinates: { lat: 34.4, lng: 73.7 }, state: "Jammu & Kashmir", region: "North India", isHistorical: true },
  { id: "hist-1845", magnitude: 6.3, location: "Sind Region", time: "1845-04-19T00:00:00Z", depth: 20, coordinates: { lat: 25.5, lng: 68.5 }, state: "Gujarat", region: "West India", isHistorical: true },
  { id: "hist-1863", magnitude: 6.7, location: "Kangra Region", time: "1863-03-30T00:00:00Z", depth: 20, coordinates: { lat: 32.1, lng: 76.3 }, state: "Himachal Pradesh", region: "North India", isHistorical: true },
  { id: "hist-1869", magnitude: 7.4, location: "Cachar, Assam", time: "1869-01-10T00:00:00Z", depth: 30, coordinates: { lat: 24.5, lng: 92.5 }, state: "Assam", region: "North-East India", isHistorical: true },
  { id: "hist-1885", magnitude: 7.0, location: "Srinagar, Kashmir", time: "1885-05-30T00:00:00Z", depth: 25, coordinates: { lat: 34.1, lng: 74.8 }, state: "Jammu & Kashmir", region: "North India", isHistorical: true },
  { id: "hist-1897", magnitude: 8.1, location: "Shillong Plateau, Assam", time: "1897-06-12T00:00:00Z", depth: 35, coordinates: { lat: 25.9, lng: 91.0 }, state: "Meghalaya", region: "North-East India", isHistorical: true },
  
  // Early 20th Century (significant events)
  { id: "hist-1905", magnitude: 7.8, location: "Kangra, Himachal Pradesh", time: "1905-04-04T06:20:00Z", depth: 20, coordinates: { lat: 32.3, lng: 76.3 }, state: "Himachal Pradesh", region: "North India", isHistorical: true },
  { id: "hist-1918", magnitude: 7.6, location: "Srimangal, Assam", time: "1918-07-08T00:00:00Z", depth: 30, coordinates: { lat: 24.5, lng: 91.8 }, state: "Assam", region: "North-East India", isHistorical: true },
  { id: "hist-1930", magnitude: 7.1, location: "Dhubri, Assam", time: "1930-07-02T00:00:00Z", depth: 25, coordinates: { lat: 26.0, lng: 90.0 }, state: "Assam", region: "North-East India", isHistorical: true },
  { id: "hist-1934", magnitude: 8.1, location: "Bihar-Nepal Border", time: "1934-01-15T08:43:00Z", depth: 33, coordinates: { lat: 26.5, lng: 86.5 }, state: "Bihar", region: "East India", isHistorical: true },
  { id: "hist-1935", magnitude: 7.7, location: "Quetta, Baluchistan", time: "1935-05-30T00:00:00Z", depth: 25, coordinates: { lat: 29.6, lng: 66.4 }, state: "India", region: "West India", isHistorical: true },
  { id: "hist-1941", magnitude: 8.1, location: "Andaman Islands", time: "1941-06-26T00:00:00Z", depth: 35, coordinates: { lat: 12.5, lng: 92.5 }, state: "Andaman & Nicobar Islands", region: "Andaman Sea", isHistorical: true },
  { id: "hist-1943", magnitude: 7.2, location: "Assam", time: "1943-10-23T00:00:00Z", depth: 30, coordinates: { lat: 26.8, lng: 94.0 }, state: "Assam", region: "North-East India", isHistorical: true },
  { id: "hist-1950", magnitude: 8.6, location: "Assam-Tibet Border", time: "1950-08-15T14:09:00Z", depth: 35, coordinates: { lat: 28.5, lng: 96.5 }, state: "Arunachal Pradesh", region: "North-East India", isHistorical: true },
  { id: "hist-1956", magnitude: 6.7, location: "Anjar, Gujarat", time: "1956-07-21T00:00:00Z", depth: 20, coordinates: { lat: 23.1, lng: 70.0 }, state: "Gujarat", region: "West India", isHistorical: true },
  { id: "hist-1966", magnitude: 5.8, location: "Koyna Dam, Maharashtra", time: "1966-12-10T00:00:00Z", depth: 15, coordinates: { lat: 17.4, lng: 73.7 }, state: "Maharashtra", region: "West India", isHistorical: true },
  { id: "hist-1967", magnitude: 6.3, location: "Koyna, Maharashtra", time: "1967-12-10T22:51:00Z", depth: 10, coordinates: { lat: 17.4, lng: 73.7 }, state: "Maharashtra", region: "West India", isHistorical: true },
  { id: "hist-1975", magnitude: 6.7, location: "Kinnaur, Himachal Pradesh", time: "1975-01-19T00:00:00Z", depth: 25, coordinates: { lat: 31.5, lng: 78.5 }, state: "Himachal Pradesh", region: "North India", isHistorical: true },
  { id: "hist-1988", magnitude: 6.9, location: "Bihar-Nepal Border", time: "1988-08-21T04:39:00Z", depth: 65, coordinates: { lat: 26.7, lng: 86.6 }, state: "Bihar", region: "East India", isHistorical: true },
  { id: "hist-1991", magnitude: 6.8, location: "Uttarkashi, Uttarakhand", time: "1991-10-20T02:53:00Z", depth: 12, coordinates: { lat: 30.8, lng: 78.8 }, state: "Uttarakhand", region: "North India", isHistorical: true },
  { id: "hist-1993", magnitude: 6.2, location: "Killari (Latur), Maharashtra", time: "1993-09-30T00:03:00Z", depth: 10, coordinates: { lat: 18.1, lng: 76.5 }, state: "Maharashtra", region: "West India", isHistorical: true },
  { id: "hist-1997", magnitude: 6.0, location: "Jabalpur, Madhya Pradesh", time: "1997-05-22T00:51:00Z", depth: 35, coordinates: { lat: 23.1, lng: 80.0 }, state: "Madhya Pradesh", region: "Central India", isHistorical: true },
  { id: "hist-1999", magnitude: 6.6, location: "Chamoli, Uttarakhand", time: "1999-03-29T00:35:00Z", depth: 15, coordinates: { lat: 30.4, lng: 79.4 }, state: "Uttarakhand", region: "North India", isHistorical: true },
  { id: "hist-2001", magnitude: 7.7, location: "Bhuj, Gujarat", time: "2001-01-26T03:16:00Z", depth: 16, coordinates: { lat: 23.4, lng: 70.2 }, state: "Gujarat", region: "West India", isHistorical: true },
  { id: "hist-2004", magnitude: 9.1, location: "Sumatra-Andaman", time: "2004-12-26T00:58:00Z", depth: 30, coordinates: { lat: 13.0, lng: 93.0 }, state: "Andaman & Nicobar Islands", region: "Andaman Sea", isHistorical: true },
  { id: "hist-2005", magnitude: 7.6, location: "Kashmir", time: "2005-10-08T03:50:00Z", depth: 26, coordinates: { lat: 34.5, lng: 73.6 }, state: "Jammu & Kashmir", region: "North India", isHistorical: true },
  { id: "hist-2011", magnitude: 6.9, location: "Sikkim", time: "2011-09-18T12:40:00Z", depth: 50, coordinates: { lat: 27.7, lng: 88.2 }, state: "Sikkim", region: "North-East India", isHistorical: true },
  { id: "hist-2015", magnitude: 7.8, location: "Nepal-India Border", time: "2015-04-25T06:11:00Z", depth: 15, coordinates: { lat: 28.2, lng: 84.7 }, state: "Bihar", region: "East India", isHistorical: true },
  { id: "hist-2016", magnitude: 6.7, location: "Manipur", time: "2016-01-04T04:35:00Z", depth: 55, coordinates: { lat: 24.8, lng: 93.7 }, state: "Manipur", region: "North-East India", isHistorical: true },
];

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const dataType = url.searchParams.get("type") || "recent"; // "recent", "historical", "all"
    const startYear = parseInt(url.searchParams.get("startYear") || "1900");
    const endYear = parseInt(url.searchParams.get("endYear") || new Date().getFullYear().toString());
    const minMagnitude = parseFloat(url.searchParams.get("minMagnitude") || "0");
    
    console.log(`Fetching earthquake data: type=${dataType}, years=${startYear}-${endYear}, minMag=${minMagnitude}`);
    
    let allEarthquakes: Earthquake[] = [];
    
    // Fetch recent data from USGS (includes data from ~1900 onwards)
    if (dataType === "recent" || dataType === "all") {
      // India's bounding box: lat 6.5-35.5, lon 68-97.5
      const startDate = dataType === "recent" 
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : `${Math.max(1900, startYear)}-01-01`;
      const endDate = `${endYear}-12-31`;
      
      const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=6.5&maxlatitude=35.5&minlongitude=68&maxlongitude=97.5&minmagnitude=${Math.max(minMagnitude, dataType === "all" ? 4.5 : 0)}&starttime=${startDate}&endtime=${endDate}&orderby=time&limit=2000`;
      
      console.log("Fetching from USGS:", usgsUrl);
      
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

      const usgsEarthquakes: Earthquake[] = data.features?.map((feature: any) => {
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
          isHistorical: new Date(feature.properties.time).getFullYear() < 2000,
        };
      }) || [];
      
      allEarthquakes = [...allEarthquakes, ...usgsEarthquakes];
    }
    
    // Include pre-1900 historical data
    if (dataType === "historical" || dataType === "all") {
      const filteredHistorical = historicalEarthquakes.filter(eq => {
        const year = new Date(eq.time).getFullYear();
        return year >= startYear && year <= endYear && eq.magnitude >= minMagnitude;
      });
      
      // Avoid duplicates (USGS might have some of these)
      const existingIds = new Set(allEarthquakes.map(eq => eq.id));
      const newHistorical = filteredHistorical.filter(eq => !existingIds.has(eq.id));
      
      allEarthquakes = [...allEarthquakes, ...newHistorical];
      console.log(`Added ${newHistorical.length} historical earthquakes`);
    }
    
    // Sort by time (most recent first)
    allEarthquakes.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    // Calculate statistics
    const stats = {
      total: allEarthquakes.length,
      avgMagnitude: allEarthquakes.length > 0 
        ? (allEarthquakes.reduce((sum, eq) => sum + eq.magnitude, 0) / allEarthquakes.length).toFixed(1)
        : 0,
      maxMagnitude: allEarthquakes.length > 0 
        ? Math.max(...allEarthquakes.map(eq => eq.magnitude))
        : 0,
      byRegion: {} as Record<string, number>,
      byDecade: {} as Record<string, number>,
    };
    
    allEarthquakes.forEach(eq => {
      stats.byRegion[eq.region] = (stats.byRegion[eq.region] || 0) + 1;
      const decade = Math.floor(new Date(eq.time).getFullYear() / 10) * 10;
      stats.byDecade[`${decade}s`] = (stats.byDecade[`${decade}s`] || 0) + 1;
    });

    console.log(`Returning ${allEarthquakes.length} total earthquakes`);

    return new Response(JSON.stringify({ 
      earthquakes: allEarthquakes, 
      count: allEarthquakes.length,
      stats,
      dataType,
      dateRange: { startYear, endYear }
    }), {
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
