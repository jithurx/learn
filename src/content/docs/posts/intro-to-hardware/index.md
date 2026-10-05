---
number: 2
title: "Intro To Hardware"
date: 2026-07-20
description: "A comprehensive introduction to Arduino programming, digital I/O, and Pulse Width Modulation (PWM)."
coverImage: "/images/intro-to-hardware-cover.jpg"
sidebar:
  order: 0
  label: Overview
---

## 1. Introduction

This module focuses on the fundamentals of Arduino microcontroller programming, digital Input/Output (I/O), and Pulse Width Modulation (PWM). By the culmination of this session, students will utilize these concepts to construct functional circuits, including a sequence-timed traffic light.

[Download the Introduction to Hardware Presentation (PDF)](/files/intro2hardware.pdf)

**Target Audience:** This guide assumes foundational knowledge of basic electronics, circuitry, and breadboarding. While these prerequisites are already understood by the audience, introductory electrical theory and breadboard schematics are included throughout this document as supplementary reference material.

### Required Components

| Item | Quantity | Notes |
|---|---|---|
| Arduino Uno (or compatible) | 1 | Microcontroller board |
| USB cable | 1 | Communication interface |
| Breadboard | 1 | Half-size or full-size prototype board |
| LEDs (red, yellow, green) | 1 each | Standard 5mm Light Emitting Diodes |
| 220 Ω resistors | 3 | Color code: red-red-brown-gold |
| Pushbutton | 1 | Standard tactile switch |
| Jumper wires | ~10 | Male-to-male connection wires |
| Arduino IDE | - | [Download link](https://www.arduino.cc/en/software) |

**Note on Simulation:** For students without physical hardware, refer to [Section 8: Simulation Tools](#8-simulation-tools) to model and execute all circuits virtually.

### Contents
1. [Theoretical Foundations](#1-theoretical-foundations)
2. [Anatomy of an Arduino Program](#2-anatomy-of-an-arduino-program)
3. [Digital Output](#3-digital-output)
4. [Sequential Timing Systems](#4-sequential-timing-systems-traffic-light)
5. [Digital Input](#5-digital-input)
6. [Pulse Width Modulation (PWM)](#6-pulse-width-modulation-pwm)
7. [Extended Implementation Projects](#7-extended-implementation-projects)
8. [Simulation Tools](#8-simulation-tools)
9. [Reference Material](#9-reference-material)
10. [Hardware Diagnostic Matrix](#10-hardware-diagnostic-matrix)
