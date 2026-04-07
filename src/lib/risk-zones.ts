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

// Hardcoded risk zones (Example locations - could be adjusted for demo)
export const RISK_ZONES: RiskZone[] = [
  {
    id: 'zone-1',
    lat: 37.7749, // San Francisco area as example
    lng: -122.4194,
    radius: 400,
    level: 'high',
    type: 'Complex Intersection',
    description: 'Frequent accidents involving pedestrians and high-speed turns.',
  },
  {
    id: 'zone-2',
    lat: 37.7833,
    lng: -122.4167,
    radius: 300,
    level: 'medium',
    type: 'Narrow One-Way Street',
    description: 'Reduced visibility and high cyclist activity.',
  },
  {
    id: 'zone-3',
    lat: 37.7694,
    lng: -122.4862,
    radius: 500,
    level: 'high',
    type: 'Sharp Curve',
    description: 'Blind corner with limited runoff space; slippery when wet.',
  },
  {
    id: 'zone-4',
    lat: 37.7510,
    lng: -122.4476,
    radius: 350,
    level: 'medium',
    type: 'Heavy School Traffic',
    description: 'School zone with frequent pedestrian crossings during peak hours.',
  }
];
