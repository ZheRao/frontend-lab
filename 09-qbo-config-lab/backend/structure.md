```
/definitions/sources
/definitions/cash-flow-categories
/definitions/config-sources
/definitions/crops

/clients

/actuals/qbo

/forecast/years
/forecast/revisions
/forecast/inputs/crop-plans
/forecast/inputs/qbo/sources           POST batch add
/forecast/inputs/qbo/configurations
/forecast/inputs/monthly-allocations
/forecast/outputs/...                  (the existing serving layer for Forecast Explorer)
```

The rule for each group:

- **`/definitions`: the shared foundation.** Company-wide meaning of things, which every system reads. This is your "centralized definitions and configuration" path. Each collection is GET-only now and gains its own CRUD later without moving.
- **`/clients`: records of who you serve.** These are operational records, not definitions or forecast data.
- **`/actuals`: recorded financial fact.** This is where the external path lands. Client QBO integration will write here, so `/actuals/qbo` is the stable home for it.
- **`/forecast`: the analytical system.** It holds the forecast cycle structure (years, revisions), what goes in (inputs) and what comes out (outputs). Precision is about inputs → engine → outputs, and the URL shows that flow.