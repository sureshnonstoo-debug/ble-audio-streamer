import { Bluetooth, Mic } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { ConnectionStatus } from '@/types/bluetooth';

interface HeaderProps {
  status: ConnectionStatus;
}

export function Header({ status }: HeaderProps) {
  return (
    <header className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Mic className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card flex items-center justify-center">
              <Bluetooth className="w-3 h-3 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold">ESP32 BLE Audio</h1>
            <p className="text-sm text-muted-foreground">Wireless Microphone Stream</p>
          </div>
        </div>
        <StatusIndicator status={status} />
      </div>
    </header>
  );
}
