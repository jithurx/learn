---
title: "9. Hardware Diagnostic Matrix"
sidebar:
  order: 9
---

## 9. Hardware Diagnostic Matrix

| Observation | Probable Root Cause |
|---|---|
| Potentiometer readings fluctuate rapidly | Mechanical wiper instability or degraded breadboard contacts. |
| LED luminosity fails to scale | Component is connected to a non-PWM digital port; `map()` boundaries are incorrectly defined. |
| Piezoelectric transducer produces no sound | Polarity inversion or incorrect port declaration within the `tone()` function. |
| HC-SR04 registers a persistent static value | `Trig` and `Echo` pin assignments are reversed, or physical obstruction is non-reflective. |
| DHT11 outputs `nan` via Serial Monitor | Sensor latency exceeds polling rate, or digital pin definition mismatch. |
| Serial Monitor yields corrupted characters | Inconsistent baud rate synchronization between software `Serial.begin()` and console settings. |
