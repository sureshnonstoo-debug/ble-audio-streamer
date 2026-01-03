import { ConnectionStatus } from '@/types/bluetooth';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: ConnectionStatus;
}

const statusConfig: Record<ConnectionStatus, { label: string; color: string; pulse: boolean }> = {
  disconnected: { label: 'Disconnected', color: 'bg-muted-foreground', pulse: false },
  scanning: { label: 'Scanning...', color: 'bg-warning', pulse: true },
  connecting: { label: 'Connecting...', color: 'bg-warning', pulse: true },
  connected: { label: 'Connected', color: 'bg-success', pulse: false },
  streaming: { label: 'Streaming', color: 'bg-primary', pulse: true },
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={cn('w-3 h-3 rounded-full', config.color)} />
        {config.pulse && (
          <div className={cn('absolute inset-0 rounded-full animate-pulse-ring', config.color)} />
        )}
      </div>
      <span className="text-sm font-medium text-muted-foreground">{config.label}</span>
    </div>
  );
}
