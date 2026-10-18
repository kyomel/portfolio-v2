---
title: "Sierra Charts"
termSlug: "sierra-charts"
year: 2026
month: 2
monthName: "February"
day: 17
order: 12
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "Sierra Charts is a professional-grade desktop trading and charting platform designed for active traders, particularly in futures, stocks, and forex markets. Unlike web-based platforms, it's a high-..."
---
### Definition:

Sierra Charts is a professional-grade desktop trading and charting platform designed for active traders, particularly in futures, stocks, and forex markets. Unlike web-based platforms, it's a high-performance Windows application that provides advanced technical analysis tools, real-time market data, customizable studies/indicators, and automated trading capabilities. It's known for its speed, stability, extensive customization options, and powerful features favored by day traders and algorithmic traders.

**Key Concepts:**

- Desktop Application: Native Windows software (not browser-based)
- High Performance: Written in C++, extremely fast data processing
- Professional Trading: Used by serious day traders and institutions
- Advanced Analysis: 300+ built-in technical indicators and studies
- Automation: Support for automated trading systems (ACSIL - C++)
- Market Data: Direct feeds from exchanges (CME, NASDAQ, etc.)

### Example:

Day Trading Session

```text
Pre-Market Setup (8:00 AM)

Trader's Sierra Charts Workspace:

┌─────────────────────────────────────────────────────────────┐
│ Screen 1: Main Trading Monitor                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Chart 1: ES - 5 Min Candlesticks (primary chart)           │
│  └─ Shows overall trend and key levels                      │
│                                                              │
│  Chart 2: ES - 1 Min Candlesticks (timing chart)            │
│  └─ For precise entry/exit timing                           │
│                                                              │
│  Chart 3: ES - Tick Chart (500 tick bars)                   │
│  └─ Ultra-short-term price action                           │
│                                                              │
│  Chart 4: NQ - 5 Min (NASDAQ futures correlation)           │
│  └─ See if tech sector agrees with S&P                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Screen 2: Order Flow & Execution                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Footprint Chart: ES - 5 Min                                │
│  └─ See buyer/seller aggression                             │
│                                                              │
│  Trade DOM: ES                                               │
│  └─ One-click order entry                                   │
│                                                              │
│  Market Depth: ES                                            │
│  └─ See limit order book depth                              │
│                                                              │
│  Volume Profile: Today's session                            │
│  └─ Identify high-volume areas (support/resistance)         │
└─────────────────────────────────────────────────────────────┘
9:30 AM - Market Opens
What Trader Sees:

ES 5-Minute Chart:
Time: 9:30 AM
Price: 4820.00 (opening price)
VWAP: 4818.50
Yesterday's Close: 4815.25

Analysis on Screen:
┌────────────────────────────────────┐
│ Pre-market High: 4822.00           │ ← Resistance level
│ Pre-market Low:  4816.50           │ ← Support level
│ VWAP:           4818.50           │ ← Fair value
│ Previous Day:   4815.25 (close)    │
│ Overnight High: 4825.00            │
│ Overnight Low:  4812.00            │
└────────────────────────────────────┘

Current Bar (9:30-9:35):
Open:  4820.00
High:  4823.50
Low:   4819.00
Close: 4822.75 (so far)
Volume: 12,450 contracts

Indicators:
├─ 9 EMA:  4819.25 (price above = bullish)
├─ 20 EMA: 4817.00 (price above = bullish)
├─ RSI:    62 (neutral, slightly bullish)
└─ MACD:   Positive and rising (bullish)

Footprint shows: Heavy buying at 4821.00 level
└─ 850 buy orders vs 320 sell orders
└─ +530 delta (strong buying pressure!)
9:35 AM - Trade Entry
Trade Setup:

Signal: Price bounced off VWAP (4818.50) with strong buying

Trade Plan:
├─ Entry: 4822.75 (current price)
├─ Stop Loss: 4817.00 (below VWAP and 20 EMA)
├─ Target 1: 4828.00 (previous resistance)
├─ Target 2: 4832.00 (measured move)
├─ Risk: 5.75 points
├─ Reward 1: 5.25 points (R:R = 0.91:1)
└─ Reward 2: 9.25 points (R:R = 1.6:1)

Execution in Sierra Charts:

1. Trader clicks on Trade DOM at 4822.75
2. Sets bracket order:
   ├─ Market Order: BUY 2 contracts
   ├─ Stop Loss: 4817.00 (automatic)
   ├─ Target 1: 4828.00 (sell 1 contract)
   └─ Target 2: 4832.00 (sell 1 contract)

3. Clicks "BUY" button

Order filled in 0.02 seconds! ⚡
Live Position Tracking:

Position Window:
┌────────────────────────────────────────────┐
│ Symbol: ES                                 │
│ Position: +2 contracts (LONG)              │
│ Entry: 4822.75                             │
│ Current: 4824.50                           │
│ P&L: +$175.00 (+1.75 points × $50/point)  │
│                                            │
│ Active Orders:                             │
│ ├─ Stop Loss: 4817.00                      │
│ ├─ Target 1: 4828.00 (1 contract)          │
│ └─ Target 2: 4832.00 (1 contract)          │
└────────────────────────────────────────────┘

Chart shows:
├─ Entry line at 4822.75 (green)
├─ Stop loss line at 4817.00 (red)
├─ Target lines at 4828.00, 4832.00 (blue)
└─ Current P&L floating above position
9:48 AM - Target 1 Hit

Price reached 4828.00! 🎯

Automatic execution:
├─ 1 contract sold at 4828.00
├─ Profit on 1st contract: +$262.50
└─ 1 contract still open (stop now at breakeven)

Updated Position:
┌────────────────────────────────────────────┐
│ Position: +1 contract (LONG)               │
│ Entry: 4822.75                             │
│ Current: 4828.25                           │
│ Realized P&L: +$262.50 (closed)            │
│ Unrealized P&L: +$275.00 (open)            │
│ Total P&L: +$537.50                        │
│                                            │
│ Updated Orders:                            │
│ ├─ Stop Loss: 4822.75 (moved to breakeven)│
│ └─ Target 2: 4832.00 (1 contract)          │
└────────────────────────────────────────────┘

Risk now: $0 (stop at entry = free trade!)
10:05 AM - Target 2 Hit

Price reached 4832.00! 🎯🎯

Final execution:
└─ Last contract sold at 4832.00
└─ Profit on 2nd contract: +$462.50

Final Trade Result:
┌────────────────────────────────────────────┐
│ TRADE CLOSED                               │
├────────────────────────────────────────────┤
│ Entry: 4822.75 (2 contracts)               │
│ Exit 1: 4828.00 (1 contract) = +$262.50   │
│ Exit 2: 4832.00 (1 contract) = +$462.50   │
│                                            │
│ Total Profit: +$725.00                     │
│ Total Risk: $287.50 (5.75 points)          │
│ Reward:Risk = 2.52:1 ✅                    │
│                                            │
│ Trade Duration: 30 minutes                 │
│ Commissions: -$4.80 (2 contracts × 2 sides)│
│ Net Profit: +$720.20                       │
└────────────────────────────────────────────┘

Sierra Charts automatically:
├─ Logged trade to journal
├─ Updated daily P&L
├─ Removed all working orders
├─ Updated statistics (win rate, avg win, etc.)
└─ Sent notification to mobile app
```
