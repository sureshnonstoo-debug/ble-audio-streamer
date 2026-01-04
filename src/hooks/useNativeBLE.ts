import { useState, useCallback, useRef } from 'react';
import { BleClient, ScanResult, ConnectionPriority } from '@capacitor-community/bluetooth-le';
import { BLEDevice, ConnectionStatus, AudioConfig } from '@/types/bluetooth';

// ESP32 BLE UUIDs - Update these to match your ESP32 firmware
const AUDIO_SERVICE_UUID = '19b10000-e8f2-537e-4f6c-d104768a1214';
const AUDIO_CHARACTERISTIC_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 8000,
  bitsPerSample: 16,
  channels: 1,
  chunkSize: 160,
};

export function useNativeBLE() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [device, setDevice] = useState<BLEDevice | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [bytesReceived, setBytesReceived] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<BLEDevice[]>([]);

  const connectedDeviceId = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<Int16Array[]>([]);
  const isInitialized = useRef(false);

  const initialize = useCallback(async () => {
    if (isInitialized.current) return true;
    
    try {
      await BleClient.initialize();
      isInitialized.current = true;
      return true;
    } catch (err) {
      setError(`BLE initialization failed: ${(err as Error).message}`);
      return false;
    }
  }, []);

  const scanForDevices = useCallback(async () => {
    const initialized = await initialize();
    if (!initialized) return;

    setStatus('scanning');
    setError(null);
    setDiscoveredDevices([]);

    try {
      // Request permissions on Android
      await BleClient.requestLEScan(
        {
          services: [AUDIO_SERVICE_UUID],
          namePrefix: 'XIAO',
        },
        (result: ScanResult) => {
          const bleDevice: BLEDevice = {
            id: result.device.deviceId,
            name: result.device.name || result.localName || 'Unknown Device',
            connected: false,
          };
          
          setDiscoveredDevices(prev => {
            const exists = prev.find(d => d.id === bleDevice.id);
            if (exists) return prev;
            return [...prev, bleDevice];
          });
        }
      );

      // Stop scan after 10 seconds
      setTimeout(async () => {
        await BleClient.stopLEScan();
        setStatus('disconnected');
      }, 10000);

    } catch (err) {
      setError(`Scan failed: ${(err as Error).message}`);
      setStatus('disconnected');
    }
  }, [initialize]);

  const processAudioData = useCallback((data: DataView) => {
    const samples = new Int16Array(data.buffer);
    audioBufferRef.current.push(samples);

    // Calculate audio level (RMS)
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sum / samples.length);
    const level = Math.min(100, (rms / 32768) * 200);
    setAudioLevel(level);

    setBytesReceived(prev => prev + data.byteLength);

    // Play audio if we have enough buffer
    if (audioBufferRef.current.length >= 4 && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const totalSamples = audioBufferRef.current.reduce((acc, arr) => acc + arr.length, 0);
      const audioBuffer = ctx.createBuffer(1, totalSamples, DEFAULT_AUDIO_CONFIG.sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      let offset = 0;
      for (const samples of audioBufferRef.current) {
        for (let i = 0; i < samples.length; i++) {
          channelData[offset++] = samples[i] / 32768;
        }
      }
      audioBufferRef.current = [];

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    }
  }, []);

  const connectToDevice = useCallback(async (deviceInfo: BLEDevice) => {
    const initialized = await initialize();
    if (!initialized) return;

    setStatus('connecting');
    setError(null);

    try {
      // Connect to device
      await BleClient.connect(deviceInfo.id, (deviceId) => {
        console.log('Device disconnected:', deviceId);
        setStatus('disconnected');
        setDevice(null);
        setAudioLevel(0);
        connectedDeviceId.current = null;
      });

      connectedDeviceId.current = deviceInfo.id;

      // Request higher MTU for better throughput
      try {
        await BleClient.requestConnectionPriority(deviceInfo.id, ConnectionPriority.CONNECTION_PRIORITY_HIGH);
      } catch (e) {
        console.log('Could not set connection priority:', e);
      }

      // Start notifications for audio characteristic
      await BleClient.startNotifications(
        deviceInfo.id,
        AUDIO_SERVICE_UUID,
        AUDIO_CHARACTERISTIC_UUID,
        (value) => {
          processAudioData(value);
        }
      );

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: DEFAULT_AUDIO_CONFIG.sampleRate });

      setDevice({
        ...deviceInfo,
        connected: true,
      });
      setStatus('streaming');
      setBytesReceived(0);

    } catch (err) {
      setError(`Connection failed: ${(err as Error).message}`);
      setStatus('disconnected');
      connectedDeviceId.current = null;
    }
  }, [initialize, processAudioData]);

  const disconnect = useCallback(async () => {
    if (connectedDeviceId.current) {
      try {
        await BleClient.stopNotifications(
          connectedDeviceId.current,
          AUDIO_SERVICE_UUID,
          AUDIO_CHARACTERISTIC_UUID
        );
        await BleClient.disconnect(connectedDeviceId.current);
      } catch (e) {
        console.log('Disconnect error:', e);
      }
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    audioBufferRef.current = [];
    connectedDeviceId.current = null;
    setStatus('disconnected');
    setDevice(null);
    setAudioLevel(0);
    setBytesReceived(0);
  }, []);

  return {
    status,
    device,
    audioLevel,
    bytesReceived,
    error,
    discoveredDevices,
    scanForDevices,
    connectToDevice,
    disconnect,
    isSupported: true, // Native BLE is always supported on Android
  };
}
