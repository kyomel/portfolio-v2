---
title: "Speculative Decoding"
termSlug: "speculative-decoding"
year: 2025
month: 10
monthName: "October"
day: 10
order: 7
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "Speculative Decoding is an optimization technique for large language models (LLMs) that speeds up text generation by using a smaller, faster \"draft\" model to predict multiple tokens ahead, then hav..."
---
### Definition:

Speculative Decoding is an optimization technique for large language models (LLMs) that speeds up text generation by using a smaller, faster "draft" model to predict multiple tokens ahead, then having the larger "target" model verify and accept/reject these predictions in parallel. This reduces the number of sequential forward passes needed.

**Key Properties:**

- Two-model approach: Small draft model + large target model
- Parallel verification: Target model checks multiple tokens at once
- Mathematically equivalent: Same output distribution as normal decoding
- Speed improvement: 2-4x faster generation without quality loss
- Speculative execution: Generate candidates optimistically

**How It Works:**

1. Draft model quickly generates multiple token candidates
2. Target model evaluates all candidates in parallel
3. Accept/reject tokens based on probability comparison
4. Continue from longest accepted sequence
5. Repeat until completion

### Example:

ChatBot Response:

```
class ChatBotWithSpeculativeDecoding:
    def __init__(self):
        # Draft: Fast 7B model, Target: Accurate 70B model
        self.draft_model = load_model("llama-7b")
        self.target_model = load_model("llama-70b")
        self.acceptance_rate = 0.75  # 75% of draft tokens accepted on average

    def generate_response(self, user_message):
        prompt = f"User: {user_message}\nAssistant: "

        response_tokens = []
        current_input = self.tokenize(prompt)

        while not self.is_complete(response_tokens):
            # Draft model quickly suggests next 5 tokens
            draft_sequence = self.draft_model.generate_fast(
                current_input,
                num_tokens=5
            )
            # Example: ["I", "think", "the", "best", "approach"]

            # Target model evaluates all 5 tokens at once
            verification_result = self.target_model.verify_batch(
                current_input,
                draft_sequence
            )
            # Example: Accept ["I", "think", "the"], Reject ["best", "approach"]

            # Add accepted tokens to response
            accepted = verification_result.accepted_tokens
            response_tokens.extend(accepted)
            current_input.extend(accepted)

            # If no tokens accepted, target model generates one
            if len(accepted) == 0:
                fallback_token = self.target_model.generate_single(current_input)
                response_tokens.append(fallback_token)
                current_input.append(fallback_token)

        return self.detokenize(response_tokens)

# Performance comparison:
# Traditional: User asks question → 3.2 seconds for response
# Speculative: User asks question → 1.1 seconds for response (3x faster!)
```
