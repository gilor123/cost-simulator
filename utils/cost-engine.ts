// Cost Engine - Implements cost display logic according to specification
// Handles attribution date filtering, app filtering, grouping, and cost calculations

export interface DatabaseRecord {
  day: string;
  mediaSource: string;
  campaign: string;
  cost: number;
  impressions: number;
  clicks: number;
  apps: string;
}

export interface TableRow {
  key: string;
  label: string;
  cost: number;
  subRows?: Record<string, TableRow>;
}

export interface CostEngineResult {
  totalCost: number;
  tableRows: Record<string, TableRow>;
  totalsRow: TableRow;
}

export class CostEngine {
  private rawData: DatabaseRecord[];

  constructor(rawData: DatabaseRecord[]) {
    this.rawData = rawData;
  }

  // Step 1: Filter by attribution date range
  private filterByDateRange(dateFrom: Date, dateTo: Date | null): DatabaseRecord[] {
    if (!dateTo) {
      // If only dateFrom is selected, filter for that single date
      const targetDate = this.formatDateForComparison(dateFrom);
      return this.rawData.filter(record => {
        const recordDate = this.parseRecordDate(record.day);
        return this.formatDateForComparison(recordDate) === targetDate;
      });
    }

    return this.rawData.filter(record => {
      const recordDate = this.parseRecordDate(record.day);
      return recordDate >= dateFrom && recordDate <= dateTo;
    });
  }

  // Step 2: Calculate total cost based on selected apps
  private calculateTotalCost(
    dateFilteredRecords: DatabaseRecord[],
    selectedApps: string[]
  ): number {
    // No apps selected - return 0
    if (selectedApps.length === 0) {
      return 0;
    }

    // All apps selected - sum all costs
    if (this.areAllAppsSelected(selectedApps)) {
      return dateFilteredRecords.reduce((sum, record) => sum + record.cost, 0);
    }

    // Subset of apps selected - campaign-level filtering
    const campaignCosts = new Map<string, number>();
    const campaignHasSelectedApp = new Map<string, boolean>();

    // First pass: identify campaigns that have at least one selected app
    dateFilteredRecords.forEach(record => {
      const campaign = record.campaign;
      const recordApps = this.parseApps(record.apps);
      
      if (!campaignHasSelectedApp.has(campaign)) {
        campaignHasSelectedApp.set(campaign, false);
      }

      // Check if this record has any selected app
      const hasSelectedApp = recordApps.some(app => selectedApps.includes(app));
      if (hasSelectedApp) {
        campaignHasSelectedApp.set(campaign, true);
      }

      // Accumulate campaign cost
      campaignCosts.set(campaign, (campaignCosts.get(campaign) || 0) + record.cost);
    });

    // Sum costs of campaigns that have at least one selected app
    let totalCost = 0;
    campaignHasSelectedApp.forEach((hasApp, campaign) => {
      if (hasApp) {
        totalCost += campaignCosts.get(campaign) || 0;
      }
    });

    return totalCost;
  }

  // Step 3: Generate table rows based on grouping dimension
  private generateTableRows(
    dateFilteredRecords: DatabaseRecord[],
    selectedApps: string[],
    primaryGroupBy: string,
    secondaryGroupBy?: string,
    appLevelCostView: boolean = true
  ): Record<string, TableRow> {
    // Early return if no apps selected - table should be empty
    if (selectedApps.length === 0) {
      return {};
    }

    // Filter records by selected apps (campaign-level filtering)
    const appFilteredRecords = this.filterBySelectedApps(dateFilteredRecords, selectedApps);

    // If no records match the app filter, return empty table
    if (appFilteredRecords.length === 0) {
      return {};
    }

    if (primaryGroupBy === 'app') {
      return this.generateAppGroupedRows(appFilteredRecords, selectedApps, secondaryGroupBy, appLevelCostView);
    } else {
      return this.generateDimensionGroupedRows(appFilteredRecords, primaryGroupBy, secondaryGroupBy);
    }
  }

  // Filter records by selected apps (campaign-level logic)
  private filterBySelectedApps(
    records: DatabaseRecord[],
    selectedApps: string[]
  ): DatabaseRecord[] {
    if (this.areAllAppsSelected(selectedApps)) {
      return records;
    }

    // Get campaigns that have at least one selected app
    const validCampaigns = new Set<string>();
    records.forEach(record => {
      const recordApps = this.parseApps(record.apps);
      const hasSelectedApp = recordApps.some(app => selectedApps.includes(app));
      if (hasSelectedApp) {
        validCampaigns.add(record.campaign);
      }
    });

    // Return all records from valid campaigns
    return records.filter(record => validCampaigns.has(record.campaign));
  }

  // Generate rows when "App" is the primary grouping dimension
  private generateAppGroupedRows(
    records: DatabaseRecord[],
    selectedApps: string[],
    secondaryGroupBy?: string,
    appLevelCostView: boolean = true
  ): Record<string, TableRow> {
    const appRows: Record<string, TableRow> = {};
    const multiAppCampaigns = new Set<string>();
    let unknownCost = 0;

    // Initialize only the selected apps (even if no data)
    selectedApps.forEach(app => {
      appRows[app] = {
        key: app,
        label: app,
        cost: 0, // Will be updated if data exists
        subRows: secondaryGroupBy ? {} : undefined
      };
    });

    // Group campaigns by their app association within the date range
    const campaignToApps = new Map<string, Set<string>>();
    const campaignCosts = new Map<string, number>();

    records.forEach(record => {
      const campaign = record.campaign;
      const recordApps = this.parseApps(record.apps);
      
      if (!campaignToApps.has(campaign)) {
        campaignToApps.set(campaign, new Set());
      }
      
      recordApps.forEach(app => {
        if (selectedApps.includes(app) || this.areAllAppsSelected(selectedApps)) {
          campaignToApps.get(campaign)!.add(app);
        }
      });

      campaignCosts.set(campaign, (campaignCosts.get(campaign) || 0) + record.cost);
    });

    // Process each campaign
    campaignToApps.forEach((apps, campaign) => {
      const cost = campaignCosts.get(campaign) || 0;
      
      if (!appLevelCostView) {
        // When app-level cost view is OFF, all costs go to Unknown
        multiAppCampaigns.add(campaign);
        unknownCost += cost;
      } else {
        // Normal logic when app-level cost view is ON
        if (apps.size === 1) {
          // Single app campaign
          const app = Array.from(apps)[0];
          if (appRows[app]) { // Only update if it's a valid app
            appRows[app].cost += cost;
          }
        } else if (apps.size > 1) {
          // Multi-app campaign
          multiAppCampaigns.add(campaign);
          unknownCost += cost;
        }
      }
    });

    // Add secondary grouping (campaigns) to each app if specified
    if (secondaryGroupBy === 'campaign') {
      selectedApps.forEach(app => {
        if (appRows[app]) {
          this.addAllCampaignsToApp(appRows[app], records, app, campaignToApps, campaignCosts, appLevelCostView);
        }
      });
    }

    // Add "Unknown" row if there are multi-app campaigns
    if (unknownCost > 0) {
      appRows['Unknown'] = {
        key: 'Unknown',
        label: 'Unknown',
        cost: unknownCost,
        subRows: secondaryGroupBy ? {} : undefined
      };
    }

    return appRows;
  }

  // Generate rows for other dimensions (Campaign, Media Source, Date)
  private generateDimensionGroupedRows(
    records: DatabaseRecord[],
    primaryGroupBy: string,
    secondaryGroupBy?: string
  ): Record<string, TableRow> {
    const rows: Record<string, TableRow> = {};

    records.forEach(record => {
      const primaryValue = this.getDimensionValue(record, primaryGroupBy);
      
      if (!rows[primaryValue]) {
        rows[primaryValue] = {
          key: primaryValue,
          label: primaryValue,
          cost: 0,
          subRows: secondaryGroupBy ? {} : undefined
        };
      }
      
      rows[primaryValue].cost += record.cost;
      
      // Add secondary grouping if specified
      if (secondaryGroupBy) {
        this.addSecondaryGrouping(rows[primaryValue], [record], record.campaign, secondaryGroupBy);
      }
    });

    return rows;
  }

  // Add secondary grouping to a row
  private addSecondaryGrouping(
    parentRow: TableRow,
    records: DatabaseRecord[],
    campaign: string,
    secondaryGroupBy: string
  ): void {
    if (!parentRow.subRows) {
      parentRow.subRows = {};
    }

    const relevantRecords = records.filter(r => r.campaign === campaign);
    relevantRecords.forEach(record => {
      const secondaryValue = this.getDimensionValue(record, secondaryGroupBy);
      
      if (!parentRow.subRows![secondaryValue]) {
        parentRow.subRows![secondaryValue] = {
          key: secondaryValue,
          label: secondaryValue,
          cost: 0
        };
      }
      
      parentRow.subRows![secondaryValue].cost += record.cost;
    });
  }

  // Add all campaigns as secondary grouping for app rows
  private addAllCampaignsToApp(
    appRow: TableRow,
    records: DatabaseRecord[],
    appName: string,
    campaignToApps: Map<string, Set<string>>,
    campaignCosts: Map<string, number>,
    appLevelCostView: boolean = true
  ): void {
    if (!appRow.subRows) {
      appRow.subRows = {};
    }

    // Get all campaigns from the records
    const allCampaigns = new Set<string>();
    records.forEach(record => {
      allCampaigns.add(record.campaign);
    });

    // Add each campaign as a sub-row
    allCampaigns.forEach(campaign => {
      const campaignApps = campaignToApps.get(campaign) || new Set();
      
      // Determine cost for this campaign-app combination
      let campaignCost = 0;
      if (appLevelCostView) {
        // Normal logic when app-level cost view is ON
        if (campaignApps.size === 1 && campaignApps.has(appName)) {
          // Single-app campaign that matches this app
          campaignCost = campaignCosts.get(campaign) || 0;
        }
        // For multi-app campaigns, cost stays 0 (will show in Unknown)
      }
      // When appLevelCostView is false, all campaign costs stay 0 (will show as "NA")

      appRow.subRows![campaign] = {
        key: campaign,
        label: campaign,
        cost: campaignCost
      };
    });
  }

  // Main method to process data according to specification
  public processData(
    dateFrom: Date,
    dateTo: Date | null,
    selectedApps: string[],
    primaryGroupBy: string,
    secondaryGroupBy?: string,
    appLevelCostView: boolean = true
  ): CostEngineResult {
    // Step 1: Filter by attribution date range
    const dateFilteredRecords = this.filterByDateRange(dateFrom, dateTo);

    // Step 2: Calculate total cost
    const totalCost = this.calculateTotalCost(dateFilteredRecords, selectedApps);

    // Step 3: Generate table rows
    const tableRows = this.generateTableRows(
      dateFilteredRecords,
      selectedApps,
      primaryGroupBy,
      secondaryGroupBy,
      appLevelCostView
    );

    // Create totals row
    const totalsRowCost = Object.values(tableRows).reduce((sum, row) => sum + row.cost, 0);
    const totalsRow: TableRow = {
      key: 'totals',
      label: 'Total',
      cost: totalsRowCost
    };

    return {
      totalCost,
      tableRows,
      totalsRow
    };
  }

  // Helper methods
  private parseRecordDate(dateString: string): Date {
    // Parse "Jun 1, 2025" format
    return new Date(dateString);
  }

  private formatDateForComparison(date: Date): string {
    return date.toDateString();
  }

  private parseApps(appsString: string): string[] {
    return appsString.split(',').map(app => app.trim());
  }

  private areAllAppsSelected(selectedApps: string[]): boolean {
    const allApps = ['Wolt iOS', 'Wolt Android', 'Wolt Web'];
    return allApps.every(app => selectedApps.includes(app));
  }

  private getDimensionValue(record: DatabaseRecord, dimension: string): string {
    switch (dimension) {
      case 'campaign':
        return record.campaign;
      case 'media_source':
        return record.mediaSource;
      case 'date':
        return record.day;
      case 'app':
        return record.apps; // This case is handled separately
      default:
        return record.campaign;
    }
  }
}

// Factory function to create and use the cost engine
export function processCostData(
  rawData: DatabaseRecord[],
  dateFrom: Date,
  dateTo: Date | null,
  selectedApps: string[],
  primaryGroupBy: string,
  secondaryGroupBy?: string,
  appLevelCostView: boolean = true
): CostEngineResult {
  const engine = new CostEngine(rawData);
  return engine.processData(dateFrom, dateTo, selectedApps, primaryGroupBy, secondaryGroupBy, appLevelCostView);
} 