---
title: "Memento Design Pattern"
termSlug: "memento-design-pattern"
year: 2025
month: 8
monthName: "August"
day: 25
order: 22
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "Memento Design Pattern is a behavioral design pattern that allows you to save and restore an object's previous state without exposing its internal structure. It's like creating \"snapshots\" or \"save..."
---
### Definition:

Memento Design Pattern is a behavioral design pattern that allows you to save and restore an object's previous state without exposing its internal structure. It's like creating "snapshots" or "save points" that you can return to later, commonly used for undo functionality.

**Key Features**

- Originator: The object whose state you want to save
- Memento: The saved state snapshot
- Caretaker: Manages when to save/restore states

### Example:

- Text Editor with Undo

```
// Memento - stores the state
class TextMemento {
    private String content;

    public TextMemento(String content) {
        this.content = content;
    }

    public String getContent() { return content; }
}

// Originator - object whose state we want to save
class TextEditor {
    private String content = "";

    public void write(String text) {
        content += text;
    }

    public String getContent() { return content; }

    // Save current state
    public TextMemento save() {
        return new TextMemento(content);
    }

    // Restore previous state
    public void restore(TextMemento memento) {
        content = memento.getContent();
    }
}

// Caretaker - manages save points
class EditorHistory {
    private Stack<TextMemento> history = new Stack<>();

    public void backup(TextEditor editor) {
        history.push(editor.save());
    }

    public void undo(TextEditor editor) {
        if (!history.isEmpty()) {
            editor.restore(history.pop());
        }
    }
}
```

[Link-1](https://refactoring.guru/design-patterns/memento)
[Link-2](https://www.geeksforgeeks.org/memento-design-pattern/)
