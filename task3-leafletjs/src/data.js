/*
  Illustrative example data, not the production NELEP dataset (see README).
  Shaped to match DESNZ's Heat Network Zoning Pilot format, which covers
  Newcastle and Gateshead. Swap this file for a real feed; nothing else
  in the app needs to change.
*/

export const schemes = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.6178, 54.9783] },
      properties: {
        name: 'Newcastle City Centre Heat Network',
        localAuthority: 'Newcastle upon Tyne',
        status: 'operational',
        capacity: '10 MW',
        connectedBuildings: 24,
        description: 'Combined heat and power scheme serving civic, university and residential buildings across the city centre.',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.6033, 54.9526] },
      properties: {
        name: 'Gateshead District Energy Scheme',
        localAuthority: 'Gateshead',
        status: 'operational',
        capacity: '6.8 MW',
        connectedBuildings: 18,
        description: 'Energy-from-waste led network supplying the civic centre, leisure centre and nearby housing.',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5849, 54.9069] },
      properties: {
        name: 'Sunderland Riverside Heat Network',
        localAuthority: 'Sunderland',
        status: 'planned',
        capacity: '4.2 MW',
        connectedBuildings: 11,
        description: 'Proposed low-carbon network for the riverside regeneration area, linked to the wider city energy strategy.',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5758, 54.7761] },
      properties: {
        name: 'Durham University Heat Network',
        localAuthority: 'County Durham',
        status: 'operational',
        capacity: '3.1 MW',
        connectedBuildings: 9,
        description: 'Campus network connecting teaching buildings and student accommodation on the Durham City site.',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.8395, 54.8503] },
      properties: {
        name: 'Consett Heat Network',
        localAuthority: 'County Durham',
        status: 'planned',
        capacity: '2.4 MW',
        connectedBuildings: 7,
        description: 'Planned network for the town centre, exploring mine-water heat recovery as a low-carbon source.',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.4302, 55.0031] },
      properties: {
        name: 'North Shields Fish Quay Heat Network',
        localAuthority: 'North Tyneside',
        status: 'feasibility',
        capacity: 'TBC',
        connectedBuildings: 0,
        description: 'Early-stage feasibility study into a waterfront network serving the fish quay and adjoining housing.',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5361, 54.9891] },
      properties: {
        name: 'Wallsend Heat Network',
        localAuthority: 'North Tyneside',
        status: 'planned',
        capacity: '3.6 MW',
        connectedBuildings: 8,
        description: 'Proposed network linking public buildings around the town centre and metro interchange.',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.4319, 54.9989] },
      properties: {
        name: 'South Shields Heat Network',
        localAuthority: 'South Tyneside',
        status: 'feasibility',
        capacity: 'TBC',
        connectedBuildings: 0,
        description: 'Feasibility study assessing demand around the town hall and seafront regeneration sites.',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5744, 55.1809] },
      properties: {
        name: 'Blyth Heat Network',
        localAuthority: 'Northumberland',
        status: 'planned',
        capacity: '2.9 MW',
        connectedBuildings: 6,
        description: 'Proposed network tied to the Blyth energy hub, exploring offshore wind and hydrogen links.',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5639, 55.1809] },
      properties: {
        name: 'Ashington Heat Network',
        localAuthority: 'Northumberland',
        status: 'feasibility',
        capacity: 'TBC',
        connectedBuildings: 0,
        description: 'Feasibility study into a network serving the town centre and former colliery redevelopment site.',
      },
    },
  ],
};

export const zones = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Newcastle–Gateshead opportunity area' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-1.66, 54.995], [-1.56, 54.995], [-1.56, 54.935],
          [-1.66, 54.935], [-1.66, 54.995],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Sunderland opportunity area' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-1.42, 54.925], [-1.34, 54.925], [-1.34, 54.885],
          [-1.42, 54.885], [-1.42, 54.925],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Durham opportunity area' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-1.60, 54.795], [-1.50, 54.795], [-1.50, 54.755],
          [-1.60, 54.755], [-1.60, 54.795],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'South East Northumberland opportunity area' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-1.62, 55.20], [-1.50, 55.20], [-1.50, 55.16],
          [-1.62, 55.16], [-1.62, 55.20],
        ]],
      },
    },
  ],
};
