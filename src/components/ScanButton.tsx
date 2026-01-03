import { Button } from '@/components/ui/button';
import { Bluetooth, Loader2, Search } from 'lucide-react';
import { ConnectionStatus } from '@/types/bluetooth';
import { cn } from '@/lib/utils';

interface ScanButtonProps {
  status: ConnectionStatus;
  onScan: () => void;
  disabled?: boolean;
}

export function ScanButton({ status, onScan, disabled }: ScanButtonProps) {
  const isScanning = status === 'scanning';
  const isConnected = status === 'connected' || status === 'streaming';

  return (
    <Button
      size="lg"
      onClick={onScan}
      disabled={disabled || isConnected}
      className={cn(
        'w-full h-14 text-base font-semibold rounded-xl transition-all duration-300',
        'bg-gradient-to-r from-primary to-accent text-primary-foreground',
        'hover:opacity-90 hover:scale-[1.02]',
        'disabled:opacity-50 disabled:scale-100'
      )}
    >
      {isScanning ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Scanning for devices...
        </>
      ) : (
        <>
          <Search className="w-5 h-5 mr-2" />
          Scan for ESP32 Devices
        </>
      )}
    </Button>
  );
}
