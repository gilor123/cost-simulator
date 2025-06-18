# Cost-display logic (Updated)

*Applies to Cost Platform and Multi-Platform views.*

## 1. Attribution-date filter (always first)
- Keep only cost records whose date falls inside the user-selected attribution-date range; discard the rest.

## 2. Total-cost card and "Totals" row
- **No apps selected**
  - Total cost = 0 (both total cost card and table should be empty/zero)
- **All apps selected** (iOS, Android, Web – every app appearing in the *App* column)
  - Total cost = sum of every campaign's cost inside the date range.
- **Subset of apps selected**
  - For each campaign, inspect the date-filtered records:
    - If at least one record within the range is tagged with any chosen app, add the campaign's full cost (within that range) to the total.
    - Otherwise, ignore the campaign.
  - **Edge case**: If selected apps don't exist in the filtered date range, total cost = 0 and table should be empty.

## 3. Consistency requirement
- **Critical**: The table values must always be consistent with the total cost card.
- If total cost = 0 (due to app filtering or date filtering), then:
  - All table rows should show 0 cost or the table should be empty
  - The "Totals" row should show 0
- This ensures users see coherent data across all UI elements.

## 4. Breakdown view when "App" is in the grouping
- **Show only selected apps**: Display only the apps that are selected in the app filter (not all possible apps)
- **App-level cost view toggle behavior**:
  - **When ON (default)**: Normal cost attribution logic applies
    - Campaign linked to a single app: Show cost in that app's column
    - Multi-app campaigns: Cost goes to "Unknown" row
  - **When OFF**: Override logic applies
    - All app rows show "NA" for cost (no cost attribution to apps)
    - All campaign costs go to "Unknown" row (equals total cost)
- **Selected apps with no matching campaigns**: Display "NA" in the *Cost* column instead of 0
- **Secondary grouping by Campaign**: When secondary dimension is "Campaign"
  - Each app row is expandable to show all campaigns
  - **When app-level cost view ON**: Campaign sub-rows show actual cost only for single-app campaigns
  - **When app-level cost view OFF**: All campaign sub-rows show "NA"
  - Multi-app campaigns show "NA" in app sub-rows (cost appears in "Unknown" row)
- The **"Unknown"** row appears when multi-app cost exists OR when app-level cost view is OFF
- **Totals row**: Display total cost below header and above data rows
- The *Totals* row equals the sum of all displayed rows (apps + "Unknown"), excluding "NA" values.

## 5. Breakdown view with other dimensions (e.g., Campaign, Media Source, Date)
- Distribute cost strictly according to the selected dimension's values in the database.
- Each unique value receives its own row with aggregated cost for the date range.
- The *Totals* row equals the sum of all rows; no special handling is required.
- **Important**: Only include records from campaigns that match the app filter criteria.

## 6. Modularity requirement
- Implement each section as an independent module so that, in future, alternative logic can replace:
  - The calculation for the Total-cost card and "Totals" row.
  - The calculation for per-app breakdown when "App" is used in the grouping.

## 7. Edge cases to handle
1. **No apps selected**: Total cost = 0, table empty
2. **Selected apps don't exist in date range**: Total cost = 0, table empty
3. **All campaigns filtered out**: Total cost = 0, table empty
4. **Date range with no data**: Total cost = 0, table empty 