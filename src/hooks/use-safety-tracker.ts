import { useState, useEffect, useCallback, useRef } from 'react';
import { RISK_ZONES, RiskZone } from '@/lib/risk-zones';
import { calculateDistance } from '@/lib/geo-utils';

export interface SafetyState {
  currentPosition: { lat: number; lng: number } | null;
  activeRisk: RiskZone | null;
  distanceToRisk: number | null;
  trackingError: string | null;
  isTracking: boolean;
}

export function useSafetyTracker() {
  const [state, setState] = useState<SafetyState>({
    currentPosition: null,
    activeRisk: null,
    distanceToRisk: null,
    trackingError: null,
    isTracking: false,
  });

  const lastAlertTime = useRef<number>(0);
  const ALERT_COOLDOWN = 10000; // 10 seconds between voice alerts

  const triggerAlert = useCallback((zone: RiskZone, distance: number) => {
    const now = Date.now();
    
    // 1. Vibration feedback (Mobile only)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 100, 300]);
    }

    // 2. Voice feedback (with cooldown to prevent spam)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && (now - lastAlertTime.current > ALERT_COOLDOWN)) {
      const message = `Caution. Approaching ${zone.type}. ${Math.round(distance)} meters ahead.`;
      const utterance = new SpeechSynthesisUtterance(message);
      window.speechSynthesis.speak(utterance);
      lastAlertTime.current = now;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setState(prev => ({ ...prev, trackingError: "Geolocation not supported" }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        let closestZone: RiskZone | null = null;
        let minDistance = Infinity;

        // Proximity detection logic
        RISK_ZONES.forEach((zone) => {
          const distance = calculateDistance(lat, lng, zone.lat, zone.lng);
          // Alert if within 400 meters
          if (distance <= 400 && distance < minDistance) {
            minDistance = distance;
            closestZone = zone;
          }
        });

        if (closestZone) {
          triggerAlert(closestZone, minDistance);
        }

        setState(prev => ({
          ...prev,
          currentPosition: { lat, lng },
          activeRisk: closestZone,
          distanceToRisk: closestZone ? minDistance : null,
          trackingError: null,
          isTracking: true,
        }));
      },
      (error) => {
        let message = "Unknown location error";
        if (error.code === 1) message = "Permission denied. Please enable GPS.";
        else if (error.code === 2) message = "Position unavailable.";
        else if (error.code === 3) message = "Timed out waiting for GPS.";
        
        setState(prev => ({ ...prev, trackingError: message, isTracking: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [triggerAlert]);

  return state;
}
