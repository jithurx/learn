---
title: "1. Theoretical Foundations: Digital vs. Analog"
sidebar:
  order: 1
---

## 1. Theoretical Foundations: Digital vs. Analog

| Parameter | Digital Logic | Analog Signal |
|---|---|---|
| **State Resolution** | Discrete binary states (HIGH / LOW) | Continuous variable potential |
| **System Implementations** | Actuation, tactile input, basic timing | Environmental sensing, variable control |
| **Standard Interfaces** | `digitalWrite()`, `digitalRead()` | `analogRead()`, `analogWrite()` (PWM) |

While Pulse Width Modulation (PWM) approximates variable output via rapid digital oscillation, analog input facilitates the measurement of continuous electrical potentials derived from external physical phenomena.

### Microcontroller Pin Architecture

| Interface | Operational Behavior |
|---|---|
| Digital I/O (Pins 0–13) | Binary logic states; `~` denotes hardware PWM capability |
| Analog Input (Pins A0–A5) | 10-bit Analog-to-Digital Conversion (ADC) |

*Note: Analog pins are dedicated to continuous signal measurement via `analogRead()` and function differently from standard digital I/O.*
