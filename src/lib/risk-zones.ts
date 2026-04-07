export type RiskLevel = 'high' | 'medium';

export interface RiskZone {
  id: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  level: RiskLevel;
  type: string;
  description: string;
}

/**
 * Hardcoded accident risk zones for demonstration.
 * Locations are centered around common metropolitan test areas.
 */
export const RISK_ZONES: RiskZone[] = [
  {
    id: 'zone-1',
    lat: 37.7749,
    lng: -122.4194,
    radius: 400,
    level: 'high',
    type: 'Complex Intersection',
    description: 'High frequency of pedestrian incidents and blind turns.',
  },
  {
    id: 'zone-2',
    lat: 37.7833,
    lng: -122.4167,
    radius: 400,
    level: 'medium',
    type: 'Narrow Corridor',
    description: 'Reduced visibility and frequent cyclist activity.',
  },
  {
    id: 'zone-3',
    lat: 37.7694,
    lng: -122.4862,
    radius: 400,
    level: 'high',
    type: 'Sharp Highway Curve',
    description: 'Dangerous curve with history of hydroplaning incidents.',
  },
  {
    id: 'zone-4',
    lat: 37.7510,
    lng: -122.4476,
    radius: 400,
    level: 'medium',
    type: 'School Zone',
    description: 'High child pedestrian traffic during morning and afternoon peaks.',
  },
  {
    id: 'zone-5',
    lat: 37.8012,
    lng: -122.4012,
    radius: 400,
    level: 'high',
    type: 'Steep Descent',
    description: 'Steep grade with potential for brake failure and high speeds.',
  }
];
