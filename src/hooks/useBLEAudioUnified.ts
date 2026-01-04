import { useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { useBLEAudio } from './useBLEAudio';
import { useNativeBLE } from './useNativeBLE';

/**
 * Unified BLE hook that automatically uses native BLE on Android/iOS
 * and falls back to Web Bluetooth API on desktop browsers
 */
export function useBLEAudioUnified() {
  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);
  
  // Always call both hooks to satisfy React's rules of hooks
  const webBLE = useBLEAudio();
  const nativeBLE = useNativeBLE();

  // Return the appropriate implementation based on platform
  return isNative ? nativeBLE : webBLE;
}
