# Cost-display logic

*Applies to Cost Platform and Multi-Platform views.*

## 1. Attribution-date filter (always first)
- Keep only cost records whose date falls inside the user-selected attribution-date range; discard the rest.

## 2. Total-cost card and "Totals" row
- **All apps selected** (iOS, Android, Web – every app appearing in the *App* column)
  - Total cost = sum of every campaign’s cost inside the date range.
- **Subset of apps selected**
  - For each campaign, inspect the date-filtered records:
    - If at least one record within the range is tagged with any chosen app, add the campaign’s full cost (within that range) to the total.
    - Otherwise, ignore the campaign.

## 3. Breakdown view when "App" is in the grouping
- **Campaign linked to a single app during the selected range**
  - Show one row for that app and place the campaign’s full cost in the *Cost* column.
- **Campaign linked to multiple apps during the selected range**
  - Do not distribute the campaign’s cost across app rows.
  - Add one additional row titled **"Unknown"** containing the combined cost of all such multi-app campaigns.
- Each filtered app appears once; the **"Unknown"** row appears only when multi-app cost exists.
- The *Totals* row equals the sum of all displayed rows (apps + "Unknown").

## 4. Breakdown view with other dimensions (e.g., Campaign, Media Source, Date)
- Distribute cost strictly according to the selected dimension’s values in the database.
- Each unique value receives its own row with aggregated cost for the date range.
- The *Totals* row equals the sum of all rows; no special handling is required.

## 5. Modularity requirement
- Implement each section as an independent module so that, in future, alternative logic can replace:
  - The calculation for the Total-cost card and "Totals" row.
  - The calculation for per-app breakdown when "App" is used in the grouping.
