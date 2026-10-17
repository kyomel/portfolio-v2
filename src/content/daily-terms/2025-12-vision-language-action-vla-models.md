---
title: "Vision-Language-Action (VLA) Models"
termSlug: "vision-language-action-vla-models"
year: 2025
month: 12
monthName: "December"
day: 19
order: 15
source: "2025/dec-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/dec-term.md"
excerpt: "Vision-Language-Action (VLA) Models are AI systems that directly map visual observations and language instructions to robot actions in a single end-to-end model. Instead of separate systems for see..."
---
### Definition:

Vision-Language-Action (VLA) Models are AI systems that directly map visual observations and language instructions to robot actions in a single end-to-end model. Instead of separate systems for seeing, understanding commands, and planning movements, VLA models combine all three capabilities - they can look at a scene, understand what you want done, and immediately output the motor commands to accomplish the task.

**Key characteristics:**

- Combines vision, language, and action in one model
- End-to-end learning (pixels → actions)
- No separate planning or control modules needed
- Trained on large datasets of robot demonstrations
- Can generalize to new objects and tasks
- Represents convergence of computer vision, NLP, and robotics

### Example:

A robot in a kitchen

```
Input:

👁️ Vision: Camera sees a table with a cup, plate, and apple
💬 Language: Human says "Put the apple on the plate"
Output:

🤖 Action: Robot generates commands like:
Move arm to coordinates [X, Y, Z]
Close gripper around apple
Lift and move to plate location
Open gripper to release
```
