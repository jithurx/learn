---
title: "1. Theoretical Foundations (Reference)"
sidebar:
  order: 1
---

## 1. Theoretical Foundations (Reference)

The following fundamental electrical properties and calculations are provided as a quick reference.

| Term | Definition | Standard Unit |
|---|---|---|
| **Voltage (V)** | The electrical potential difference driving charge through a circuit. | Volts (V) |
| **Current (I)** | The rate of flow of electric charge. | Amperes (A) |
| **Resistance (R)** | The opposition to current flow within a conductor or component. | Ohms (Ω) |

**Fluid Analogy:** Voltage is analogous to water pressure, current to the volumetric flow rate, and resistance to the constriction of a pipe. Increased resistance proportionally reduces current for a constant voltage.

The relationship between these properties is defined by **Ohm's Law**:

```
V = I × R
```

**Application to LEDs:** A Light Emitting Diode (LED) possesses minimal internal resistance. If connected directly to a 5V source, it will draw excessive current and undergo thermal failure. A resistor placed in series limits the current to operational parameters.

**Calculating Current-Limiting Resistor Values:**
A standard red LED typically requires a forward voltage of ~2V and operates efficiently at 15-20 mA (0.015-0.020 A).

```
R = (Supply Voltage - LED Forward Voltage) / Desired Current
R = (5V - 2V) / 0.015A
R ≈ 200 Ω  (Standard commercially available value: 220 Ω)
```
Consequently, all LED circuits in this module incorporate a 220 Ω series resistor.
