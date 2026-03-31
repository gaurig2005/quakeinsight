export interface Earthquake {
  id: string;
  magnitude: number;
  location: string;
  time: string;
  depth: number;
  coordinates: { lat: number; lng: number };
  state: string;
  region: string;
  isHistorical: boolean;
}

// Static India-only earthquake dataset (real historical events)
export const indiaEarthquakes: Earthquake[] = [
  {
    id: "ind-001",
    magnitude: 6.7,
    location: "Imphal, Manipur",
    time: "2016-01-04T04:35:00Z",
    depth: 55,
    coordinates: { lat: 24.83, lng: 93.66 },
    state: "Manipur",
    region: "North-East India",
    isHistorical: false,
  },
  {
    id: "ind-002",
    magnitude: 7.8,
    location: "Nepal-India Border, Bihar",
    time: "2015-04-25T06:11:00Z",
    depth: 15,
    coordinates: { lat: 28.23, lng: 84.73 },
    state: "Bihar",
    region: "Himalayan Belt",
    isHistorical: false,
  },
  {
    id: "ind-003",
    magnitude: 5.5,
    location: "Latur, Maharashtra",
    time: "2024-03-15T02:45:00Z",
    depth: 10,
    coordinates: { lat: 18.39, lng: 76.57 },
    state: "Maharashtra",
    region: "Peninsular India",
    isHistorical: false,
  },
  {
    id: "ind-004",
    magnitude: 4.2,
    location: "Pithoragarh, Uttarakhand",
    time: "2025-12-10T14:20:00Z",
    depth: 8,
    coordinates: { lat: 29.58, lng: 80.22 },
    state: "Uttarakhand",
    region: "Himalayan Belt",
    isHistorical: false,
  },
  {
    id: "ind-005",
    magnitude: 5.8,
    location: "Diglipur, Andaman & Nicobar",
    time: "2025-11-22T09:30:00Z",
    depth: 35,
    coordinates: { lat: 13.27, lng: 93.07 },
    state: "Andaman & Nicobar",
    region: "Andaman-Nicobar",
    isHistorical: false,
  },
  {
    id: "ind-006",
    magnitude: 7.7,
    location: "Bhuj, Gujarat",
    time: "2001-01-26T03:16:00Z",
    depth: 23,
    coordinates: { lat: 23.42, lng: 70.23 },
    state: "Gujarat",
    region: "Kutch",
    isHistorical: true,
  },
  {
    id: "ind-007",
    magnitude: 6.9,
    location: "Sikkim-Nepal Border",
    time: "2011-09-18T12:40:00Z",
    depth: 19.7,
    coordinates: { lat: 27.72, lng: 88.06 },
    state: "Sikkim",
    region: "Himalayan Belt",
    isHistorical: true,
  },
  {
    id: "ind-008",
    magnitude: 4.6,
    location: "Tezpur, Assam",
    time: "2025-08-05T18:12:00Z",
    depth: 12,
    coordinates: { lat: 26.63, lng: 92.8 },
    state: "Assam",
    region: "North-East India",
    isHistorical: false,
  },
  {
    id: "ind-009",
    magnitude: 3.8,
    location: "Kangra, Himachal Pradesh",
    time: "2025-10-01T05:55:00Z",
    depth: 5,
    coordinates: { lat: 32.1, lng: 76.27 },
    state: "Himachal Pradesh",
    region: "Himalayan Belt",
    isHistorical: false,
  },
  {
    id: "ind-010",
    magnitude: 5.1,
    location: "Srinagar, Jammu & Kashmir",
    time: "2025-06-18T11:42:00Z",
    depth: 18,
    coordinates: { lat: 34.08, lng: 74.8 },
    state: "Jammu & Kashmir",
    region: "Kashmir",
    isHistorical: false,
  },
  {
    id: "ind-011",
    magnitude: 6.0,
    location: "Car Nicobar, Andaman & Nicobar",
    time: "2014-03-21T07:15:00Z",
    depth: 42,
    coordinates: { lat: 9.16, lng: 92.75 },
    state: "Andaman & Nicobar",
    region: "Andaman-Nicobar",
    isHistorical: true,
  },
  {
    id: "ind-012",
    magnitude: 4.0,
    location: "Koyna, Maharashtra",
    time: "2025-09-12T03:28:00Z",
    depth: 7,
    coordinates: { lat: 17.4, lng: 73.75 },
    state: "Maharashtra",
    region: "Peninsular India",
    isHistorical: false,
  },
  {
    id: "ind-013",
    magnitude: 3.5,
    location: "Dharamshala, Himachal Pradesh",
    time: "2025-07-28T22:10:00Z",
    depth: 6,
    coordinates: { lat: 32.22, lng: 76.32 },
    state: "Himachal Pradesh",
    region: "Himalayan Belt",
    isHistorical: false,
  },
  {
    id: "ind-014",
    magnitude: 6.5,
    location: "Chamoli, Uttarakhand",
    time: "1999-03-29T00:35:00Z",
    depth: 21,
    coordinates: { lat: 30.41, lng: 79.42 },
    state: "Uttarakhand",
    region: "Himalayan Belt",
    isHistorical: true,
  },
  {
    id: "ind-015",
    magnitude: 5.0,
    location: "Aizawl, Mizoram",
    time: "2025-04-14T16:50:00Z",
    depth: 25,
    coordinates: { lat: 23.73, lng: 92.72 },
    state: "Mizoram",
    region: "North-East India",
    isHistorical: false,
  },
  {
    id: "ind-016",
    magnitude: 8.7,
    location: "Shillong Plateau, Assam",
    time: "1897-06-12T11:06:00Z",
    depth: 30,
    coordinates: { lat: 26.0, lng: 91.0 },
    state: "Assam",
    region: "North-East India",
    isHistorical: true,
  },
  {
    id: "ind-017",
    magnitude: 7.5,
    location: "Kangra, Himachal Pradesh",
    time: "1905-04-04T06:20:00Z",
    depth: 25,
    coordinates: { lat: 32.3, lng: 76.2 },
    state: "Himachal Pradesh",
    region: "Himalayan Belt",
    isHistorical: true,
  },
  {
    id: "ind-018",
    magnitude: 8.6,
    location: "Great Assam Earthquake",
    time: "1950-08-15T14:09:00Z",
    depth: 30,
    coordinates: { lat: 28.5, lng: 96.5 },
    state: "Assam",
    region: "North-East India",
    isHistorical: true,
  },
  {
    id: "ind-019",
    magnitude: 6.3,
    location: "Uttarkashi, Uttarakhand",
    time: "1991-10-20T02:53:00Z",
    depth: 12,
    coordinates: { lat: 30.75, lng: 78.77 },
    state: "Uttarakhand",
    region: "Himalayan Belt",
    isHistorical: true,
  },
  {
    id: "ind-020",
    magnitude: 4.8,
    location: "Joshimath, Uttarakhand",
    time: "2025-01-20T08:15:00Z",
    depth: 10,
    coordinates: { lat: 30.55, lng: 79.56 },
    state: "Uttarakhand",
    region: "Himalayan Belt",
    isHistorical: false,
  },
];

// Pre-computed stats
export const indiaStats = {
  total: indiaEarthquakes.length,
  avgMagnitude: (indiaEarthquakes.reduce((s, e) => s + e.magnitude, 0) / indiaEarthquakes.length).toFixed(1),
  maxMagnitude: Math.max(...indiaEarthquakes.map(e => e.magnitude)),
  byState: indiaEarthquakes.reduce((acc, e) => {
    acc[e.state] = (acc[e.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  byRegion: indiaEarthquakes.reduce((acc, e) => {
    acc[e.region] = (acc[e.region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  byDecade: indiaEarthquakes.reduce((acc, e) => {
    const decade = Math.floor(new Date(e.time).getFullYear() / 10) * 10;
    const key = `${decade}s`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
};

export const recentIndiaEarthquakes = indiaEarthquakes
  .filter(e => !e.isHistorical)
  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

export const historicalIndiaEarthquakes = indiaEarthquakes
  .filter(e => e.isHistorical)
  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
