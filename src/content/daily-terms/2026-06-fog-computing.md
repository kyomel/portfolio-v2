---
title: "Fog Computing"
termSlug: "fog-computing"
year: 2026
month: 6
monthName: "June"
day: 25
order: 19
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "Fog Computing is a decentralized computing architecture that extends cloud capabilities to the edge of the network — sitting between the cloud (centralized data centers) and the edge devices (senso..."
---
### Definition:

Fog Computing is a decentralized computing architecture that extends cloud capabilities to the edge of the network — sitting between the cloud (centralized data centers) and the edge devices (sensors, cameras, IoT gadgets). The name comes from the analogy that "fog is a cloud close to the ground" — it's not the edge itself, but a layer of smart, intermediate infrastructure that processes data closer to where it's generated instead of sending everything to a distant cloud.

The computing continuum looks like this:

```text
┌─────────────────────────────────────────────────────────────┐
│                    CLOUD LAYER                               │
│   Central data centers — unlimited storage, global compute   │
│   Latency: 100-500ms                           ▲            │
└─────────────────────────────────────────────────┘            │
                          │ ▲ Fewer, aggregated data           │
                          ▼ │                                  │
┌─────────────────────────────────────────────────────────────┐
│                     FOG LAYER                                │
│   Local servers / gateways — real-time processing & caching  │
│   Latency: 10-50ms                              ▲            │
└─────────────────────────────────────────────────┘            │
                          │ ▲ Filtered, pre-processed data     │
                          ▼ │                                  │
┌─────────────────────────────────────────────────────────────┐
│                     EDGE LAYER                               │
│   IoT devices, sensors, actuators — data origination         │
│   Latency: <5ms                                              │
└─────────────────────────────────────────────────────────────┘
```

What makes fog different from edge computing:

| Aspect | Fog Computing | Edge Computing |
|--------|--------------|---------------|
| Location | Between cloud and edge (LAN/WAN gateways) | Directly on the device (sensor, camera, etc.) |
| Processing | Aggregates, filters, and caches data from many devices | Processes data on the individual device |
| Computing power | Moderate — industry servers, routers, switches | Limited — constrained by device battery/CPU/RAM |
| Scale | Regional clusters | Individual devices |
| Network | Can coordinate between multiple edges | Single device scope |

Why fog computing exists:

1. Latency — Sending every IoT reading to the cloud and back can take 200-500ms. A factory robot that needs to stop within 10ms of detecting a human cannot afford that round-trip.
2. Bandwidth — A single offshore oil rig generates ~1TB of sensor data per day. Sending all of it to the cloud is prohibitively expensive. Fog nodes filter, compress, and aggregate — only sending meaningful insights.
3. Reliability — If the internet connection drops, the factory can't stop working. Fog nodes keep processing locally and sync when connectivity returns.
4. Privacy — Sensitive data (medical imaging, surveillance video) can be processed within the local fog network and never leave the premises.

### Example

A smart factory with temperature and vibration sensors that must detect equipment anomalies in real-time — using fog nodes to process locally while only sending summaries to the cloud.

```
import time
import json
import random
from dataclasses import dataclass, field
from typing import List, Optional
from collections import deque

# ─── Edge Layer: Sensors ───

@dataclass
class SensorReading:
    machine_id: str
    sensor_type: str  # "temperature" | "vibration"
    value: float
    timestamp: float = field(default_factory=time.time)

class MachineSensor:
    """Simulates an IoT sensor on a factory machine."""

    def __init__(self, machine_id: str, sensor_type: str):
        self.machine_id = machine_id
        self.sensor_type = sensor_type
        self.baseline_temp = 75.0   # Celsius
        self.baseline_vib = 0.3     # mm/s

    def read(self) -> SensorReading:
        # Simulate normal operation + occasional anomalies
        if self.sensor_type == "temperature":
            # Normal: 73-77°C, Anomaly: spikes to 85-95°C
            if random.random() < 0.05:  # 5% chance of anomaly
                value = self.baseline_temp + random.uniform(10, 20)
            else:
                value = self.baseline_temp + random.uniform(-2, 2)
        else:  # vibration
            # Normal: 0.2-0.4 mm/s, Anomaly: 1.0-3.0 mm/s
            if random.random() < 0.05:
                value = self.baseline_vib + random.uniform(0.7, 2.7)
            else:
                value = self.baseline_vib + random.uniform(-0.1, 0.1)

        return SensorReading(
            machine_id=self.machine_id,
            sensor_type=self.sensor_type,
            value=round(value, 2),
        )

# ─── Fog Layer: Local Processing Gateway ───

class FogNode:

    """Processes sensor data locally — only sends summaries to cloud."""

    def __init__(self, node_id: str, window_size: int = 10):
        self.node_id = node_id
        self.window_size = window_size
        # Rolling windows per machine + sensor type
        self.buffers: dict[str, deque] = {}

        # Alert thresholds
        self.temp_threshold = 85.0    # °C
        self.vib_threshold = 1.5      # mm/s
        self.anomaly_count = 0

    def _get_buffer(self, machine_id: str, sensor_type: str) -> deque:
        key = f"{machine_id}:{sensor_type}"
        if key not in self.buffers:
            self.buffers[key] = deque(maxlen=self.window_size)
        return self.buffers[key]

    def process(self, reading: SensorReading) -> Optional[dict]:
        """Process a sensor reading. Returns an alert if anomaly detected."""
        buffer = self._get_buffer(reading.machine_id, reading.sensor_type)
        buffer.append(reading.value)

        # Check for immediate anomaly (low-latency response)
        alert = None
        if reading.sensor_type == "temperature" and reading.value > self.temp_threshold:
            alert = {
                "type": "CRITICAL",
                "machine": reading.machine_id,
                "sensor": "temperature",
                "value": reading.value,
                "message": f"🔥 Machine {reading.machine_id} overheating! "
                           f"Temperature: {reading.value}°C (threshold: {self.temp_threshold}°C)",
                "timestamp": reading.timestamp,
            }
            self.anomaly_count += 1

        elif reading.sensor_type == "vibration" and reading.value > self.vib_threshold:
            alert = {
                "type": "WARNING",
                "machine": reading.machine_id,
                "sensor": "vibration",
                "value": reading.value,
                "message": f"⚠️ Machine {reading.machine_id} excessive vibration! "

f"Vibration: {reading.value} mm/s (threshold: {self.vib_threshold} mm/s)",
                "timestamp": reading.timestamp,
            }
            self.anomaly_count += 1

        return alert

    def summarize(self) -> dict:
        """Generate a compact summary to send to the cloud periodically."""
        summary = {
            "fog_node": self.node_id,
            "period": f"{self.window_size} readings per sensor",
            "sensors_monitored": len(self.buffers),
            "anomalies_detected": self.anomaly_count,
            "machine_summaries": [],
        }

        for key, buffer in self.buffers.items():
            machine_id, sensor_type = key.split(":")
            avg = sum(buffer) / len(buffer) if buffer else 0
            summary["machine_summaries"].append({
                "machine_id": machine_id,
                "sensor_type": sensor_type,
                "avg_value": round(avg, 2),
                "max_value": round(max(buffer), 2) if buffer else 0,
                "min_value": round(min(buffer), 2) if buffer else 0,
                "readings_count": len(buffer),
            })

        return summary

# ─── Cloud Layer: Central Analytics ───

class CloudAnalytics:
    """Receives aggregated summaries from fog nodes — stores trends, dashboards."""

    def __init__(self):
        self.summaries: List[dict] = []
        self.anomaly_log: List[dict] = []

    def ingest_summary(self, summary: dict):
        """Receive a fog node summary (not raw sensor data)."""
        self.summaries.append(summary)
        print(f"\n☁️  Cloud received fog summary from {summary['fog_node']}")
        print(f"   Sensors monitored: {summary['sensors_monitored']}")
        print(f"   Anomalies in this period: {summary['anomalies_detected']}")
        for ms in summary['machine_summaries']:
            print(f"   📊 {ms['machine_id']} | {ms['sensor_type']} | "
                  f"avg: {ms['avg_value']} | max: {ms['max_value']} | "

f"min: {ms['min_value']}")

    def log_anomaly(self, alert: dict):
        """Log real-time alerts forwarded by fog node."""
        self.anomaly_log.append(alert)
        print(f"🚨 {alert['message']}")

# ─── Run the Simulation ───

print("🏭 Smart Factory - Fog Computing Pipeline")
print("=" * 60)

# Setup
edge_sensors = [
    MachineSensor("press-01", "temperature"),
    MachineSensor("press-01", "vibration"),
    MachineSensor("conveyor-02", "temperature"),
    MachineSensor("conveyor-02", "vibration"),
    MachineSensor("welder-03", "temperature"),
]

fog = FogNode("factory-floor-1", window_size=10)
cloud = CloudAnalytics()

# Simulate 50 sensor readings (edge → fog processing)
print("\n🏗️  Edge Sensors Generating Data...")
print("   (Anomaly rate: ~5% per reading)")
for i in range(50):
    for sensor in edge_sensors:
        # Edge: read sensor
        reading = sensor.read()

        # Fog: process locally
        alert = fog.process(reading)

        if alert:
            # Critical: fog triggers immediate response AND forwards to cloud
            cloud.log_anomaly(alert)
            # In real life: fog node would also send a stop signal to the PLC

print(f"\n{'='*60}")
print("📊 Fog Node Summary Report (sent to cloud every 10 minutes)")
fog_summary = fog.summarize()
cloud.ingest_summary(fog_summary)

# What was sent to cloud vs what was NOT sent
traffic_reduction = 1 - (len(fog_summary['machine_summaries']) / (50 * len(edge_sensors)))
print(f"\n{'='*60}")
print(f"💡 Bandwidth Savings Analysis")
print(f"   Raw sensor readings generated: {50 * len(edge_sensors)}")
print(f"   Cloud summaries sent:           {len(fog_summary['machine_summaries'])}")
print(f"   Bandwidth reduction:            ~{traffic_reduction*100:.1f}%")
print(f"   Anomalies caught in real-time:  {fog.anomaly_count}")
```
