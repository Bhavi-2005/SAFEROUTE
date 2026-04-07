import { useState, useEffect, useCallback, useRef } from 'react';
import { RISK_ZONES, RiskZone } from '@/lib/risk-zones';
import { calculateDistance } from '@/lib/geo-utils';
import { contextualRiskWarning } from '@/ai/flows/contextual-risk-warning';

export interface SafetyState {
  currentPosition: { lat: number; lng: number } | null;
  activeRisk: RiskZone | null;
  aiWarning: string | null;
  distanceToRisk: number | null;
  trackingError: string | null;
}

export function useSafetyTracker() {
  const [state, setState] = useState<SafetyState>({
    currentPosition: null,
    activeRisk: null,
    aiWarning: null,
    distanceToRisk: null,
    trackingError: null,
  });

  const lastAlertedZoneId = useRef<string | null>(null);
  const isSpeaking = useRef(false);

  const triggerAlert = useCallback(async (zone: RiskZone, distance: number) => {
    // Multi-modal feedback
    if (typeof window !== 'undefined') {
      // 1. Vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // 2. Speech Synthesis
      if ('speechSynthesis' in window && !isSpeaking.current) {
        const utterance = new SpeechSynthesisUtterance(
          `Warning! ${zone.level} risk zone ahead. ${zone.type} in ${Math.round(distance)} meters.`
        );
        utterance.onstart = () => { isSpeaking.current = true; };
        utterance.onend = () => { isSpeaking.current = false; };
        window.speechSynthesis.speak(utterance);
      }
    }

    // 3. AI Warning Flow
    if (zone.id !== lastAlertedZoneId.current) {
      lastAlertedZoneId.current = zone.id;
      try {
        const result = await contextualRiskWarning({
          riskLevel: zone.level,
          hazardType: zone.type,
          hazardDescription: zone.description,
          distanceMeters: Math.round(distance),
        });
        setState(prev => ({ ...prev, aiWarning: result.warningMessage }));
      } catch (error) {
        console.error("AI Warning generation failed", error);
      }
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

        // Rule-based risk detection
        RISK_ZONES.forEach((zone) => {
          const distance = calculateDistance(lat, lng, zone.lat, zone.lng);
          if (distance < zone.radius && distance < minDistance) {
            minDistance = distance;
            closestZone = zone;
          }
        });

        if (closestZone) {
          triggerAlert(closestZone, minDistance);
        } else {
          lastAlertedZoneId.current = null;
        }

        setState(prev => ({
          ...prev,
          currentPosition: { lat, lng },
          activeRisk: closestZone,
          distanceToRisk: closestZone ? minDistance : null,
          aiWarning: closestZone ? prev.aiWarning : null,
          trackingError: null,
        }));
      },
      (error) => {
        setState(prev => ({ ...prev, trackingError: error.message }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [triggerAlert]);

  return state;
}
