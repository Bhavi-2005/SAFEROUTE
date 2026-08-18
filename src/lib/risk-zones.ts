export type RiskLevel = 'high' | 'medium';

export interface RiskZone {
  id: string;
  lat: number;
  lng: number;
  radius: number; // radius for visualization in meters
  level: RiskLevel;
  severity: number; // 1-10 scale
  type: string;
  description: string;
}

/**
 * Hardcoded Accident Risk Zones for testing and demonstration.
 * Locations are centered around San Francisco.
 */
export const RISK_ZONES: RiskZone[] = [
  {
    id: 'zone-1',
    lat: 37.7749,
    lng: -122.4194,
    radius: 400,
    level: 'high',
    severity: 9,
    type: 'Complex Intersection',
    description: 'High frequency of blind turns and pedestrian traffic.',
  },
  {
    id: 'zone-2',
    lat: 37.7833,
    lng: -122.4167,
    radius: 400,
    level: 'medium',
    severity: 6,
    type: 'Narrow Corridor',
    description: 'Reduced visibility and high cyclist activity.',
  },
  {
    id: 'zone-3',
    lat: 37.7694,
    lng: -122.4862,
    radius: 400,
    level: 'high',
    severity: 10,
    type: 'Highway Curve',
    description: 'Sharp blind curve with heavy high-speed traffic.',
  },
  {
    id: 'zone-4',
    lat: 37.8012,
    lng: -122.4012,
    radius: 400,
    level: 'high',
    severity: 8,
    type: 'Steep Descent',
    description: 'Steep grade with risk of high-speed collisions.',
  },
  {
    id: 'zone-5',
    lat: 37.7510,
    lng: -122.4476,
    radius: 400,
    level: 'medium',
    severity: 7,
    type: 'School Zone',
    description: 'Increased child pedestrian traffic during school hours.',
  },
  {
    id: 'zone-6',
    lat: 37.8021,
    lng: -122.4187,
    radius: 400,
    level: 'high',
    severity: 10,
    type: 'Switchback Curve',
    description: 'Extremely sharp curves with heavy tourist and resident traffic.',
  },
  {
    id: 'zone-7',
    lat: 37.7725,
    lng: -122.4230,
    radius: 400,
    level: 'high',
    severity: 9,
    type: 'Freeway Approach',
    description: 'High-speed merging traffic with significant blind spots.',
  },
  {
    id: 'zone-8',
    lat: 37.7854,
    lng: -122.4215,
    radius: 400,
    level: 'high',
    severity: 8,
    type: 'Transit Corridor',
    description: 'Multi-lane intersection with frequent emergency vehicle crossings.',
  }
];
