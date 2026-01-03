import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  audioLevel: number;
  isActive: boolean;
}

export function AudioVisualizer({ audioLevel, isActive }: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(24).fill(0));

  useEffect(() => {
    if (!isActive) {
      setBars(Array(24).fill(0));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map((_, i) => {
        const baseLevel = audioLevel / 100;
        const randomVariation = Math.random() * 0.4 - 0.2;
        const positionFactor = 1 - Math.abs(i - 12) / 12;
        return Math.max(0.1, Math.min(1, baseLevel * positionFactor + randomVariation));
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [audioLevel, isActive]);

  return (
    <div className="glass-card p-8 rounded-2xl">
      <div className="flex items-end justify-center gap-1 h-32">
        {bars.map((height, i) => (
          <div
            key={i}
            className={cn(
              'w-2 rounded-full transition-all duration-75',
              isActive ? 'bg-gradient-to-t from-primary to-accent' : 'bg-muted'
            )}
            style={{
              height: `${Math.max(8, height * 100)}%`,
              opacity: isActive ? 0.5 + height * 0.5 : 0.3,
            }}
          />
        ))}
      </div>
      <div className="mt-4 text-center">
        <span className="text-2xl font-mono font-bold text-primary">
          {isActive ? `${audioLevel.toFixed(0)}%` : '—'}
        </span>
        <p className="text-xs text-muted-foreground mt-1">Audio Level</p>
      </div>
    </div>
  );
}
