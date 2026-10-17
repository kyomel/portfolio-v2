---
title: "Graceful Service Degradation Patterns"
termSlug: "graceful-service-degradation-patterns"
year: 2025
month: 10
monthName: "October"
day: 30
order: 20
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "Graceful Service Degradation is a resilience pattern where a system continues to operate with reduced functionality when facing failures, rather than completely breaking down. Instead of showing er..."
---
### Definition:

Graceful Service Degradation is a resilience pattern where a system continues to operate with reduced functionality when facing failures, rather than completely breaking down. Instead of showing error pages or crashing, the system automatically falls back to simpler alternatives, cached data, or core features only, ensuring users can still accomplish their primary tasks even during outages or high load.

**Key Properties:**

- Partial functionality: Core features remain available
- Automatic fallback: System degrades without manual intervention
- User awareness: Clear communication about reduced capabilities
- Progressive failure: Gradual reduction rather than sudden crash
- Quick recovery: Easy restoration when issues resolve

**Core Concepts:**

- Circuit breaker: Prevent cascading failures
- Fallback mechanisms: Alternative data sources or simplified features
- Feature toggles: Dynamically disable non-essential features
- Cached responses: Serve stale but useful data
- Timeout handling: Fail fast and gracefully

### Example:

E-commerce site with product recommendations becoming slow/unavailable

```
class GracefulEcommerceHomePage {
  constructor() {
    this.circuitBreakers = new Map();
    this.cache = new Map();
    this.timeouts = {
      userService: 2000,
      recommendations: 5000,
      products: 3000,
      deals: 1000,
      reviews: 2000
    };
  }

  async loadPage(userId) {
    console.log('🏠 Loading homepage with graceful degradation...');

    const pageData = {
      user: null,
      personalized: [],
      trending: [],
      deals: [],
      reviews: [],
      degradedServices: []
    };

    // Core user data (highest priority)
    try {
      pageData.user = await this.getUserWithFallback(userId);
    } catch (error) {
      console.log('⚠️ User service degraded - using guest mode');
      pageData.user = { name: 'Guest', id: null };
      pageData.degradedServices.push('user-profile');
    }

    // Personalized recommendations (nice-to-have)
    try {
      pageData.personalized = await this.getPersonalizedWithFallback(userId);
    } catch (error) {
      console.log('⚠️ Recommendations degraded - using popular products');
      pageData.personalized = await this.getFallbackProducts();
      pageData.degradedServices.push('personalization');
    }

    // Trending products (important but has fallbacks)
    try {
      pageData.trending = await this.getTrendingWithFallback();
    } catch (error) {
      console.log('⚠️ Trending service degraded - using cached data');
      pageData.trending = this.getCachedTrending();
      pageData.degradedServices.push('trending');
    }

    // Deals (optional feature)
    try {
      pageData.deals = await this.getDealsWithFallback();
    } catch (error) {
      console.log('⚠️ Deals service unavailable - hiding deals section');
      pageData.deals = [];
      pageData.degradedServices.push('deals');
    }

    // Reviews (optional enhancement)
    try {
      pageData.reviews = await this.getReviewsWithFallback();
    } catch (error) {
      console.log('⚠️ Reviews service unavailable - hiding reviews');
      pageData.reviews = [];
      pageData.degradedServices.push('reviews');
    }

    return this.renderDegradedPage(pageData);
  }

  async getUserWithFallback(userId) {
    const circuitBreaker = this.getCircuitBreaker('userService');

    if (circuitBreaker.isOpen()) {
      throw new Error('User service circuit breaker open');
    }

    try {
      const user = await this.withTimeout(
        this.userService.getProfile(userId),
        this.timeouts.userService
      );

      circuitBreaker.recordSuccess();
      return user;

    } catch (error) {
      circuitBreaker.recordFailure();

      // Try cache as fallback
      const cachedUser = this.cache.get(`user:${userId}`);
      if (cachedUser) {
        console.log('📦 Using cached user data');
        return { ...cachedUser, fromCache: true };
      }

      throw error;
    }
  }

  async getPersonalizedWithFallback(userId) {
    try {
      const recommendations = await this.withTimeout(
        this.recommendationService.getPersonalized(userId),
        this.timeouts.recommendations
      );

      // Cache successful responses
      this.cache.set(`recommendations:${userId}`, recommendations);
      return recommendations;

    } catch (error) {
      // Fallback 1: Use cached recommendations
      const cached = this.cache.get(`recommendations:${userId}`);
      if (cached) {
        console.log('📦 Using cached recommendations');
        return cached.map(item => ({ ...item, fromCache: true }));
      }

      // Fallback 2: Use generic popular products
      console.log('🔄 Falling back to popular products');
      return this.getFallbackProducts();
    }
  }

  async getTrendingWithFallback() {
    try {
      const trending = await this.withTimeout(
        this.productService.getTrending(),
        this.timeouts.products
      );

      this.cache.set('trending', trending);
      return trending;

    } catch (error) {
      // Use cached trending data (even if stale)
      const cached = this.cache.get('trending');
      if (cached) {
        console.log('📦 Using cached trending data');
        return cached.map(item => ({ ...item, fromCache: true }));
      }

      throw new Error('No trending data available');
    }
  }

  async getFallbackProducts() {
    // Static fallback data for when all else fails
    return [
      { id: 1, name: 'Popular Laptop', price: 999, category: 'electronics' },
      { id: 2, name: 'Bestselling Book', price: 19, category: 'books' },
      { id: 3, name: 'Top Rated Headphones', price: 199, category: 'electronics' },
      { id: 4, name: 'Customer Favorite Mug', price: 15, category: 'home' }
    ].map(item => ({ ...item, fallback: true }));
  }

  getCachedTrending() {
    // Return last known good data
    return this.cache.get('trending') || this.getFallbackProducts();
  }

  renderDegradedPage(data) {
    console.log('🎨 Rendering page with degradation status...');

    let html = '<div class="homepage">';

    // User section
    if (data.user) {
      const userStatus = data.user.fromCache ? ' (cached)' : '';
      html += `<header>Welcome back, ${data.user.name}${userStatus}!</header>`;
    }

    // Degradation notice
    if (data.degradedServices.length > 0) {
      html += `<div class="degradation-notice">
        ⚠️ Some features are temporarily limited due to high traffic.
        Affected: ${data.degradedServices.join(', ')}
      </div>`;
    }

    // Personalized section
    if (data.personalized.length > 0) {
      const sectionTitle = data.personalized[0].fallback ? 'Popular Products' :
                          data.personalized[0].fromCache ? 'Your Recommendations (cached)' :
                          'Recommended for You';

      html += `<section class="recommendations">
        <h2>${sectionTitle}</h2>
        ${this.renderProductList(data.personalized)}
      </section>`;
    }

    // Trending section
    if (data.trending.length > 0) {
      const sectionTitle = data.trending[0].fromCache ? 'Trending Products (cached)' : 'Trending Now';
      html += `<section class="trending">
        <h2>${sectionTitle}</h2>
        ${this.renderProductList(data.trending)}
      </section>`;
    }

    // Optional sections (only show if available)
    if (data.deals.length > 0) {
      html += `<section class="deals">
        <h2>🎯 Current Deals</h2>
        ${this.renderProductList(data.deals)}
      </section>`;
    }

    if (data.reviews.length > 0) {
      html += `<section class="reviews">
        <h2>💬 Latest Reviews</h2>
        ${this.renderReviewList(data.reviews)}
      </section>`;
    }

    html += '</div>';

    return {
      html,
      degradationLevel: this.calculateDegradationLevel(data.degradedServices),
      availableFeatures: this.getAvailableFeatures(data)
    };
  }

  calculateDegradationLevel(degradedServices) {
    const levels = {
      0: 'FULL',
      1: 'MINOR',
      2: 'MODERATE',
      3: 'MAJOR',
      4: 'SEVERE'
    };

    return levels[Math.min(degradedServices.length, 4)] || 'SEVERE';
  }

  // Circuit breaker implementation
  getCircuitBreaker(serviceName) {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, new CircuitBreaker());
    }
    return this.circuitBreakers.get(serviceName);
  }

  async withTimeout(promise, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }
}

class CircuitBreaker {
  constructor() {
    this.failures = 0;
    this.failureThreshold = 5;
    this.resetTimeout = 30000; // 30 seconds
    this.state = 'CLOSED';
    this.nextAttempt = 0;
  }

  isOpen() {
    if (this.state === 'OPEN' && Date.now() > this.nextAttempt) {
      this.state = 'HALF_OPEN';
      console.log('🔄 Circuit breaker half-open, trying again...');
    }

    return this.state === 'OPEN';
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failures++;

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log('🚫 Circuit breaker opened due to failures');
    }
  }
}

// Usage example
async function demonstrateGracefulDegradation() {
  const homepage = new GracefulEcommerceHomePage();

  console.log('🚀 Loading homepage normally...');
  let result = await homepage.loadPage(123);
  console.log(`✅ Page loaded with ${result.degradationLevel} degradation`);

  // Simulate service failures
  console.log('\n💥 Simulating recommendation service failure...');
  homepage.recommendationService.getPersonalized = () => {
    throw new Error('Recommendation service down');
  };

  result = await homepage.loadPage(123);
  console.log(`⚠️ Page loaded with ${result.degradationLevel} degradation`);

  // Simulate multiple service failures
  console.log('\n💥💥 Simulating multiple service failures...');
  homepage.dealService.getCurrentDeals = () => {
    throw new Error('Deal service down');
  };
  homepage.reviewService.getLatestReviews = () => {
    throw new Error('Review service down');
  };

  result = await homepage.loadPage(123);
  console.log(`⚠️⚠️ Page loaded with ${result.degradationLevel} degradation`);
  console.log(`Available features: ${result.availableFeatures.join(', ')}`);
}

demonstrateGracefulDegradation();
```
