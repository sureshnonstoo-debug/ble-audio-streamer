/*
 * ESP32/XIAO BLE Audio Streaming - Arduino Code
 * 
 * This code streams 16-bit PCM audio at 8kHz over BLE
 * Compatible with the BLE Audio Stream app
 * 
 * Hardware: XIAO ESP32-S3 Sense (or any ESP32 with I2S mic)
 * 
 * Wiring for external I2S microphone (if not using onboard):
 * - BCLK (Bit Clock): GPIO 42
 * - WS (Word Select/LRCLK): GPIO 41  
 * - DATA (SD): GPIO 2
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <driver/i2s.h>

// BLE UUIDs - Must match the app!
#define SERVICE_UUID        "19b10000-e8f2-537e-4f6c-d104768a1214"
#define CHARACTERISTIC_UUID "19b10001-e8f2-537e-4f6c-d104768a1214"

// Audio configuration
#define SAMPLE_RATE     8000
#define BITS_PER_SAMPLE 16
#define CHUNK_SIZE      160  // 160 bytes = 80 samples = 10ms of audio at 8kHz

// I2S Configuration for XIAO ESP32-S3 Sense (onboard PDM mic)
#define I2S_PORT        I2S_NUM_0
#define I2S_BCLK        42
#define I2S_WS          41
#define I2S_DATA_IN     2

// For XIAO ESP32-S3 Sense with onboard PDM microphone
// Uncomment if using the built-in mic
// #define USE_PDM_MIC

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Audio buffer
int16_t audioBuffer[CHUNK_SIZE / 2];  // 80 samples

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Client connected!");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Client disconnected!");
  }
};

void setupI2S() {
  #ifdef USE_PDM_MIC
  // PDM microphone configuration (for XIAO ESP32-S3 Sense onboard mic)
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX | I2S_MODE_PDM),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 64,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_PIN_NO_CHANGE,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_DATA_IN
  };
  #else
  // Standard I2S microphone configuration (INMP441, etc.)
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 64,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_BCLK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_DATA_IN
  };
  #endif

  esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("I2S driver install failed: %d\n", err);
    return;
  }

  err = i2s_set_pin(I2S_PORT, &pin_config);
  if (err != ESP_OK) {
    Serial.printf("I2S set pin failed: %d\n", err);
    return;
  }

  Serial.println("I2S initialized successfully");
}

void setupBLE() {
  // Initialize BLE with device name
  BLEDevice::init("XIAO_BLE_MIC");
  
  // Set MTU size for better throughput
  BLEDevice::setMTU(185);
  
  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  // Create BLE Service
  BLEService* pService = pServer->createService(SERVICE_UUID);
  
  // Create BLE Characteristic with Notify property
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  
  // Add descriptor for notifications (CCCD - 0x2902)
  pCharacteristic->addDescriptor(new BLE2902());
  
  // Start the service
  pService->start();
  
  // Start advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // For iPhone connections
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("BLE advertising started - waiting for connection...");
  Serial.printf("Device name: XIAO_BLE_MIC\n");
  Serial.printf("Service UUID: %s\n", SERVICE_UUID);
  Serial.printf("Characteristic UUID: %s\n", CHARACTERISTIC_UUID);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== BLE Audio Streaming ===");
  Serial.printf("Sample Rate: %d Hz\n", SAMPLE_RATE);
  Serial.printf("Bits per Sample: %d\n", BITS_PER_SAMPLE);
  Serial.printf("Chunk Size: %d bytes\n", CHUNK_SIZE);
  
  setupI2S();
  setupBLE();
}

void loop() {
  // Handle connection state changes
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);  // Give BLE stack time to get ready
    pServer->startAdvertising();
    Serial.println("Restarting advertising...");
    oldDeviceConnected = deviceConnected;
  }
  
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
  
  // Stream audio when connected
  if (deviceConnected) {
    size_t bytesRead = 0;
    
    // Read audio samples from I2S
    esp_err_t result = i2s_read(
      I2S_PORT,
      audioBuffer,
      CHUNK_SIZE,
      &bytesRead,
      portMAX_DELAY
    );
    
    if (result == ESP_OK && bytesRead > 0) {
      // Send audio data over BLE
      pCharacteristic->setValue((uint8_t*)audioBuffer, bytesRead);
      pCharacteristic->notify();
      
      // Debug: Print audio level periodically
      static unsigned long lastPrint = 0;
      if (millis() - lastPrint > 1000) {
        int32_t sum = 0;
        for (int i = 0; i < bytesRead / 2; i++) {
          sum += abs(audioBuffer[i]);
        }
        int avgLevel = sum / (bytesRead / 2);
        Serial.printf("Audio level: %d, Bytes sent: %d\n", avgLevel, bytesRead);
        lastPrint = millis();
      }
    }
  } else {
    delay(100);  // Save power when not connected
  }
}
