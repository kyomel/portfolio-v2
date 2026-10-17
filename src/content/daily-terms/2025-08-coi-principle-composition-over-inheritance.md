---
title: "COI Principle(Composition Over Inheritance)"
termSlug: "coi-principle-composition-over-inheritance"
year: 2025
month: 8
monthName: "August"
day: 28
order: 25
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "Composition Over Inheritance is a design principle that suggests building complex objects by combining simpler, independent components (composition) rather than creating rigid parent-child class hi..."
---
### Definition:

Composition Over Inheritance is a design principle that suggests building complex objects by combining simpler, independent components (composition) rather than creating rigid parent-child class hierarchies (inheritance). It promotes flexibility, reusability, and easier maintenance by favoring "has-a" relationships over "is-a" relationships.

**Key Benefits**

- Flexibility: Easy to change behavior at runtime
- Loose coupling: Components are independent
- Better testing: Test components separately
- Avoid inheritance problems: No deep, complex hierarchies

### Example:

- Car Manufacturing
  Inheritance (Rigid):

```
Vehicle → Car → SedanCar → LuxurySedanCar → ElectricLuxurySedanCar
```

Composition (Flexible):

```
class Car {
    private Engine engine;           // Has an engine
    private TransmissionSystem transmission; // Has a transmission
    private EntertainmentSystem entertainment; // Has entertainment

    // Can swap components easily
    public void upgradeEngine(Engine newEngine) {
        this.engine = newEngine;
    }

    public void addEntertainment(EntertainmentSystem system) {
        this.entertainment = system;
    }
}

// Mix and match components
Car economyCar = new Car(new EconomyEngine(), new ManualTransmission());
Car luxuryCar = new Car(new V8Engine(), new AutomaticTransmission(), new PremiumAudio());
```
