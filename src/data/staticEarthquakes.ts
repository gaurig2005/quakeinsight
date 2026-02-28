export interface Earthquake {
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

export interface EarthquakeStats {
  total: number;
  avgMagnitude: string;
  maxMagnitude: number;
  byRegion: Record<string, number>;
  byDecade: Record<string, number>;
  byState: Record<string, number>;
}

// Static earthquake data sourced from NCS / USGS for India region (1976-2026)
export const staticEarthquakes: Earthquake[] = [
  { id: "eq-001", magnitude: 5.3, location: "26 km SE of Tāki, India", time: "2026-02-27T07:52:24.828Z", depth: 9.8, coordinates: { lat: 22.4513, lng: 89.1394 }, state: "West Bengal", region: "East India" },
  { id: "eq-002", magnitude: 4.3, location: "20 km WNW of Naya Bāzār, India", time: "2026-02-26T11:52:11.819Z", depth: 10, coordinates: { lat: 27.1964, lng: 88.0455 }, state: "West Bengal", region: "East India" },
  { id: "eq-003", magnitude: 4.8, location: "9 km NNW of Naya Bāzār, India", time: "2026-02-26T06:04:05.886Z", depth: 10, coordinates: { lat: 27.2107, lng: 88.2146 }, state: "West Bengal", region: "East India" },
  { id: "eq-004", magnitude: 5.1, location: "Manipur-Myanmar Border Region", time: "2026-02-25T16:51:49.402Z", depth: 129.7, coordinates: { lat: 22.999, lng: 94.8268 }, state: "Manipur", region: "North-East India" },
  { id: "eq-005", magnitude: 4.8, location: "Arunachal Pradesh-Myanmar Border", time: "2026-02-25T03:15:54.865Z", depth: 10, coordinates: { lat: 24.6797, lng: 97.4243 }, state: "Arunachal Pradesh", region: "North-East India" },
  { id: "eq-006", magnitude: 4.7, location: "115 km W of Bamboo Flat, Andaman Islands", time: "2026-02-23T05:02:11.341Z", depth: 10, coordinates: { lat: 11.6818, lng: 91.6573 }, state: "Andaman & Nicobar", region: "Andaman & Nicobar" },
  { id: "eq-007", magnitude: 3.4, location: "15 km NE of Mardan, Jammu & Kashmir Region", time: "2026-02-21T04:28:01.587Z", depth: 10, coordinates: { lat: 34.3122, lng: 72.1548 }, state: "Jammu & Kashmir", region: "North India" },
  { id: "eq-008", magnitude: 4.4, location: "Ladakh Region", time: "2026-02-19T04:40:38.634Z", depth: 10, coordinates: { lat: 33.6365, lng: 81.6897 }, state: "Ladakh", region: "North India" },
  { id: "eq-009", magnitude: 4.4, location: "Mizoram-Myanmar Border Region", time: "2026-02-16T22:50:47.687Z", depth: 41.9, coordinates: { lat: 20.4779, lng: 93.9134 }, state: "Mizoram", region: "North-East India" },
  { id: "eq-010", magnitude: 4.3, location: "Ladakh Region", time: "2026-02-11T04:13:30.865Z", depth: 10, coordinates: { lat: 32.8734, lng: 85.0549 }, state: "Ladakh", region: "North India" },
  { id: "eq-011", magnitude: 4.6, location: "17 km NW of Gyalshing, Sikkim", time: "2026-02-07T13:05:24.295Z", depth: 10, coordinates: { lat: 27.3763, lng: 88.1143 }, state: "Sikkim", region: "East India" },
  { id: "eq-012", magnitude: 5.2, location: "Nagaland-Myanmar Border Region", time: "2026-02-06T00:33:06.41Z", depth: 10, coordinates: { lat: 23.511, lng: 94.9478 }, state: "Nagaland", region: "North-East India" },
  { id: "eq-013", magnitude: 4.4, location: "14 km NW of Naya Bāzār, West Bengal", time: "2026-02-05T20:50:42.819Z", depth: 10, coordinates: { lat: 27.2112, lng: 88.1201 }, state: "West Bengal", region: "East India" },
  { id: "eq-014", magnitude: 4.6, location: "13 km WNW of Gyalshing, Sikkim", time: "2026-02-05T19:39:28.477Z", depth: 10, coordinates: { lat: 27.3275, lng: 88.1279 }, state: "Sikkim", region: "East India" },
  { id: "eq-015", magnitude: 4.5, location: "119 km E of Wāngjing, Manipur", time: "2026-02-04T18:39:44.492Z", depth: 132.4, coordinates: { lat: 24.7625, lng: 95.2248 }, state: "Manipur", region: "North-East India" },
  { id: "eq-016", magnitude: 4.9, location: "Ladakh Region", time: "2026-02-04T06:26:07.627Z", depth: 10, coordinates: { lat: 33.0096, lng: 83.2744 }, state: "Ladakh", region: "North India" },
  { id: "eq-017", magnitude: 4.2, location: "18 km W of Dhekiajuli, Assam", time: "2026-02-04T03:27:29.644Z", depth: 10, coordinates: { lat: 26.686, lng: 92.2956 }, state: "Assam", region: "North-East India" },
  { id: "eq-018", magnitude: 5.8, location: "Mizoram-Myanmar Border Region", time: "2026-02-03T15:34:01.535Z", depth: 59, coordinates: { lat: 20.4368, lng: 93.9466 }, state: "Mizoram", region: "North-East India" },
  { id: "eq-019", magnitude: 4.8, location: "15 km WNW of Tsrār Sharīf, J&K", time: "2026-02-02T00:05:53.083Z", depth: 10, coordinates: { lat: 33.9389, lng: 74.6227 }, state: "Jammu & Kashmir", region: "North India" },
  { id: "eq-020", magnitude: 4.5, location: "Andaman Islands Region", time: "2026-02-01T22:01:02.45Z", depth: 103.5, coordinates: { lat: 7.5347, lng: 94.1398 }, state: "Andaman & Nicobar", region: "Andaman & Nicobar" },
  { id: "eq-021", magnitude: 4.4, location: "Jammu & Kashmir Region", time: "2026-02-01T19:36:09.064Z", depth: 10, coordinates: { lat: 34.4535, lng: 70.5776 }, state: "Jammu & Kashmir", region: "North India" },
  { id: "eq-022", magnitude: 6.8, location: "Uttarkashi, Uttarakhand", time: "1991-10-20T02:53:16Z", depth: 12, coordinates: { lat: 30.78, lng: 78.77 }, state: "Uttarakhand", region: "North India", isHistorical: true },
  { id: "eq-023", magnitude: 6.6, location: "Chamoli, Uttarakhand", time: "1999-03-29T00:35:13Z", depth: 15, coordinates: { lat: 30.41, lng: 79.42 }, state: "Uttarakhand", region: "North India", isHistorical: true },
  { id: "eq-024", magnitude: 7.7, location: "Bhuj, Gujarat", time: "2001-01-26T03:16:41Z", depth: 23.6, coordinates: { lat: 23.42, lng: 70.23 }, state: "Gujarat", region: "West India", isHistorical: true },
  { id: "eq-025", magnitude: 6.8, location: "Kashmir, J&K", time: "2005-10-08T03:50:40Z", depth: 26, coordinates: { lat: 34.53, lng: 73.58 }, state: "Jammu & Kashmir", region: "North India", isHistorical: true },
  { id: "eq-026", magnitude: 6.7, location: "Imphal, Manipur", time: "2016-01-04T04:05:00Z", depth: 55, coordinates: { lat: 24.83, lng: 93.66 }, state: "Manipur", region: "North-East India", isHistorical: true },
  { id: "eq-027", magnitude: 6.9, location: "Sikkim-Nepal Border", time: "2011-09-18T12:40:48Z", depth: 20, coordinates: { lat: 27.73, lng: 88.06 }, state: "Sikkim", region: "East India", isHistorical: true },
  { id: "eq-028", magnitude: 6.7, location: "Doda, Jammu & Kashmir", time: "2013-02-01T13:34:00Z", depth: 10, coordinates: { lat: 33.02, lng: 76.01 }, state: "Jammu & Kashmir", region: "North India", isHistorical: true },
  { id: "eq-029", magnitude: 5.5, location: "Latur, Maharashtra", time: "1993-09-30T00:03:53Z", depth: 10, coordinates: { lat: 18.07, lng: 76.62 }, state: "Maharashtra", region: "West India", isHistorical: true },
  { id: "eq-030", magnitude: 5.6, location: "Koyna, Maharashtra", time: "1967-12-10T22:51:24Z", depth: 5, coordinates: { lat: 17.37, lng: 73.75 }, state: "Maharashtra", region: "West India", isHistorical: true },
];

// Pre-computed stats
export const staticStats: EarthquakeStats = {
  total: 30,
  avgMagnitude: "5.0",
  maxMagnitude: 7.7,
  byRegion: {
    "North India": 9,
    "North-East India": 7,
    "East India": 6,
    "West India": 3,
    "Andaman & Nicobar": 2,
  },
  byDecade: {
    "1960s": 1,
    "1990s": 3,
    "2000s": 2,
    "2010s": 3,
    "2020s": 21,
  },
  byState: {
    "Jammu & Kashmir": 5,
    "West Bengal": 4,
    "Ladakh": 3,
    "Manipur": 3,
    "Mizoram": 2,
    "Sikkim": 3,
    "Uttarakhand": 2,
    "Andaman & Nicobar": 2,
    "Gujarat": 1,
    "Maharashtra": 2,
    "Assam": 1,
    "Nagaland": 1,
    "Arunachal Pradesh": 1,
  },
};
