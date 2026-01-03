import { useState, useCallback, useRef } from 'react';
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

// Type definitions for Web Bluetooth API
type BluetoothDeviceType = {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect(): Promise<any>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<any>;
  };
  addEventListener(type: string, listener: () => void): void;
};

type CharacteristicType = {
  startNotifications(): Promise<any>;
  addEventListener(type: string, listener: (event: Event) => void): void;
};

export function useBLEAudio() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [device, setDevice] = useState<BLEDevice | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [bytesReceived, setBytesReceived] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<BLEDevice[]>([]);

  const bluetoothDeviceRef = useRef<BluetoothDeviceType | null>(null);
  const characteristicRef = useRef<CharacteristicType | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<Int16Array[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bluetooth = (navigator as any).bluetooth;
  const isSupported = !!bluetooth;

  const checkBLESupport = useCallback(() => {
    if (!bluetooth) {
      setError('Web Bluetooth API is not supported in this browser. Please use Chrome on Android or desktop.');
      return false;
    }
    return true;
  }, [bluetooth]);

  const scanForDevices = useCallback(async () => {
    if (!checkBLESupport()) return;

    setStatus('scanning');
    setError(null);
    setDiscoveredDevices([]);

    try {
      const device = await bluetooth.requestDevice({
        filters: [
          { namePrefix: 'XIAO' },
          { namePrefix: 'ESP32' },
          { namePrefix: 'BLE_MIC' },
        ],
        optionalServices: [AUDIO_SERVICE_UUID],
      });

      if (device) {
        const bleDevice: BLEDevice = {
          id: device.id,
          name: device.name || 'Unknown Device',
          connected: false,
        };
        setDiscoveredDevices([bleDevice]);
        setStatus('disconnected');
      }
    } catch (err) {
      if ((err as Error).name === 'NotFoundError') {
        setError('No BLE devices found. Make sure your ESP32 is advertising.');
      } else {
        setError(`Scan failed: ${(err as Error).message}`);
      }
      setStatus('disconnected');
    }
  }, [checkBLESupport, bluetooth]);

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
    if (!checkBLESupport()) return;

    setStatus('connecting');
    setError(null);

    try {
      // Request the device again with proper services
      const device = await bluetooth.requestDevice({
        filters: [{ name: deviceInfo.name }],
        optionalServices: [AUDIO_SERVICE_UUID],
      });

      bluetoothDeviceRef.current = device;

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
        setDevice(null);
        setAudioLevel(0);
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      const service = await server.getPrimaryService(AUDIO_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(AUDIO_CHARACTERISTIC_UUID);
      
      characteristicRef.current = characteristic;

      // Enable notifications (this writes to CCCD 0x2902)
      await characteristic.startNotifications();
      
      characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (event.target as any).value;
        if (value) {
          processAudioData(value);
        }
      });

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
    }
  }, [checkBLESupport, processAudioData, bluetooth]);

  const disconnect = useCallback(() => {
    if (bluetoothDeviceRef.current?.gatt?.connected) {
      bluetoothDeviceRef.current.gatt.disconnect();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    audioBufferRef.current = [];
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
    isSupported,
  };
}
