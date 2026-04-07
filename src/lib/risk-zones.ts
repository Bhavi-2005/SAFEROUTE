export type RiskLevel = 'high' | 'medium';

export interface RiskZone {
  id: string;
  lat: number;
  lng: number;
  radius: number; // radius for visualization in meters
  level: RiskLevel;
  type: string;
  description: string;
}

/**
 * 2) Hardcoded Accident Risk Zones (3-5 zones)
 */
export const RISK_ZONES: RiskZone[] = [
  {
    id: 'zone-1',
    lat: 37.7749,
    lng: -122.4194,
    radius: 400,
    level: 'high',
    type: 'Complex Intersection',
    description: 'High frequency of blind turns and pedestrian traffic.',
  },
  {
    id: 'zone-2',
    lat: 37.7833,
    lng: -122.4167,
    radius: 400,
    level: 'medium',
    type: 'Narrow Corridor',
    description: 'Reduced visibility and high cyclist activity.',
  },
  {
    id: 'zone-3',
    lat: 37.7694,
    lng: -122.4862,
    radius: 400,
    level: 'high',
    type: 'Highway Curve',
    description: 'Sharp blind curve with heavy high-speed traffic.',
  },
  {
    id: 'zone-4',
    lat: 37.8012,
    lng: -122.4012,
    radius: 400,
    level: 'high',
    type: 'Steep Descent',
    description: 'Steep grade with risk of high-speed collisions.',
  },
  {
    id: 'zone-5',
    lat: 37.7510,
    lng: -122.4476,
    radius: 400,
    level: 'medium',
    type: 'School Zone',
    description: 'Increased child pedestrian traffic during school hours.',
  }
];
