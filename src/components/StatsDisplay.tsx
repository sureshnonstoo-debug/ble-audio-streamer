import { Activity, Database, Clock } from 'lucide-react';

interface StatsDisplayProps {
  bytesReceived: number;
  isStreaming: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function StatsDisplay({ bytesReceived, isStreaming }: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="glass-card p-4 rounded-xl text-center">
        <Database className="w-5 h-5 mx-auto text-primary mb-2" />
        <p className="text-lg font-mono font-semibold">{formatBytes(bytesReceived)}</p>
        <p className="text-xs text-muted-foreground">Received</p>
      </div>
      
      <div className="glass-card p-4 rounded-xl text-center">
        <Activity className="w-5 h-5 mx-auto text-primary mb-2" />
        <p className="text-lg font-mono font-semibold">8 kHz</p>
        <p className="text-xs text-muted-foreground">Sample Rate</p>
      </div>
      
      <div className="glass-card p-4 rounded-xl text-center">
        <Clock className="w-5 h-5 mx-auto text-primary mb-2" />
        <p className="text-lg font-mono font-semibold">16-bit</p>
        <p className="text-xs text-muted-foreground">PCM Mono</p>
      </div>
    </div>
  );
}
