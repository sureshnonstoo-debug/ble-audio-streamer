import { useBLEAudio } from '@/hooks/useBLEAudio';
import { Header } from '@/components/Header';
import { ScanButton } from '@/components/ScanButton';
import { DeviceCard } from '@/components/DeviceCard';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { StatsDisplay } from '@/components/StatsDisplay';
import { BrowserWarning } from '@/components/BrowserWarning';
import { AlertCircle } from 'lucide-react';

const Index = () => {
  const {
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
  } = useBLEAudio();

  const isStreaming = status === 'streaming';
  const isConnected = status === 'connected' || isStreaming;

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow effect */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: isStreaming 
            ? 'radial-gradient(circle at 50% 30%, hsl(175 80% 50% / 0.15) 0%, transparent 50%)'
            : 'none',
          transition: 'all 0.5s ease-out',
        }}
      />

      <div className="relative max-w-md mx-auto px-4 py-8 space-y-6">
        <Header status={status} />

        {!isSupported && <BrowserWarning />}

        {error && (
          <div className="glass-card p-4 rounded-xl border-destructive/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {isSupported && !isConnected && (
          <ScanButton 
            status={status} 
            onScan={scanForDevices}
            disabled={status === 'scanning'}
          />
        )}

        {discoveredDevices.length > 0 && !device && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">
              Discovered Devices
            </h2>
            {discoveredDevices.map((d) => (
              <DeviceCard
                key={d.id}
                device={d}
                status={status}
                onConnect={() => connectToDevice(d)}
                onDisconnect={disconnect}
              />
            ))}
          </div>
        )}

        {device && (
          <DeviceCard
            device={device}
            status={status}
            onConnect={() => connectToDevice(device)}
            onDisconnect={disconnect}
          />
        )}

        {isConnected && (
          <>
            <AudioVisualizer audioLevel={audioLevel} isActive={isStreaming} />
            <StatsDisplay bytesReceived={bytesReceived} isStreaming={isStreaming} />
          </>
        )}

        {/* Info section */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-semibold mb-3">Setup Instructions</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Flash your ESP32-S3 with BLE audio firmware</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Ensure device name starts with "XIAO", "ESP32", or "BLE_MIC"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>Click "Scan" and select your device from the browser prompt</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <span>Audio will stream automatically after connection</span>
            </li>
          </ol>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Requires Chrome on Android or Desktop • PCM 16-bit @ 8kHz
        </p>
      </div>
    </div>
  );
};

export default Index;
