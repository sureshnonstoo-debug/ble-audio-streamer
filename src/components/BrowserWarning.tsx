import { AlertTriangle, Chrome } from 'lucide-react';

export function BrowserWarning() {
  return (
    <div className="glass-card p-6 rounded-2xl border-warning/30">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">Browser Not Supported</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Web Bluetooth API is required for BLE connectivity. Please use a supported browser:
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Chrome className="w-4 h-4 text-primary" />
            <span>Chrome on Android or Desktop</span>
          </div>
        </div>
      </div>
    </div>
  );
}
