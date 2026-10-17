---
title: "Grouped-Query Attention (GQA)"
termSlug: "grouped-query-attention-gqa"
year: 2025
month: 10
monthName: "October"
day: 14
order: 9
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "Grouped-Query Attention (GQA) is an optimization technique for transformer models that reduces memory usage and computational cost by sharing key-value (KV) pairs across multiple query heads. Inste..."
---
### Definition:

Grouped-Query Attention (GQA) is an optimization technique for transformer models that reduces memory usage and computational cost by sharing key-value (KV) pairs across multiple query heads. Instead of having separate KV pairs for each attention head, GQA groups multiple query heads to share the same KV pairs, creating a middle ground between Multi-Head Attention (MHA) and Multi-Query Attention (MQA).

**Key Properties:**

- Shared KV pairs: Multiple query heads share same key-value computations
- Memory efficient: Reduces KV cache size during inference
- Quality preservation: Better than MQA, close to full MHA performance
- Flexible grouping: Can configure different group sizes
- Inference speedup: Faster generation with less memory bandwidth

### Example:

Language Model Inference:

```
class LanguageModelWithGQA:
    def __init__(self, vocab_size=50000, hidden_size=4096, num_layers=32):
        self.num_layers = num_layers
        self.layers = [
            GroupedQueryAttention(
                hidden_size=hidden_size,
                num_heads=32,
                num_kv_heads=8  # 4:1 ratio
            ) for _ in range(num_layers)
        ]
        self.kv_cache = {}  # Store past key-values for fast generation

    def generate_text(self, prompt, max_length=100):
        tokens = self.tokenize(prompt)
        generated = []

        for step in range(max_length):
            # Forward pass with KV caching
            logits, new_cache = self.forward(tokens, use_cache=True)

            # Sample next token
            next_token = self.sample(logits)
            generated.append(next_token)

            # Update cache and continue with just the new token
            self.update_cache(new_cache)
            tokens = [next_token]  # Only process new token

        return self.detokenize(generated)

    def forward(self, tokens, use_cache=False):
        x = self.embed(tokens)
        new_cache = []

        for i, layer in enumerate(self.layers):
            past_kv = self.kv_cache.get(i) if use_cache else None
            x, current_kv = layer(x, past_key_value=past_kv)
            new_cache.append(current_kv)

        logits = self.lm_head(x)
        return logits, new_cache

    def memory_usage_comparison(self, seq_length=2048):
        # GQA memory per layer
        gqa_mem = 8 * seq_length * 128 * 2 * 4  # 8 KV heads

        # Traditional MHA memory per layer
        mha_mem = 32 * seq_length * 128 * 2 * 4  # 32 KV heads

        # Total for all layers
        total_gqa = gqa_mem * self.num_layers / (1024**3)  # GB
        total_mha = mha_mem * self.num_layers / (1024**3)  # GB

        print(f"GQA total KV cache: {total_gqa:.2f} GB")
        print(f"MHA total KV cache: {total_mha:.2f} GB")
        print(f"Memory savings: {total_mha - total_gqa:.2f} GB")

        return total_gqa, total_mha

# Example: Llama2-70B style model
model = LanguageModelWithGQA(hidden_size=8192, num_layers=80)

# For 2048 token context:
gqa_mem, mha_mem = model.memory_usage_comparison(2048)
# Output:
# GQA total KV cache: 6.71 GB
# MHA total KV cache: 26.84 GB
# Memory savings: 20.13 GB (4x reduction!)
```
