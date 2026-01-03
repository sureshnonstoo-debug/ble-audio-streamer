export interface BLEDevice {
  id: string;
  name: string;
  rssi?: number;
  connected: boolean;
}

export interface AudioConfig {
  sampleRate: number;
  bitsPerSample: number;
  channels: number;
  chunkSize: number;
}

export type ConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'streaming';

export interface BLEAudioState {
  status: ConnectionStatus;
  device: BLEDevice | null;
  audioLevel: number;
  bytesReceived: number;
  error: string | null;
}
