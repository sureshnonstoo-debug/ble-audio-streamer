/*
 * XIAO ESP32-S3 + INMP441 I2S Mic
 * BLE PCM Audio Streaming
 *
 * Audio: 16-bit PCM, 8kHz, Mono
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <driver/i2s.h>

// ================= BLE UUIDs =================
#define SERVICE_UUID        "19b10000-e8f2-537e-4f6c-d104768a1214"
#define CHARACTERISTIC_UUID "19b10001-e8f2-537e-4f6c-d104768a1214"

// ================= I2S Pins (INMP441) =================
#define I2S_BCLK   3     // SCK
#define I2S_WS     1     // WS / LRCLK
#define I2S_SD     2     // SD

#define I2S_PORT   I2S_NUM_0

// ================= Audio =================
#define SAMPLE_RATE   8000
#define CHUNK_SIZE    160   // bytes (80 samples)

BLEServer* pServer;
BLECharacteristic* pCharacteristic;

bool deviceConnected = false;
bool oldDeviceConnected = false;

int16_t audioBuffer[CHUNK_SIZE / 2];  // 80 samples

// ================= BLE Callbacks =================
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer*) override {
    deviceConnected = true;
    Serial.println("BLE connected");
  }

  void onDisconnect(BLEServer*) override {
    deviceConnected = false;
    Serial.println("BLE disconnected");
  }
};

// ================= I2S SETUP =================
void setupI2S() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S_MSB,
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
    .data_out_num = -1,
    .data_in_num = I2S_SD
  };

  esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("I2S install failed: %d\n", err);
    return;
  }

  err = i2s_set_pin(I2S_PORT, &pin_config);
  if (err != ESP_OK) {
    Serial.printf("I2S pin config failed: %d\n", err);
    return;
  }

  Serial.println("INMP441 I2S initialized");
}

// ================= BLE SETUP =================
void setupBLE() {
  BLEDevice::init("XIAO_BLE_MIC");
  BLEDevice::setMTU(185);

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );

  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising* advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->setMinPreferred(0x06);
  advertising->setMinPreferred(0x12);

  BLEDevice::startAdvertising();
  Serial.println("BLE advertising started");
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=== INMP441 BLE Audio ===");

  setupI2S();
  setupBLE();
}

// ================= LOOP =================
void loop() {

  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    oldDeviceConnected = deviceConnected;
  }

  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  if (deviceConnected) {
    size_t bytesRead = 0;

    esp_err_t res = i2s_read(
      I2S_PORT,
      audioBuffer,
      CHUNK_SIZE,
      &bytesRead,
      portMAX_DELAY
    );

    if (res == ESP_OK && bytesRead > 0) {
      pCharacteristic->setValue((uint8_t*)audioBuffer, bytesRead);
      pCharacteristic->notify();

      // Debug audio level
      static unsigned long lastPrint = 0;
      if (millis() - lastPrint > 1000) {
        int32_t sum = 0;
        for (int i = 0; i < bytesRead / 2; i++) {
          sum += abs(audioBuffer[i]);
        }
        Serial.printf("Audio level: %d | Bytes: %d\n",
                      sum / (bytesRead / 2), bytesRead);
        lastPrint = millis();
      }
    }
  } else {
    delay(100);
  }
}
