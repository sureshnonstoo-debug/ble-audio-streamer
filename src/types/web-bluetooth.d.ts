// Web Bluetooth API Type Declarations
// These types are needed for the Web Bluetooth API which is not included in standard TypeScript libs

declare global {
  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: 'gattserverdisconnected', listener: () => void): void;
    removeEventListener(type: 'gattserverdisconnected', listener: () => void): void;
  }

  interface BluetoothRemoteGATTServer {
    connected: boolean;
    device: BluetoothDevice;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    device: BluetoothDevice;
    uuid: string;
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    service: BluetoothRemoteGATTService;
    uuid: string;
    value?: DataView;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    addEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
    removeEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
  }

  interface BluetoothRequestDeviceFilter {
    services?: string[];
    name?: string;
    namePrefix?: string;
  }

  interface RequestDeviceOptions {
    filters?: BluetoothRequestDeviceFilter[];
    optionalServices?: string[];
    acceptAllDevices?: boolean;
  }

  interface Bluetooth {
    getAvailability(): Promise<boolean>;
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  }

  interface Navigator {
    bluetooth?: Bluetooth;
  }
}

export {};
