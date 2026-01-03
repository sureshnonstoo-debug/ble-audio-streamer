import { BLEDevice, ConnectionStatus } from '@/types/bluetooth';
import { Button } from '@/components/ui/button';
import { Bluetooth, Signal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceCardProps {
  device: BLEDevice;
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function DeviceCard({ device, status, onConnect, onDisconnect }: DeviceCardProps) {
  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected' || status === 'streaming';

  return (
    <div className={cn(
      'glass-card p-6 rounded-2xl transition-all duration-300',
      isConnected && 'glow-effect border-primary/30'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center',
            isConnected ? 'bg-primary/20' : 'bg-secondary'
          )}>
            <Bluetooth className={cn(
              'w-7 h-7',
              isConnected ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{device.name}</h3>
            <p className="text-sm text-muted-foreground font-mono">{device.id.slice(0, 17)}...</p>
            {device.rssi && (
              <div className="flex items-center gap-1 mt-1">
                <Signal className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{device.rssi} dBm</span>
              </div>
            )}
          </div>
        </div>

        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={isConnecting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting
              </>
            ) : (
              'Connect'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
