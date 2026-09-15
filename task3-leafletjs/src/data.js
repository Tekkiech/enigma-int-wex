/*
  Real published figures, not the pre-prod page's live dataset (see README).

  Source: DESNZ, "Heat Networks registered under the Heat Network (Metering
  and Billing) Regulations", December 2022 release — tables 1.2b (networks
  by local authority and network type) and 1.3c (customers by local
  authority and customer type), filtered to the seven North East Mayoral
  Strategic Authority local authorities.
  https://www.data.gov.uk/dataset/f547129e-a722-4992-9f37-baa3b1a516a7/heat-networks-registered-under-the-heat-network-metering-and-billing-regulations

  This register only publishes counts per local authority, not individual
  scheme names or addresses, so each feature below is one local authority
  with its communal/district network counts and customer breakdown — not
  a single named scheme. Swap this file for a different release or a
  scheme-level feed; nothing else in the app needs to change.
*/

export const networks = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.6178, 54.9783] },
      properties: {
        localAuthority: 'Newcastle upon Tyne',
        communal: 231,
        district: 7,
        customers: { residential: 4266, commercial: 245, industrial: 60, public: 7, other: 4, total: 4582 },
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.6018, 54.9631] },
      properties: {
        localAuthority: 'Gateshead',
        communal: 50,
        district: 7,
        customers: { residential: 795, commercial: 200, industrial: 0, public: 6, other: 0, total: 1001 },
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.3838, 54.9069] },
      properties: {
        localAuthority: 'Sunderland',
        communal: 44,
        district: 60,
        customers: { residential: 3177, commercial: 236, industrial: 8, public: 3, other: 8, total: 3432 },
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5733, 54.7761] },
      properties: {
        localAuthority: 'County Durham',
        communal: 73,
        district: 5,
        customers: { residential: 1231, commercial: 157, industrial: 0, public: 2, other: 0, total: 1390 },
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.6874, 55.1706] },
      properties: {
        localAuthority: 'Northumberland',
        communal: 45,
        district: 22,
        customers: { residential: 1243, commercial: 33, industrial: 2, public: 6, other: 0, total: 1284 },
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.4478, 55.0069] },
      properties: {
        localAuthority: 'North Tyneside',
        communal: 47,
        district: 5,
        customers: { residential: 1180, commercial: 6, industrial: 0, public: 0, other: 0, total: 1186 },
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.43, 54.9993] },
      properties: {
        localAuthority: 'South Tyneside',
        communal: 53,
        district: 2,
        customers: { residential: 1665, commercial: 0, industrial: 0, public: 0, other: 0, total: 1665 },
      },
    },
  ],
};

// DESNZ's separate Heat Network Zoning Pilot named Newcastle and Gateshead
// as one of its pilot areas; the boundary here is an illustrative
// approximation, not traced from the pilot's own GIS output.
export const zones = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Newcastle–Gateshead Heat Network Zoning Pilot area (approximate)' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-1.66, 54.995], [-1.56, 54.995], [-1.56, 54.935],
          [-1.66, 54.935], [-1.66, 54.995],
        ]],
      },
    },
  ],
};
