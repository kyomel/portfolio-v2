---
title: "Long Short Term Memory(LSTM)"
termSlug: "long-short-term-memory-lstm"
year: 2025
month: 10
monthName: "October"
day: 17
order: 12
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "Long Short-Term Memory (LSTM) is a type of recurrent neural network (RNN) designed to learn and remember patterns in sequential data over long periods. Unlike traditional RNNs that suffer from vani..."
---
### Definition:

Long Short-Term Memory (LSTM) is a type of recurrent neural network (RNN) designed to learn and remember patterns in sequential data over long periods. Unlike traditional RNNs that suffer from vanishing gradients and forget information quickly, LSTMs use special "gates" to control what information to remember, forget, or output, making them excellent for tasks involving sequences like text, time series, or speech.

**Key Properties:**

- Memory cells: Store information over long sequences
- Three gates: Forget, input, and output gates control information flow
- Gradient stability: Solves vanishing gradient problem
- Sequential processing: Processes data one step at a time
- Context awareness: Remembers relevant past information

**LSTM Gates:**

- Forget Gate: Decides what to remove from memory
- Input Gate: Decides what new information to store
- Output Gate: Decides what parts of memory to output

### Example:

Text Generation

```
import string

class TextGenerator:
    def __init__(self, text_data):
        self.chars = sorted(list(set(text_data)))
        self.char_to_idx = {ch: i for i, ch in enumerate(self.chars)}
        self.idx_to_char = {i: ch for i, ch in enumerate(self.chars)}

        self.vocab_size = len(self.chars)
        self.model = SimpleLSTM(
            input_size=self.vocab_size,
            hidden_size=128,
            output_size=self.vocab_size,
            num_layers=2
        )

    def text_to_sequences(self, text, seq_length=50):
        sequences = []
        targets = []

        for i in range(len(text) - seq_length):
            # Input sequence
            seq = text[i:i + seq_length]
            # Target (next character)
            target = text[i + seq_length]

            # Convert to one-hot encoding
            seq_encoded = self.encode_sequence(seq)
            target_encoded = self.char_to_idx[target]

            sequences.append(seq_encoded)
            targets.append(target_encoded)

        return torch.FloatTensor(sequences), torch.LongTensor(targets)

    def encode_sequence(self, sequence):
        encoded = []
        for char in sequence:
            one_hot = [0] * self.vocab_size
            one_hot[self.char_to_idx[char]] = 1
            encoded.append(one_hot)
        return encoded

    def generate_text(self, seed_text, length=100, temperature=1.0):
        """Generate text starting with seed_text"""
        self.model.eval()
        generated = seed_text

        # Convert seed to input sequence
        current_seq = seed_text[-50:]  # Use last 50 characters

        for _ in range(length):
            # Encode current sequence
            seq_encoded = self.encode_sequence(current_seq)
            input_tensor = torch.FloatTensor(seq_encoded).unsqueeze(0)

            # Get prediction
            with torch.no_grad():
                output = self.model(input_tensor)

                # Apply temperature for creativity
                output = output / temperature
                probabilities = torch.softmax(output, dim=-1)

                # Sample next character
                next_char_idx = torch.multinomial(probabilities, 1).item()
                next_char = self.idx_to_char[next_char_idx]

                generated += next_char
                current_seq = current_seq[1:] + next_char  # Slide window

        return generated

# Example usage
shakespeare_text = """
To be or not to be, that is the question:
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take arms against a sea of troubles...
"""

generator = TextGenerator(shakespeare_text)

# Train the model (simplified)
sequences, targets = generator.text_to_sequences(shakespeare_text)
# ... training code ...

# Generate new text
generated = generator.generate_text("To be or not", length=100)
print("Generated text:", generated)
# Output: "To be or not to be, that is the noble mind to suffer..."
```
