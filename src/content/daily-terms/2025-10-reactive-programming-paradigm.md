---
title: "Reactive Programming Paradigm"
termSlug: "reactive-programming-paradigm"
year: 2025
month: 10
monthName: "October"
day: 28
order: 18
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "Reactive Programming is a programming paradigm focused on handling asynchronous data streams and propagating changes automatically. Instead of imperatively calling functions, you declare how your p..."
---
### Definition:

Reactive Programming is a programming paradigm focused on handling asynchronous data streams and propagating changes automatically. Instead of imperatively calling functions, you declare how your program should react to data changes, events, or user interactions. Think of it as "programming with streams of data" where your code automatically responds to new information flowing through the system.

**Key Properties:**

- Data streams: Everything is treated as a stream of data over time
- Automatic propagation: Changes flow through the system automatically
- Declarative: You describe what should happen, not how
- Asynchronous: Handles async operations naturally
- Observer pattern: Components observe and react to changes

**Core Concepts:**

- Observable: A stream of data that can be observed
- Observer/Subscriber: Listens to observables and reacts to data
- Operators: Transform, filter, and combine data streams
- Reactive: System automatically responds to changes

### Example:

Live Dashboard

```
class ReactiveDashboard {
  constructor() {
    // Data sources (observables)
    this.userActivity$ = this.createUserActivityStream();
    this.systemMetrics$ = this.createSystemMetricsStream();
    this.salesData$ = this.createSalesDataStream();
    this.errorLogs$ = this.createErrorLogsStream();

    this.setupDashboard();
  }

  createUserActivityStream() {
    // Simulate real-time user activity data
    return new Observable(observer => {
      setInterval(() => {
        observer.next({
          activeUsers: Math.floor(Math.random() * 1000) + 500,
          newSignups: Math.floor(Math.random() * 50),
          timestamp: new Date()
        });
      }, 2000);
    });
  }

  createSystemMetricsStream() {
    return new Observable(observer => {
      setInterval(() => {
        observer.next({
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          networkLoad: Math.random() * 100,
          timestamp: new Date()
        });
      }, 1000);
    });
  }

  createSalesDataStream() {
    return new Observable(observer => {
      setInterval(() => {
        observer.next({
          revenue: Math.random() * 10000,
          orders: Math.floor(Math.random() * 100),
          conversionRate: Math.random() * 5,
          timestamp: new Date()
        });
      }, 5000);
    });
  }

  createErrorLogsStream() {
    return new Observable(observer => {
      // Simulate occasional errors
      setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance of error
          observer.next({
            level: ['error', 'warning', 'info'][Math.floor(Math.random() * 3)],
            message: 'Something happened in the system',
            service: ['auth', 'payment', 'database'][Math.floor(Math.random() * 3)],
            timestamp: new Date()
          });
        }
      }, 3000);
    });
  }

  setupDashboard() {
    // 📊 KPI Calculations (automatically update)
    this.overallHealth$ = combineLatest([
      this.systemMetrics$,
      this.errorLogs$
    ]).pipe(
      map(([metrics, errorLog]) => {
        const systemHealth = (200 - metrics.cpuUsage - metrics.memoryUsage) / 2;
        const errorPenalty = errorLog.level === 'error' ? 20 : 0;
        return Math.max(0, systemHealth - errorPenalty);
      })
    );

    // 💰 Revenue per minute
    this.revenuePerMinute$ = this.salesData$.pipe(
      map(sales => sales.revenue / 60),
      scan((acc, current) => [...acc.slice(-9), current], []), // Keep last 10 minutes
      map(history => history.reduce((sum, val) => sum + val, 0) / history.length)
    );

    // 🚨 Alert system
    this.criticalAlerts$ = merge(
      // High CPU usage alerts
      this.systemMetrics$.pipe(
        filter(metrics => metrics.cpuUsage > 80),
        map(metrics => ({
          type: 'CRITICAL',
          message: `High CPU usage: ${metrics.cpuUsage.toFixed(1)}%`,
          timestamp: metrics.timestamp
        }))
      ),

      // Error alerts
      this.errorLogs$.pipe(
        filter(log => log.level === 'error'),
        map(log => ({
          type: 'ERROR',
          message: `${log.service} error: ${log.message}`,
          timestamp: log.timestamp
        }))
      ),

      // Low conversion rate alerts
      this.salesData$.pipe(
        filter(sales => sales.conversionRate < 1),
        map(sales => ({
          type: 'WARNING',
          message: `Low conversion rate: ${sales.conversionRate.toFixed(2)}%`,
          timestamp: sales.timestamp
        }))
      )
    );

    // 📈 Trend analysis
    this.userGrowthTrend$ = this.userActivity$.pipe(
      scan((history, current) => [...history.slice(-19), current], []), // Keep last 20 data points
      filter(history => history.length >= 5),
      map(history => {
        const recent = history.slice(-5).reduce((sum, h) => sum + h.activeUsers, 0) / 5;
        const older = history.slice(-10, -5).reduce((sum, h) => sum + h.activeUsers, 0) / 5;
        return {
          trend: recent > older ? 'UP' : recent < older ? 'DOWN' : 'STABLE',
          change: ((recent - older) / older * 100).toFixed(1)
        };
      })
    );

    this.subscribeToUpdates();
  }

  subscribeToUpdates() {
    // 🖥️ Update UI components reactively
    this.overallHealth$.subscribe(health => {
      this.updateHealthWidget(health);
    });

    this.revenuePerMinute$.subscribe(rpm => {
      this.updateRevenueWidget(rpm);
    });

    this.criticalAlerts$.subscribe(alert => {
      this.showAlert(alert);
    });

    this.userGrowthTrend$.subscribe(trend => {
      this.updateTrendIndicator(trend);
    });

    // 📊 Update charts automatically
    this.systemMetrics$.subscribe(metrics => {
      this.updateSystemChart(metrics);
    });

    this.salesData$.subscribe(sales => {
      this.updateSalesChart(sales);
    });

    // 📱 Send notifications
    this.criticalAlerts$.pipe(
      filter(alert => alert.type === 'CRITICAL')
    ).subscribe(alert => {
      this.sendPushNotification(alert);
    });
  }

  updateHealthWidget(health) {
    const color = health > 70 ? 'green' : health > 40 ? 'yellow' : 'red';
    console.log(`🏥 System Health: ${health.toFixed(1)}% (${color})`);
  }

  updateRevenueWidget(rpm) {
    console.log(`💰 Revenue/min: $${rpm.toFixed(2)}`);
  }

  showAlert(alert) {
    const icon = alert.type === 'CRITICAL' ? '🚨' : alert.type === 'ERROR' ? '❌' : '⚠️';
    console.log(`${icon} ALERT: ${alert.message}`);
  }

  updateTrendIndicator(trend) {
    const arrow = trend.trend === 'UP' ? '📈' : trend.trend === 'DOWN' ? '📉' : '➡️';
    console.log(`${arrow} User Growth: ${trend.trend} (${trend.change}%)`);
  }

  updateSystemChart(metrics) {
    console.log(`📊 System: CPU ${metrics.cpuUsage.toFixed(1)}%, Memory ${metrics.memoryUsage.toFixed(1)}%`);
  }

  updateSalesChart(sales) {
    console.log(`📈 Sales: $${sales.revenue.toFixed(2)}, ${sales.orders} orders`);
  }

  sendPushNotification(alert) {
    console.log(`📱 PUSH: ${alert.message}`);
  }
}

// Usage
const dashboard = new ReactiveDashboard();

// Dashboard automatically updates as data streams in
console.log('🚀 Reactive dashboard started - watch the live updates!');

// Simulate running for a while
setTimeout(() => {
  console.log('📊 Dashboard has been reactively updating for 30 seconds!');
}, 30000);
```
