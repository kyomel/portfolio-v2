---
title: "Contract-First Integration"
termSlug: "contract-first-integration"
year: 2026
month: 5
monthName: "May"
day: 29
order: 21
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "Contract-First Integration is an approach where you design the agreement between services before you write any implementation code. Think of it as drafting a legal contract that both parties sign b..."
---
### Definition:

Contract-First Integration is an approach where you design the agreement between services before you write any implementation code. Think of it as drafting a legal contract that both parties sign before doing business — it specifies exactly what one side will provide and what the other side can expect.

In simpler terms: instead of building an API first and hoping it fits, you sit down and write the interface definition (the "contract") upfront. Both provider and consumer then build against that shared agreement, knowing they'll fit together perfectly.

Analogy — A Construction Project
Imagine building a house where the electrician and the plumber show up with no shared plan:

Without a Contract	With a Contract (Contract-First)
Plumber puts pipes wherever	Blueprint specifies: "Water inlet at x:120, y:200"
Electrician wires wherever	Blueprint says: "220V outlet at x:300, y:100"
Nothing lines up 😱	Everything fits perfectly ✅

The blueprint is the contract. It doesn't build the house — it just guarantees that when each trade does their work, everything will connect.

### Example:

REST API with OpenAPI
Here's a real-world scenario: a Weather Service and a Mobile App that shows forecasts.

```
Step 1: Write the Contract First (OpenAPI 3.0)

# weather-contract.yaml — THE SINGLE SOURCE OF TRUTH

openapi: 3.0.3
info:
  title: Weather Service
  version: 1.0.0

paths:
  /forecast/{city}:
    get:
      summary: Get 7-day forecast for a city
      parameters:
        - name: city
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Forecast data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ForecastResponse'
        '404':
          description: City not found

components:
  schemas:
    ForecastResponse:
      type: object
      required: [city, days]
      properties:
        city:
          type: string
          example: "Amsterdam"
        days:
          type: array
          items:
            $ref: '#/components/schemas/DayForecast'

    DayForecast:
      type: object
      required: [date, high_celsius, low_celsius, condition]
      properties:
        date:
          type: string
          format: date
        high_celsius:
          type: number
        low_celsius:
          type: number
        condition:
          type: string
          enum: [sunny, cloudy, rainy, snowy]
Step 2: Provider Generates Server Stub from the Contract

# Auto-generate server code from the contract
openapi-generator generate \
  -i weather-contract.yaml \
  -g spring \
  -o ./weather-server
Then fill in the business logic:

@RestController
public class WeatherController implements ForecastApi {  // Generated interface!

    @Override
    public ResponseEntity<ForecastResponse> getForecast(String city) {
        // The method signature was DEFINED by the contract
        return ResponseEntity.ok(
            new ForecastResponse()
                .city(city)
                .days(List.of(
                    new DayForecast()
                        .date(LocalDate.now())
                        .highCelsius(22.0)
                        .lowCelsius(14.0)
                        .condition(Condition.SUNNY)
                ))
        );
    }
}
Step 3: Consumer Generates a Client from the Same Contract

# Auto-generate client code from the SAME contract
openapi-generator generate \
  -i weather-contract.yaml \
  -g python \
  -o ./weather-client

from generated_client import ForecastApi

# The client is GUARANTEED to match the server
client = ForecastApi(base_url="https://api.weather.io")
forecast = client.get_forecast(city="Amsterdam")

print(f"{forecast.city}: {forecast.days[0].condition}")
# Output: Amsterdam: sunny
```
