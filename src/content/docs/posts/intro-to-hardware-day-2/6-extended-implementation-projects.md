---
title: "6. Extended Implementation Projects"
sidebar:
  order: 6
---

## 6. Extended Implementation Projects

Integrate the aforementioned transducer systems with conditional logic structures to create an autonomous, closed-loop responsive architecture.

| Implementation | Primary Sensor | Output Mechanism | Functional Description |
|---|---|---|---|
| **Autonomous Illumination** | LDR | LED | Engages illumination when ambient light falls below a calibrated threshold. |
| **Proximity Alert System** | HC-SR04 | Buzzer | Generates an acoustic warning upon breaching a predefined spatial perimeter. |
| **Spatial Distance Indicator** | HC-SR04 | Multi-LED | Maps distance ranges to a visual color scale (Green, Yellow, Red). |
| **Thermal Limit Warning** | DHT11 | LED / Serial | Activates a visual indicator when thermal limits are exceeded. |
| **Stochastic Number Generator** | Switch | Serial / Buzzer | Generates a pseudo-random integer (1-6) upon actuation. |

### Architectural Example: Autonomous Illumination
```cpp
int ldrPin = A0;
int ledPin = 9;
int threshold = 400; // Calibrate via Serial Monitor analysis

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int lightLevel = analogRead(ldrPin);
  if (lightLevel < threshold) {
    digitalWrite(ledPin, HIGH); 
  } else {
    digitalWrite(ledPin, LOW);  
  }
}
```

### Architectural Example: Proximity Alert System
```cpp
// Assuming distanceCm is derived via the HC-SR04 logic
if (distanceCm < 10) {
  tone(buzzerPin, 1000); // Critical proximity: Acoustic alarm
} else if (distanceCm < 30) {
  digitalWrite(yellowLed, HIGH); // Intermediate proximity: Visual warning
} else {
  digitalWrite(greenLed, HIGH); // Nominal proximity: Visual safe state
}
```
