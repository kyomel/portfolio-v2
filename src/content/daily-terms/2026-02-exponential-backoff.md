---
title: "Exponential Backoff"
termSlug: "exponential-backoff"
year: 2026
month: 2
monthName: "February"
day: 18
order: 13
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "Exponential Backoff is a retry strategy where the wait time between retry attempts increases exponentially (typically doubling) after each failure, up to a maximum limit. When a request fails (netw..."
---
### Definition:

Exponential Backoff is a retry strategy where the wait time between retry attempts increases exponentially (typically doubling) after each failure, up to a maximum limit. When a request fails (network timeout, server overload, rate limit), instead of retrying immediately and potentially overwhelming the system, you wait progressively longer: 1 second, then 2 seconds, then 4 seconds, then 8 seconds, etc. This gives the system time to recover while avoiding "retry storms" that make problems worse.

**Key Concepts:**

- Progressive Delays: Each retry waits longer than the last (exponential growth)
- Backing Off: Deliberately slowing down retry attempts
- Prevents Cascading Failures: Avoids overwhelming already-struggling systems
- Industry Standard: Used by AWS, Google Cloud, Stripe, and most major APIs
- Formula: wait_time = base_delay × (2 ^ attempt_number) + optional random jitter

### Example:

API Request with Retry

```
With Exponential Backoff (Good)

// ✅ GOOD: Exponential backoff gives server time to recover

async function processPayment(paymentData) {
  const maxRetries = 5;
  const baseDelay = 1000; // 1 second
  const maxDelay = 32000; // 32 seconds
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`[${new Date().toISOString()}] Attempt ${attempt + 1}: Calling payment API...`);

      const response = await fetch('https://api.payments.com/charge', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      if (response.ok) {
        console.log('✅ Payment successful!');
        return await response.json();
      }

      // Check if we should retry
      if (response.status === 429) {
        // Rate limited - definitely retry
        throw new Error('Rate limit exceeded');
      } else if (response.status >= 500) {
        // Server error - retry
        throw new Error(`Server error: ${response.status}`);
      } else {
        // Client error (4xx) - don't retry
        throw new Error(`Client error: ${response.status} (no retry)`);
      }

    } catch (error) {
      console.log(`❌ Attempt ${attempt + 1} failed: ${error.message}`);

      // Don't retry on client errors
      if (error.message.includes('no retry')) {
        throw error;
      }

      attempt++;

      if (attempt < maxRetries) {
        // EXPONENTIAL BACKOFF!
        const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }

  throw new Error('Payment failed after all retries');
}

function calculateBackoffDelay(attemptNumber, baseDelay, maxDelay) {
  // Exponential: 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);

  // Cap at maximum
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (±20% randomness)
  const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);

  return Math.round(cappedDelay + jitter);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// What happens now:
/*
10:30:00.000 - Attempt 1: Calling payment API...
10:30:00.100 - ❌ Attempt 1 failed: Network timeout
10:30:00.100 - ⏳ Waiting 1000ms before retry...

10:30:01.100 - Attempt 2: Calling payment API...
10:30:01.200 - ❌ Attempt 2 failed: Network timeout
10:30:01.200 - ⏳ Waiting 2000ms before retry...

10:30:03.200 - Attempt 3: Calling payment API...
10:30:03.300 - ❌ Attempt 3 failed: Network timeout
10:30:03.300 - ⏳ Waiting 4000ms before retry...

10:30:07.300 - Attempt 4: Calling payment API...
10:30:07.400 - ❌ Attempt 4 failed: Server error: 503
10:30:07.400 - ⏳ Waiting 8000ms before retry...

10:30:15.400 - Attempt 5: Calling payment API...
10:30:15.800 - ✅ Payment successful!

Success! Server recovered during the 8-second wait.
Total time: ~15 seconds (vs 500ms failure with immediate retry)

Benefits:
✅ Server had time to recover
✅ Didn't waste retries
✅ Eventually succeeded
✅ Didn't overwhelm system
*/
```
