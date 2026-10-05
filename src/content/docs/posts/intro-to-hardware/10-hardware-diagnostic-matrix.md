---
title: "10. Hardware Diagnostic Matrix"
sidebar:
  order: 10
---

## 10. Hardware Diagnostic Matrix

| Observation | Probable Root Cause |
|---|---|
| LED fails to illuminate | Polarity inversion (anode/cathode reversed) or incomplete ground continuity. |
| Diminished LED luminosity | Incorrect pin assignment in software versus physical hardware mapping. |
| IDE compilation/upload failure | Incorrect COM port or board architecture selected in the deployment interface. |
| Switch registers continuous actuation | Omission of `INPUT_PULLUP` declaration or incorrect physical bridging of breadboard trench. |
| Sequential states overlap (Traffic Light) | Failure to execute `digitalWrite(LOW)` prior to initiating the subsequent state. |
| PWM algorithm results in discrete blinking | Component interfaced with a standard digital pin rather than a PWM-enabled port (`~`). |
