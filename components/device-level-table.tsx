import React, { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, ArrowUpRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

// Define dimension types for better type safety
type Dimension = 
  | "media_source" 
  | "date" 
  | "campaign" 
  | "ad_set" 
  | "ad" 
  | "attribution_method"
  | "device_type"

interface DeviceLevelTableProps {
  groupBy: string[]
  groupBySecondary: string
  selectedApps: string[]
  selectedLayers: string[]
  visibleLayer: string | null
  selectedAsset: string | null
}

export function DeviceLevelTable({ 
  groupBy, 
  groupBySecondary, 
  selectedApps, 
  selectedLayers,
  visibleLayer,
  selectedAsset
}: DeviceLevelTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [originalData, setOriginalData] = useState<any>(null)
  const [tableData, setTableData] = useState<any>({})
  const [layerPercentages, setLayerPercentages] = useState<Record<string, Record<string, any>>>({})
  const [errorFactors, setErrorFactors] = useState<Record<string, Record<string, any>>>({})

  // Toggle row expansion
  const toggleRow = (rowKey: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }))
  }

  // Function to calculate percentage increases for any layer
  const calculateLayerImpact = (data: any, layerType: string) => {
    const result: any = {}
    const percentages: Record<string, any> = {}
    
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      // Get the original values for all metrics
      const totalAttributions = parseInt(value.totalAttributions.replace(/,/g, ""))
      const installs = parseInt(value.installs.replace(/,/g, ""))
      const reAttributions = parseInt(value.reAttributions.replace(/,/g, ""))
      const reEngagements = parseInt(value.reEngagements.replace(/,/g, ""))
      const clicks = parseInt(value.clicks.replace(/,/g, ""))
      const impressions = parseInt(value.impressions.replace(/,/g, ""))
      const purchases = parseInt(value.purchases.replace(/,/g, ""))
      const revenue = parseInt(value.revenue.replace(/,/g, ""))
      
      // Initialize increase variables
      let totalAttributionsIncrease = 0
      let installsIncrease = 0
      let reAttributionsIncrease = 0
      let reEngagementsIncrease = 0
      let clicksIncrease = 0
      let impressionsIncrease = 0
      let purchasesIncrease = 0
      let revenueIncrease = 0
      
      // Check if this is an organic media source (for incrementality)
      const isOrganic = key === "Organic"
      
      if (layerType === "skan") {
        // SKAN affects iOS metrics
        installsIncrease = Math.round(installs * 20 / 100)
        totalAttributionsIncrease = installsIncrease
        purchasesIncrease = Math.round(purchases * 25 / 100)
        revenueIncrease = Math.round(revenue * 30 / 100)
      } else if (layerType === "incrementality" && !isOrganic) {
        // Incrementality only affects total values and non-organic sources
        totalAttributionsIncrease = Math.round(totalAttributions * 10 / 100)
        purchasesIncrease = Math.round(purchases * 12 / 100)
        revenueIncrease = Math.round(revenue * 15 / 100)
      } else if (layerType === "sandbox") {
        // Sandbox primarily affects iOS/mobile
        installsIncrease = Math.round(installs * 10 / 100)
        totalAttributionsIncrease = installsIncrease
        purchasesIncrease = Math.round(purchases * 12 / 100)
        revenueIncrease = Math.round(revenue * 15 / 100)
      }
      
      // Calculate new values
      const newTotalAttributions = totalAttributions + totalAttributionsIncrease
      const newInstalls = installs + installsIncrease
      const newReAttributions = reAttributions + reAttributionsIncrease
      const newReEngagements = reEngagements + reEngagementsIncrease
      const newClicks = clicks + clicksIncrease
      const newImpressions = impressions + impressionsIncrease
      const newPurchases = purchases + purchasesIncrease
      const newRevenue = revenue + revenueIncrease
      
      // Calculate percentage increases
      const totalAttributionsPercentIncrease = totalAttributions > 0 ? ((newTotalAttributions - totalAttributions) / totalAttributions) * 100 : 0
      const installsPercentIncrease = installs > 0 ? ((newInstalls - installs) / installs) * 100 : 0
      const reAttributionsPercentIncrease = reAttributions > 0 ? ((newReAttributions - reAttributions) / reAttributions) * 100 : 0
      const reEngagementsPercentIncrease = reEngagements > 0 ? ((newReEngagements - reEngagements) / reEngagements) * 100 : 0
      const clicksPercentIncrease = clicks > 0 ? ((newClicks - clicks) / clicks) * 100 : 0
      const impressionsPercentIncrease = impressions > 0 ? ((newImpressions - impressions) / impressions) * 100 : 0
      const purchasesPercentIncrease = purchases > 0 ? ((newPurchases - purchases) / purchases) * 100 : 0
      const revenuePercentIncrease = revenue > 0 ? ((newRevenue - revenue) / revenue) * 100 : 0
      
      // Store the percentages
      percentages[key] = {
        totalAttributions: parseFloat(totalAttributionsPercentIncrease.toFixed(1)),
        installs: parseFloat(installsPercentIncrease.toFixed(1)),
        reAttributions: parseFloat(reAttributionsPercentIncrease.toFixed(1)),
        reEngagements: parseFloat(reEngagementsPercentIncrease.toFixed(1)),
        clicks: parseFloat(clicksPercentIncrease.toFixed(1)),
        impressions: parseFloat(impressionsPercentIncrease.toFixed(1)),
        purchases: parseFloat(purchasesPercentIncrease.toFixed(1)),
        revenue: parseFloat(revenuePercentIncrease.toFixed(1))
      }
      
      // Update the result with new values
      result[key] = {
        ...value,
        totalAttributions: newTotalAttributions.toLocaleString(),
        installs: newInstalls.toLocaleString(),
        reAttributions: newReAttributions.toLocaleString(),
        reEngagements: newReEngagements.toLocaleString(),
        clicks: newClicks.toLocaleString(),
        impressions: newImpressions.toLocaleString(),
        purchases: newPurchases.toLocaleString(),
        revenue: newRevenue.toLocaleString()
      }
      
      // Handle subRows if they exist
      if (value.subRows) {
        const { data: subRowsData, percentages: subRowsPercentages } = 
          calculateLayerImpact(value.subRows, layerType)
        
        result[key].subRows = subRowsData
        
        // Merge the sub-row percentages
        Object.entries(subRowsPercentages).forEach(([subKey, subPercent]) => {
          percentages[`${key}-${subKey}`] = subPercent
        })
      }
    })
    
    return { data: result, percentages }
  }

  // Apply all selected layers to the data
  const applySelectedLayers = (baseData: any) => {
    if (!baseData || selectedLayers.length === 0) {
      return baseData;
    }

    let currentData = JSON.parse(JSON.stringify(baseData));
    const allPercentages: Record<string, Record<string, any>> = {};

    // Apply each selected layer sequentially
    for (const layer of selectedLayers) {
      // Skip updating values for incrementality layer - we'll just show factors next to original values
      if (layer === "incrementality") {
        // Still calculate percentages for incrementality display
        const { percentages } = calculateLayerImpact(currentData, layer);
        allPercentages[layer] = percentages;
      } else {
        // For other layers (SKAN, Sandbox), apply the changes to the values
        const { data: updatedData, percentages } = calculateLayerImpact(currentData, layer);
        currentData = updatedData;
        allPercentages[layer] = percentages;
      }
    }

    return { data: currentData, percentages: allPercentages };
  };

  // Function to generate random error factors for the incrementality layer
  const generateErrorFactors = (data: any) => {
    const result: Record<string, any> = {}
    
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      // Check if this is an organic media source
      const isOrganic = key === "Organic"
      
      // Generate random factor values (60% to 150%)
      const generateFactor = () => {
        return Math.random() > 0.2 
          ? 60 + Math.random() * 35 // 60-95% (decrease factor) - 80% chance
          : 100 + Math.random() * 50 // 100-150% (increase factor) - 20% chance
      }
      
      // For incrementality, only generate factors for totals and non-organic sources
      const totalAttributionsFactor = !isOrganic ? generateFactor() : 0
      const purchasesFactor = !isOrganic ? generateFactor() : 0
      const revenueFactor = !isOrganic ? generateFactor() : 0
      
      result[key] = {
        totalAttributions: parseFloat(totalAttributionsFactor.toFixed(1)),
        installs: 0,
        reAttributions: 0,
        reEngagements: 0,
        clicks: 0,
        impressions: 0,
        purchases: parseFloat(purchasesFactor.toFixed(1)),
        revenue: parseFloat(revenueFactor.toFixed(1))
      }
      
      if (value.subRows) {
        const subRowsFactors = generateErrorFactors(value.subRows)
        
        // Merge the sub-row factors
        Object.entries(subRowsFactors).forEach(([subKey, subFactors]) => {
          result[`${key}-${subKey}`] = subFactors
        })
      }
    })
    
    return result
  }

  // Mock data initialization with support for different dimensions
  useEffect(() => {
    // Define data for different dimensions
    const mediaSources = ["Facebook Ads", "Organic", "Unity Ads", "Apple Search Ads", "Roku"]
    const campaigns = ["Summer Sale", "Holiday Special", "New User Promo", "Retention Campaign"]
    const adSets = ["Ad Set 1", "Ad Set 2", "Ad Set 3", "Ad Set 4"]
    const ads = ["Banner Ad", "Video Ad", "Interactive Ad", "Story Ad"]
    const dates = ["2025-02-23", "2025-02-24", "2025-02-25", "2025-02-26"]
    const attributionMethods = ["Last Click", "Last View", "First Click", "Multi-Touch"]
    const deviceTypes = ["Mobile", "Web", "TV", "PC"]

    // Create a mapping of dimension types to their values
    const dimensionValues: Record<Dimension, string[]> = {
      media_source: mediaSources,
      campaign: campaigns,
      ad_set: adSets,
      ad: ads,
      date: dates,
      attribution_method: attributionMethods,
      device_type: deviceTypes
    }

    // Function to generate mock data for a specific dimension
    const generateMockData = (primaryDimension: string, secondaryDimension: string) => {
      const result: any = {}
      
      // Get the values for the primary dimension
      const primaryValues = dimensionValues[primaryDimension as Dimension] || mediaSources
      
      // Get the values for the secondary dimension
      const secondaryValues = dimensionValues[secondaryDimension as Dimension] || campaigns
      
      // Generate data for each primary dimension value
      primaryValues.forEach((primaryValue, primaryIndex) => {
        const subRows: any = {}
        
        // Handle the Roku special case
        const isRoku = primaryValue === "Roku"
        
        // Handle Facebook Ads special case
        const isFacebookAds = primaryValue === "Facebook Ads"
        
        // Handle Organic media source for incrementality
        const isOrganic = primaryValue === "Organic"
        
        // Generate subrows for each secondary dimension value
        secondaryValues.forEach((secondaryValue, secondaryIndex) => {
          // Generate some mock metrics based on indices for variety
          const baseValue = (primaryIndex + 1) * 1000 + (secondaryIndex + 1) * 100
          
          // For Mobile assets, use these values
          if (selectedAsset?.includes("Mobile")) {
            // Determine if this is a mobile device type when device_type is a dimension
            const isMobileDeviceType = 
              (primaryDimension === "device_type" && primaryValue === "Mobile") ||
              (secondaryDimension === "device_type" && secondaryValue === "Mobile")
            
            // For device_type dimension, adjust distribution to ensure mobile dominance
            let mobileMultiplier = 1
            
            // If this is a mobile device type, boost the numbers significantly
            if (isMobileDeviceType) {
              mobileMultiplier = 10  // 10x multiplier for mobile device type
            }
            
            // Total attributions is the sum of installs, re-attributions, and re-engagements
            const installs = Math.round(baseValue * 0.6 * mobileMultiplier)
            const reAttributions = Math.round(baseValue * 0.3 * mobileMultiplier)
            const reEngagements = Math.round(baseValue * 0.1 * mobileMultiplier)
            const totalAttributions = installs + reAttributions + reEngagements
            
            // Other metrics
            const impressions = baseValue * 300 * mobileMultiplier
            const clicks = baseValue * 3 * mobileMultiplier
            const purchases = Math.round(totalAttributions * 0.25)
            const revenue = purchases * 55
            
            subRows[secondaryValue] = {
              totalAttributions: totalAttributions.toLocaleString(),
              installs: installs.toLocaleString(),
              reAttributions: reAttributions.toLocaleString(),
              reEngagements: reEngagements.toLocaleString(),
              impressions: impressions.toLocaleString(),
              clicks: clicks.toLocaleString(),
              purchases: purchases.toLocaleString(),
              revenue: revenue.toLocaleString(),
            }
          } else {
            // For other assets, use different distributions
            const totalAttributions = baseValue
            const installs = Math.round(baseValue * 0.5)
            const reAttributions = Math.round(baseValue * 0.3)
            const reEngagements = Math.round(baseValue * 0.2)
            
            const impressions = baseValue * 250
            const clicks = baseValue * 2.5
            const purchases = Math.round(totalAttributions * 0.2)
            const revenue = purchases * 45
            
            subRows[secondaryValue] = {
              totalAttributions: totalAttributions.toLocaleString(),
              installs: installs.toLocaleString(),
              reAttributions: reAttributions.toLocaleString(),
              reEngagements: reEngagements.toLocaleString(),
              impressions: impressions.toLocaleString(),
              clicks: clicks.toLocaleString(),
              purchases: purchases.toLocaleString(),
              revenue: revenue.toLocaleString(),
            }
          }
        })
        
        // Create the primary dimension entry with aggregated metrics
        const totalValue = (primaryIndex + 1) * 1000 * secondaryValues.length
        
        if (selectedAsset?.includes("Mobile")) {
          // Determine if this is a mobile device type when device_type is a dimension
          const isMobileDeviceType = primaryDimension === "device_type" && primaryValue === "Mobile"
          
          // For device_type dimension, adjust distribution to ensure mobile dominance
          let mobileMultiplier = 1
          
          // If this is a mobile device type, boost the numbers significantly
          if (isMobileDeviceType) {
            mobileMultiplier = 10  // 10x multiplier for mobile device type
          }
          
          // Total attributions is the sum of installs, re-attributions, and re-engagements
          const installs = Math.round(totalValue * 0.6 * mobileMultiplier)
          const reAttributions = Math.round(totalValue * 0.3 * mobileMultiplier)
          const reEngagements = Math.round(totalValue * 0.1 * mobileMultiplier)
          const totalAttributions = installs + reAttributions + reEngagements
          
          // Other metrics
          const impressions = totalValue * 300 * mobileMultiplier
          const clicks = totalValue * 3 * mobileMultiplier
          const purchases = Math.round(totalAttributions * 0.25)
          const revenue = purchases * 55
          
          // Only add the entry if there are actual sub-rows (relevant for Roku)
          if (Object.keys(subRows).length > 0 || !isRoku) {
            result[primaryValue] = {
              totalAttributions: totalAttributions.toLocaleString(),
              installs: installs.toLocaleString(),
              reAttributions: reAttributions.toLocaleString(),
              reEngagements: reEngagements.toLocaleString(),
              impressions: impressions.toLocaleString(),
              clicks: clicks.toLocaleString(),
              purchases: purchases.toLocaleString(),
              revenue: revenue.toLocaleString(),
              subRows: Object.keys(subRows).length > 0 ? subRows : undefined
            }
          }
        } else {
          // For other assets, use different distributions
          const totalAttributions = totalValue
          const installs = Math.round(totalValue * 0.5)
          const reAttributions = Math.round(totalValue * 0.3)
          const reEngagements = Math.round(totalValue * 0.2)
          
          const impressions = totalValue * 250
          const clicks = totalValue * 2.5
          const purchases = Math.round(totalAttributions * 0.2)
          const revenue = purchases * 45
          
          // Only add the entry if there are actual sub-rows (relevant for Roku)
          if (Object.keys(subRows).length > 0 || !isRoku) {
            result[primaryValue] = {
              totalAttributions: totalAttributions.toLocaleString(),
              installs: installs.toLocaleString(),
              reAttributions: reAttributions.toLocaleString(),
              reEngagements: reEngagements.toLocaleString(),
              impressions: impressions.toLocaleString(),
              clicks: clicks.toLocaleString(),
              purchases: purchases.toLocaleString(),
              revenue: revenue.toLocaleString(),
              subRows: Object.keys(subRows).length > 0 ? subRows : undefined
            }
          }
        }
      })
      
      return result
    }
    
    // Generate data based on the current groupBy and groupBySecondary
    const mockData = generateMockData(groupBy[0], groupBySecondary)
    
    // Generate error factors for incrementality
    const mockErrorFactors = generateErrorFactors(mockData)
    setErrorFactors({ incrementality: mockErrorFactors })
    
    setOriginalData(mockData)
    
    // Apply all selected layers to the data
    if (selectedLayers.length > 0) {
      const { data: updatedData, percentages } = applySelectedLayers(mockData);
      setTableData(updatedData);
      setLayerPercentages(percentages);
    } else {
      setTableData(mockData);
      setLayerPercentages({});
    }
  }, [groupBy, groupBySecondary, selectedLayers, selectedAsset])

  const renderRow = (key: string, data: any, depth = 0, parentKey = "") => {
    const isExpanded = expandedRows[key]
    const hasSubRows = data.subRows && Object.keys(data.subRows).length > 0
    const rowKey = parentKey ? `${parentKey}-${key}` : key
    
    // Only show arrows and percentages for the visible layer
    const showArrows = visibleLayer !== null && selectedLayers.includes(visibleLayer)
    const currentPercentages = visibleLayer ? (layerPercentages[visibleLayer]?.[rowKey] || {}) : {}
    
    // Show error factors only for incrementality layer
    const showErrorFactors = visibleLayer === "incrementality"
    const currentErrorFactors = errorFactors.incrementality?.[rowKey] || {}

    // Helper component for tooltips with error factor information
    const ErrorTooltip = ({ children, factor }: { children: React.ReactNode, factor: number }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p className="mb-1">Incrementality factor: {factor}%</p>
              <Button size="sm" className="h-6 text-xs w-full">Investigate</Button>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

    // Helper to render incrementality factor
    const renderIncrementalityFactor = (factor: number) => {
      if (!factor) return null;
      
      const isIncrease = factor >= 100;
      
      return (
        <div className={`flex items-center ml-1 ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
          {isIncrease ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5L19 19M19 5L19 19L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <span className="text-xs ml-0.5">{factor}%</span>
        </div>
      );
    }

    return (
      <React.Fragment key={key}>
        <tr className="border-b hover:bg-gray-50">
          <td className="px-4 py-2" style={{ paddingLeft: `${depth * 20 + 16}px` }}>
            <div className="flex items-center">
              {hasSubRows && (
                <button onClick={() => toggleRow(key)} className="mr-1">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              {key}
            </div>
          </td>
          
          {/* Total Attributions */}
          <td className="text-center px-4 py-2 min-w-[120px] border-r">
            {showErrorFactors && currentErrorFactors.totalAttributions ? (
              <ErrorTooltip factor={currentErrorFactors.totalAttributions}>
                <div className="flex items-center justify-center">
                  {data.totalAttributions}
                  {renderIncrementalityFactor(currentErrorFactors.totalAttributions)}
                </div>
              </ErrorTooltip>
            ) : (
              <div className="flex items-center justify-center">
                {data.totalAttributions}
                {showArrows && currentPercentages.totalAttributions > 0 && (
                  <div className="flex items-center ml-1 text-green-500">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="text-xs ml-0.5">{currentPercentages.totalAttributions}%</span>
                  </div>
                )}
              </div>
            )}
          </td>
          
          {/* Installs */}
          <td className="text-center px-4 py-2 min-w-[120px]">
            <div className="flex items-center justify-center">
              {data.installs}
              {showArrows && currentPercentages.installs > 0 && (
                <div className="flex items-center ml-1 text-green-500">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs ml-0.5">{currentPercentages.installs}%</span>
                </div>
              )}
            </div>
          </td>
          
          {/* Re-Attributions */}
          <td className="text-center px-4 py-2 min-w-[120px]">
            <div className="flex items-center justify-center">
              {data.reAttributions}
              {showArrows && currentPercentages.reAttributions > 0 && (
                <div className="flex items-center ml-1 text-green-500">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs ml-0.5">{currentPercentages.reAttributions}%</span>
                </div>
              )}
            </div>
          </td>
          
          {/* Re-Engagements */}
          <td className="text-center px-4 py-2 min-w-[120px] border-r">
            <div className="flex items-center justify-center">
              {data.reEngagements}
              {showArrows && currentPercentages.reEngagements > 0 && (
                <div className="flex items-center ml-1 text-green-500">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs ml-0.5">{currentPercentages.reEngagements}%</span>
                </div>
              )}
            </div>
          </td>
          
          {/* Clicks */}
          <td className="text-center px-4 py-2 min-w-[120px]">
            <div className="flex items-center justify-center">
              {data.clicks}
              {showArrows && currentPercentages.clicks > 0 && (
                <div className="flex items-center ml-1 text-green-500">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs ml-0.5">{currentPercentages.clicks}%</span>
                </div>
              )}
            </div>
          </td>
          
          {/* Impressions */}
          <td className="text-center px-4 py-2 min-w-[120px] border-r">
            <div className="flex items-center justify-center">
              {data.impressions}
              {showArrows && currentPercentages.impressions > 0 && (
                <div className="flex items-center ml-1 text-green-500">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs ml-0.5">{currentPercentages.impressions}%</span>
                </div>
              )}
            </div>
          </td>
          
          {/* Purchases */}
          <td className="text-center px-4 py-2 min-w-[120px]">
            {showErrorFactors && currentErrorFactors.purchases ? (
              <ErrorTooltip factor={currentErrorFactors.purchases}>
                <div className="flex items-center justify-center">
                  {data.purchases}
                  {renderIncrementalityFactor(currentErrorFactors.purchases)}
                </div>
              </ErrorTooltip>
            ) : (
              <div className="flex items-center justify-center">
                {data.purchases}
                {showArrows && currentPercentages.purchases > 0 && (
                  <div className="flex items-center ml-1 text-green-500">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="text-xs ml-0.5">{currentPercentages.purchases}%</span>
                  </div>
                )}
              </div>
            )}
          </td>
          
          {/* Revenue */}
          <td className="text-center px-4 py-2 min-w-[120px]">
            {showErrorFactors && currentErrorFactors.revenue ? (
              <ErrorTooltip factor={currentErrorFactors.revenue}>
                <div className="flex items-center justify-center">
                  {data.revenue}
                  {renderIncrementalityFactor(currentErrorFactors.revenue)}
                </div>
              </ErrorTooltip>
            ) : (
              <div className="flex items-center justify-center">
                {data.revenue}
                {showArrows && currentPercentages.revenue > 0 && (
                  <div className="flex items-center ml-1 text-green-500">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="text-xs ml-0.5">{currentPercentages.revenue}%</span>
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
        
        {isExpanded &&
          hasSubRows &&
          Object.entries(data.subRows).map(([subKey, subData]) => renderRow(subKey, subData as any, depth + 1, key))}
      </React.Fragment>
    )
  }

  // Get dimension label for display
  const getDimensionLabel = (dimension: string): string => {
    const dimensionMap: Record<string, string> = {
      media_source: "Media Source",
      date: "Date",
      campaign: "Campaign",
      ad_set: "Ad Set",
      ad: "Ad",
      attribution_method: "Attribution Method",
      device_type: "Device Type"
    }
    return dimensionMap[dimension] || dimension
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left font-medium text-gray-500 px-4 py-2 w-[200px]">
                {getDimensionLabel(groupBy[0])}
              </th>
              
              {/* Attribution Metrics */}
              <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] border-r">
                Total Attributions
              </th>
              <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px]">
                Installs
              </th>
              <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px]">
                Re-Attributions
              </th>
              <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] border-r">
                Re-Engagements
              </th>
              
              {/* Activity Metrics */}
              <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px]">
                Clicks
              </th>
              <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] border-r">
                Impressions
              </th>
              
              {/* Conversion Metrics */}
              <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px]">
                Purchases
              </th>
              <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px]">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody>{Object.entries(tableData).map(([key, data]) => renderRow(key, data))}</tbody>
        </table>
      </div>
    </div>
  )
} 