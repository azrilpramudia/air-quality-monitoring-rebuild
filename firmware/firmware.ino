/*******************************************************
 * ESP32 Air Quality Monitor + MQTT + LVGL (ESP32 core 3.x)
 * Sensors : ENS160 (TVOC/eCO2), SHT31 (Temp/RH), GP2Y (Dust)
 * Display : TFT_eSPI + LVGL (tick via esp_timer)
 * Network : WiFi + NTP (UTC epoch) + MQTT (PubSubClient)
 * Payload : {"ts","temp_c","rh_pct","tvoc_ppb","eco2_ppm","dust_ugm3","aqi","device_id"}
 *******************************************************/

#include <Wire.h>
#include "ScioSense_ENS160.h"
#include <GP2YDustSensor.h>
#include "Adafruit_SHT31.h"
#include <TFT_eSPI.h>
#include <SPI.h>
#include <lvgl.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <time.h>
#include "esp_timer.h"
#include <esp_wifi.h>           // FIX #7 — untuk MAC address client ID

/*********** WiFi & MQTT Config ***********/
#define WIFI_SSID     "Redmi Note 12"
#define WIFI_PASS     "kotakembang"
#define MQTT_SERVER   "broker.emqx.io"
#define MQTT_PORT     1883
#define MQTT_TOPIC    "uninus/iot/air_quality/esp32-01"
#define DEVICE_ID     "esp32-01-client-io"

// FIX #11 — I2C address SHT31 jadi konstanta, bukan magic number
#define SHT31_I2C_ADDR  0x44

/*********** NTP (Asia/Jakarta = UTC+7) **********/
const long  GMT_OFFSET_SEC = 7 * 3600;
const int   DST_OFFSET_SEC = 0;
const char* NTP1 = "pool.ntp.org";
const char* NTP2 = "id.pool.ntp.org";
const char* NTP3 = "time.google.com";

/*********** Display & LVGL ***********************/
TFT_eSPI tft = TFT_eSPI();
lv_display_t *disp;

#define SCREEN_WIDTH  320
#define SCREEN_HEIGHT 240
#define BUF_LINES     5
static lv_color_t buf1[SCREEN_WIDTH * BUF_LINES];

static esp_timer_handle_t lvgl_tick_timer;
static void lvgl_tick_cb(void* arg) { lv_tick_inc(1); }

/*********** Pins ***********/
const uint8_t SHARP_LED_PIN = 25;
const uint8_t SHARP_VO_PIN  = 34;
const uint8_t TFT_BL_PIN    = 32;

/*********** Sensors ***********/
ScioSense_ENS160 ens160(ENS160_I2CADDR_1);
GP2YDustSensor   dustSensor(GP2YDustSensorType::GP2Y1010AU0F, SHARP_LED_PIN, SHARP_VO_PIN);
Adafruit_SHT31   sht31 = Adafruit_SHT31();

/*********** LVGL Widgets ***********/
lv_obj_t *arc_aqi, *label_aqi_val, *label_aqi_status;
lv_obj_t *label_temp_val, *label_hum_val, *label_tvoc_val, *label_co2_val, *label_dust_val;

/*********** Forward Declarations ***********/
void ui_create();
void update_display(float t, float h, int aqi, int tvoc, int eco2, float dust);
lv_obj_t *create_card(lv_obj_t *parent, const char *title, lv_color_t bg_color, int x, int y, int w, int h);
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map);

/*********** Running Average ***********/
// FIX #1 — tambah humBuffer
// FIX #2 — tambah aqiBuffer
#define AVG_WINDOW 10
float tempBuffer[AVG_WINDOW];
float humBuffer[AVG_WINDOW];   // FIX #1
int   tvocBuffer[AVG_WINDOW];
int   eco2Buffer[AVG_WINDOW];
float dustBuffer[AVG_WINDOW];
int   aqiBuffer[AVG_WINDOW];   // FIX #2
int   avgIndex    = 0;
bool  bufferFilled = false;

/*********** Network ***********/
WiFiClient   espClient;
PubSubClient client(espClient);

// ─────────────────────────────────────────
//  WiFi
// ─────────────────────────────────────────
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { Serial.print("."); delay(500); }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: "); Serial.println(WiFi.localIP());
}

// ─────────────────────────────────────────
//  MQTT  — FIX #6: max 5 retries, tidak blocking selamanya
//          FIX #7: client ID unik pakai MAC address
// ─────────────────────────────────────────
void connectMQTT() {
  // FIX #7 — client ID unik dari DEVICE_ID + potongan MAC
  String clientId = String(DEVICE_ID) + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);

  int retries = 0;
  while (!client.connected() && retries < 5) {
    Serial.printf("Connecting to MQTT (attempt %d/5)...\n", retries + 1);
    if (client.connect(clientId.c_str())) {
      Serial.println("MQTT connected!");
    } else {
      Serial.printf("failed, rc=%d — retrying in 2s\n", client.state());
      retries++;
      delay(2000);
    }
  }

  if (!client.connected()) {
    Serial.println("MQTT: failed after 5 retries, will retry next cycle.");
  }
}

// ─────────────────────────────────────────
//  NTP
// ─────────────────────────────────────────
static void waitForNTP() {
  struct tm ti;
  Serial.print("Sync NTP");
  while (!getLocalTime(&ti)) { Serial.print("."); delay(250); }
  Serial.println(" OK");
}

// ─────────────────────────────────────────
//  LVGL Flush
// ─────────────────────────────────────────
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map) {
  uint32_t w = area->x2 - area->x1 + 1;
  uint32_t h = area->y2 - area->y1 + 1;
  uint16_t *data = (uint16_t *)px_map;

  tft.startWrite();
  tft.setAddrWindow(area->x1, area->y1, w, h);
  tft.pushColors(data, w * h, true);
  tft.endWrite();

  lv_display_flush_ready(disp);
}

// ─────────────────────────────────────────
//  Averaging Helpers
//  FIX #3 — averageInt return int (bukan float), return 0 (bukan NAN) untuk int
// ─────────────────────────────────────────
float averageFloat(float *buf, int size) {
  if (size <= 0) return NAN;
  float sum = 0;
  for (int i = 0; i < size; i++) sum += buf[i];
  return sum / size;
}

int averageInt(int *buf, int size) {   // FIX #3 — return int
  if (size <= 0) return 0;            // FIX #3 — return 0, bukan NAN
  long sum = 0;
  for (int i = 0; i < size; i++) sum += buf[i];
  return (int)(sum / size);
}

// ─────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  pinMode(TFT_BL_PIN, OUTPUT);
  digitalWrite(TFT_BL_PIN, HIGH);

  tft.init();
  tft.setRotation(1);
  tft.setSwapBytes(true);
  tft.fillScreen(TFT_BLACK);

  lv_init();

  const esp_timer_create_args_t lvgl_timer_args = {
    .callback        = &lvgl_tick_cb,
    .arg             = nullptr,
    .dispatch_method = ESP_TIMER_TASK,
    .name            = "lvgl_tick"
  };
  ESP_ERROR_CHECK(esp_timer_create(&lvgl_timer_args, &lvgl_tick_timer));
  ESP_ERROR_CHECK(esp_timer_start_periodic(lvgl_tick_timer, 1000));

  disp = lv_display_create(SCREEN_WIDTH, SCREEN_HEIGHT);
  lv_display_set_flush_cb(disp, my_disp_flush);
  lv_display_set_buffers(disp, buf1, NULL, sizeof(buf1), LV_DISPLAY_RENDER_MODE_PARTIAL);

  Serial.println("Initializing sensors...");
  if (!ens160.begin()) Serial.println("ENS160 not found!");
  else { ens160.setMode(ENS160_OPMODE_STD); Serial.println("ENS160 OK"); }

  if (!sht31.begin(SHT31_I2C_ADDR)) {   // FIX #11 — pakai konstanta
    Serial.println("SHT31 not found!");
    while (1) delay(1);
  }
  dustSensor.begin();

  // Init semua buffer ke 0
  for (int i = 0; i < AVG_WINDOW; i++) {
    tempBuffer[i] = 0;
    humBuffer[i]  = 0;   // FIX #1
    tvocBuffer[i] = 0;
    eco2Buffer[i] = 0;
    dustBuffer[i] = 0;
    aqiBuffer[i]  = 0;   // FIX #2
  }

  ui_create();
  Serial.println("UI created successfully");

  connectWiFi();
  configTime(GMT_OFFSET_SEC, DST_OFFSET_SEC, NTP1, NTP2, NTP3);
  waitForNTP();

  // FIX #4 — setServer dipindah ke setup(), bukan di dalam connectMQTT()
  client.setServer(MQTT_SERVER, MQTT_PORT);
  connectMQTT();

  Serial.println("System ready.\n");
}

// ─────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────
void loop() {
  // FIX #5 — auto-reconnect WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    WiFi.reconnect();
    unsigned long wifiStart = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 10000) {
      delay(500);
      Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi reconnected!");
    } else {
      Serial.println("\nWiFi reconnect failed, will retry next cycle.");
    }
  }

  // FIX #8 — hapus delay(5), biarkan loop() jalan bebas agar LVGL responsif
  lv_timer_handler();
  client.loop();

  static unsigned long lastUpdate = 0;
  unsigned long now = millis();

  if (now - lastUpdate >= 5000) {
    lastUpdate = now;

    // Baca sensor
    float t = sht31.readTemperature();
    float h = sht31.readHumidity();
    if (isnan(t) || isnan(h)) {
      Serial.println("Failed to read SHT31!");
      return;
    }

    ens160.set_envdata((uint16_t)(h * 100), (int16_t)(t * 100));
    ens160.measure(true);
    ens160.measureRaw(true);
    int aqi  = ens160.getAQI();
    int tvoc = ens160.getTVOC();
    int eco2 = ens160.geteCO2();
    float dust = dustSensor.getDustDensity();

    // Isi semua buffer — FIX #1 (hum) dan FIX #2 (aqi)
    tempBuffer[avgIndex] = t;
    humBuffer[avgIndex]  = h;     // FIX #1
    tvocBuffer[avgIndex] = tvoc;
    eco2Buffer[avgIndex] = eco2;
    dustBuffer[avgIndex] = dust;
    aqiBuffer[avgIndex]  = aqi;   // FIX #2
    avgIndex++;

    if (avgIndex >= AVG_WINDOW) { avgIndex = 0; bufferFilled = true; }
    int used = bufferFilled ? AVG_WINDOW : avgIndex;

    float avgT    = averageFloat(tempBuffer, used);
    float avgH    = averageFloat(humBuffer,  used);   // FIX #1
    int   avgTVOC = averageInt(tvocBuffer,   used);   // FIX #3 — terima int langsung
    int   avgECO2 = averageInt(eco2Buffer,   used);   // FIX #3
    float avgDust = averageFloat(dustBuffer, used);
    int   avgAQI  = averageInt(aqiBuffer,    used);   // FIX #2

    // Update display pakai semua nilai yang sudah di-average — FIX #1 #2
    update_display(avgT, avgH, avgAQI, avgTVOC, avgECO2, avgDust);

    // MQTT reconnect jika terputus
    if (!client.connected()) connectMQTT();

    // FIX #10 — jika NTP belum siap, skip publish (tidak blocking LVGL)
    time_t epoch = time(NULL);
    if (epoch < 100000) {
      Serial.println("NTP not ready yet, skipping publish this cycle.");
      return;
    }

    // Build & publish payload
    char payload[256];
    int n = snprintf(payload, sizeof(payload),
      "{\"ts\":%ld,\"temp_c\":%.2f,\"rh_pct\":%.2f,"
      "\"tvoc_ppb\":%d,\"eco2_ppm\":%d,\"dust_ugm3\":%.2f,"
      "\"aqi\":%d,\"device_id\":\"%s\"}",
      (long)epoch, avgT, avgH, avgTVOC, avgECO2, avgDust,  // FIX #1 — avgH
      avgAQI, DEVICE_ID                                      // FIX #2 — avgAQI
    );

    if (n > 0 && n < (int)sizeof(payload)) {
      if (client.publish(MQTT_TOPIC, payload, n)) {
        Serial.print("Published: ");
        Serial.println(payload);
      } else {
        Serial.println("Publish failed, disconnecting MQTT for reconnect...");
        client.disconnect();
      }
    } else {
      Serial.println("Payload error: too long or format issue.");
    }
  }
}

/*************** UI Creation *****************/
void ui_create() {
  lv_obj_t *scr = lv_scr_act();
  lv_obj_set_style_bg_color(scr, lv_color_hex(0x0a0e27), 0);
  lv_obj_set_style_bg_grad_color(scr, lv_color_hex(0x1a1f3a), 0);
  lv_obj_set_style_bg_grad_dir(scr, LV_GRAD_DIR_VER, 0);

  lv_obj_t *status_bar = lv_obj_create(scr);
  lv_obj_set_size(status_bar, 320, 30);
  lv_obj_align(status_bar, LV_ALIGN_TOP_MID, 0, 0);
  lv_obj_set_style_bg_color(status_bar, lv_color_hex(0x1e2640), 0);
  lv_obj_set_style_border_width(status_bar, 0, 0);

  lv_obj_t *title = lv_label_create(status_bar);
  lv_label_set_text(title, "AIR QUALITY MONITORING");
  lv_obj_set_style_text_color(title, lv_color_white(), 0);
  lv_obj_align(title, LV_ALIGN_CENTER, 0, 0);

  lv_obj_t *aqi_container = lv_obj_create(scr);
  lv_obj_set_size(aqi_container, 130, 140);
  lv_obj_align(aqi_container, LV_ALIGN_LEFT_MID, 5, 18);
  lv_obj_set_style_bg_color(aqi_container, lv_color_hex(0x1e2640), 0);
  lv_obj_set_style_border_width(aqi_container, 2, 0);

  arc_aqi = lv_arc_create(aqi_container);
  lv_obj_set_size(arc_aqi, 100, 100);
  lv_obj_align(arc_aqi, LV_ALIGN_CENTER, 0, -5);
  lv_arc_set_rotation(arc_aqi, 135);
  lv_arc_set_bg_angles(arc_aqi, 0, 270);
  lv_arc_set_value(arc_aqi, 0);
  lv_obj_clear_flag(arc_aqi, LV_OBJ_FLAG_CLICKABLE);

  label_aqi_val = lv_label_create(aqi_container);
  lv_label_set_text(label_aqi_val, "0");
  lv_obj_set_style_text_color(label_aqi_val, lv_color_white(), 0);
  lv_obj_align(label_aqi_val, LV_ALIGN_CENTER, 0, -15);
  lv_obj_set_style_transform_scale(label_aqi_val, 300, 0);

  lv_obj_t *lbl_aqi_txt = lv_label_create(aqi_container);
  lv_label_set_text(lbl_aqi_txt, "AQI");
  lv_obj_set_style_text_color(lbl_aqi_txt, lv_color_hex(0x8b92a8), 0);
  lv_obj_align(lbl_aqi_txt, LV_ALIGN_CENTER, 0, 15);

  label_aqi_status = lv_label_create(aqi_container);
  lv_label_set_text(label_aqi_status, "---");
  lv_obj_align(label_aqi_status, LV_ALIGN_BOTTOM_MID, 0, -5);

  int card_w = 82, card_h = 60, start_x = 143, start_y = 40, gap = 8;

  lv_obj_t *card_temp = create_card(scr, "TEMP", lv_color_hex(0xff6b6b), start_x, start_y, card_w, card_h);
  label_temp_val = lv_label_create(card_temp);
  lv_label_set_text(label_temp_val, "-- °C");
  lv_obj_align(label_temp_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_hum = create_card(scr, "HUM", lv_color_hex(0x4ecdc4), start_x + card_w + gap, start_y, card_w, card_h);
  label_hum_val = lv_label_create(card_hum);
  lv_label_set_text(label_hum_val, "-- %");
  lv_obj_align(label_hum_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_tvoc = create_card(scr, "TVOC", lv_color_hex(0xf9ca24), start_x, start_y + card_h + gap, card_w, card_h);
  label_tvoc_val = lv_label_create(card_tvoc);
  lv_label_set_text(label_tvoc_val, "-- ppb");
  lv_obj_align(label_tvoc_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_co2 = create_card(scr, "eCO2", lv_color_hex(0xa29bfe), start_x + card_w + gap, start_y + card_h + gap, card_w, card_h);
  label_co2_val = lv_label_create(card_co2);
  lv_label_set_text(label_co2_val, "-- ppm");
  lv_obj_align(label_co2_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_dust = create_card(scr, "DUST", lv_color_hex(0xfd79a8),
                                    start_x, start_y + 2 * (card_h + gap) - 3,
                                    card_w * 2 + gap, card_h);
  label_dust_val = lv_label_create(card_dust);
  lv_label_set_text(label_dust_val, "-- ug/m3");
  lv_obj_align(label_dust_val, LV_ALIGN_CENTER, 0, 5);
}

lv_obj_t *create_card(lv_obj_t *parent, const char *title, lv_color_t bg_color, int x, int y, int w, int h) {
  lv_obj_t *card = lv_obj_create(parent);
  lv_obj_set_size(card, w, h);
  lv_obj_set_pos(card, x, y);
  lv_obj_set_style_bg_color(card, bg_color, 0);
  lv_obj_set_style_border_width(card, 0, 0);
  lv_obj_set_style_radius(card, 12, 0);
  lv_obj_set_style_pad_all(card, 5, 0);

  lv_obj_t *lbl_title = lv_label_create(card);
  lv_label_set_text(lbl_title, title);
  lv_obj_set_style_text_color(lbl_title, lv_color_white(), 0);
  lv_obj_align(lbl_title, LV_ALIGN_TOP_LEFT, 3, 2);

  return card;
}

/*************** Update UI + Serial Debug ***************/
void update_display(float t, float h, int aqi, int tvoc, int eco2, float dust) {
  static char buf[32];

  sprintf(buf, "%.1f °C", t);    lv_label_set_text(label_temp_val, buf);
  sprintf(buf, "%.0f %%", h);    lv_label_set_text(label_hum_val, buf);
  sprintf(buf, "%d ppb", tvoc);  lv_label_set_text(label_tvoc_val, buf);
  sprintf(buf, "%d ppm", eco2);  lv_label_set_text(label_co2_val, buf);
  sprintf(buf, "%.1f ug/m3", dust); lv_label_set_text(label_dust_val, buf);

  int aqi_clamped = constrain(aqi, 1, 5);
  int arc_val = map(aqi_clamped, 1, 5, 0, 100);
  lv_arc_set_value(arc_aqi, arc_val);

  sprintf(buf, "%d", aqi);
  lv_label_set_text(label_aqi_val, buf);

  const char *status;
  lv_color_t color;

  switch (aqi_clamped) {
    case 1: status="GOOD";          color=lv_color_hex(0x00ff88); break;
    case 2: status="MODERATE";      color=lv_color_hex(0xffeb3b); break;
    case 3: status="UNHEALTHY";     color=lv_color_hex(0xff9800); break;
    case 4: status="VERY UNHEALTHY";color=lv_color_hex(0xff5722); break;
    case 5: status="HAZARDOUS";     color=lv_color_hex(0xff1744); break;
    default: status="---";          color=lv_color_hex(0xcccccc); break;
  }

  lv_label_set_text(label_aqi_status, status);
  lv_obj_set_style_text_color(label_aqi_status, color, 0);
  lv_obj_set_style_arc_color(arc_aqi, color, LV_PART_INDICATOR);
  lv_obj_set_style_text_color(label_aqi_val, color, 0);

  Serial.println("======================================");
  Serial.println("      AIR QUALITY MONITOR DATA        ");
  Serial.println("======================================");
  Serial.printf("Temperature (avg °C): %.1f\n", t);
  Serial.printf("Humidity (avg %%): %.0f\n", h);
  Serial.printf("TVOC (avg ppb): %d\n", tvoc);
  Serial.printf("eCO2 (avg ppm): %d\n", eco2);
  Serial.printf("Dust (avg ug/m3): %.1f\n", dust);
  Serial.printf("AQI (avg 1-5): %d\n", aqi);
  Serial.printf("Status: %s\n", status);
  Serial.println("======================================\n");
}