import React, { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, ArrowUpRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

// Define dimension types for better type safety
type Dimension = 
  | "device_type" 
  | "media_source" 
  | "date" 
  | "campaign" 
  | "ad_set" 
  | "ad" 
  | "attribution_method"

interface TableData {
  [key: string]: {
    total: string
    cost: string
    impressions: string
    clicks: string
    purchases: {
      total: string
      mobile: string
      web: string
      ctv: string
      pc: string
    }
    revenue: {
      total: string
      mobile: string
      web: string
      ctv: string
      pc: string
    }
    acquiredUsers: {
      total: string
      mobile: string
      web: string
      ctv: string
      pc: string
    }
    subRows?: Record<string, any>
  }
}

import { type CostEngineResult } from "@/utils/cost-engine"

interface EnhancedTableProps {
  groupBy: string[]
  groupBySecondary: string
  selectedApps: string[]
  selectedLayers: string[]
  visibleLayer: string | null
  costData?: CostEngineResult
}

export function EnhancedTable({ 
  groupBy, 
  groupBySecondary, 
  selectedApps, 
  selectedLayers,
  visibleLayer,
  costData
}: EnhancedTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [acquiredUsersExpanded, setAcquiredUsersExpanded] = useState(false)
  const [purchasesExpanded, setPurchasesExpanded] = useState(false)
  const [revenueExpanded, setRevenueExpanded] = useState(false)
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

  // Toggle column expansions
  const toggleAcquiredUsers = () => {
    setAcquiredUsersExpanded(prev => !prev)
  }

  const togglePurchases = () => {
    setPurchasesExpanded(prev => !prev)
  }

  const toggleRevenue = () => {
    setRevenueExpanded(prev => !prev)
  }

  // Function to calculate percentage increases for any layer
  const calculateLayerImpact = (data: any, layerType: string) => {
    const result: any = {}
    const percentages: Record<string, any> = {}
    
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      // Check if this is an organic media source
      const isOrganic = key === "Organic"
      
      // Get the original values for acquired users
      const mobileUsers = parseInt(value.acquiredUsers.mobile.replace(/,/g, ""))
      const webUsers = parseInt(value.acquiredUsers.web.replace(/,/g, ""))
      const ctvUsers = parseInt(value.acquiredUsers.ctv.replace(/,/g, ""))
      const pcUsers = parseInt(value.acquiredUsers.pc.replace(/,/g, ""))
      const totalUsers = mobileUsers + webUsers + ctvUsers + pcUsers
      
      // Get the original values for purchases
      const mobilePurchases = parseInt(value.purchases.mobile.replace(/,/g, ""))
      const webPurchases = parseInt(value.purchases.web.replace(/,/g, ""))
      const ctvPurchases = parseInt(value.purchases.ctv.replace(/,/g, ""))
      const pcPurchases = parseInt(value.purchases.pc.replace(/,/g, ""))
      const totalPurchases = mobilePurchases + webPurchases + ctvPurchases + pcPurchases
      
      // Get the original values for revenue
      const mobileRevenue = parseInt(value.revenue.mobile.replace(/,/g, ""))
      const webRevenue = parseInt(value.revenue.web.replace(/,/g, ""))
      const ctvRevenue = parseInt(value.revenue.ctv.replace(/,/g, ""))
      const pcRevenue = parseInt(value.revenue.pc.replace(/,/g, ""))
      const totalRevenue = mobileRevenue + webRevenue + ctvRevenue + pcRevenue
      
      // Different layers affect different metrics
      // For acquired users
      let mobileIncrease = 0
      let webIncrease = 0
      let ctvIncrease = 0
      let pcIncrease = 0
      
      // For purchases
      let mobilePurchaseIncrease = 0
      let webPurchaseIncrease = 0
      let ctvPurchaseIncrease = 0
      let pcPurchaseIncrease = 0
      
      // For revenue
      let mobileRevenueIncrease = 0
      let webRevenueIncrease = 0
      let ctvRevenueIncrease = 0
      let pcRevenueIncrease = 0
      
      if (layerType === "skan") {
        // SKAN only affects mobile with 20% increase
        mobileIncrease = Math.round(mobileUsers * 20 / 100)
        mobilePurchaseIncrease = Math.round(mobilePurchases * 25 / 100)
        mobileRevenueIncrease = Math.round(mobileRevenue * 30 / 100)
      } else if (layerType === "incrementality" && !isOrganic) {
        // Incrementality now only affects the total columns, not individual platform breakdowns
        // And only for non-organic media sources
        // Set individual platform increases to 0
        mobileIncrease = 0
        webIncrease = 0
        ctvIncrease = 0
        pcIncrease = 0
        
        // Only affect the totals with a percentage increase
        // Apply a 10% increase to total acquired users
        const totalUsersIncrease = Math.round(totalUsers * 10 / 100)
        
        // Set individual purchase platform increases to 0
        mobilePurchaseIncrease = 0
        webPurchaseIncrease = 0
        ctvPurchaseIncrease = 0
        pcPurchaseIncrease = 0
        
        // Apply a 12% increase to total purchases
        const totalPurchasesIncrease = Math.round(totalPurchases * 12 / 100)
        
        // Set individual revenue platform increases to 0
        mobileRevenueIncrease = 0
        webRevenueIncrease = 0
        ctvRevenueIncrease = 0
        pcRevenueIncrease = 0
        
        // Apply a 15% increase to total revenue
        const totalRevenueIncrease = Math.round(totalRevenue * 15 / 100)
      } else if (layerType === "sandbox") {
        // Sandbox primarily affects mobile with 10% increase
        mobileIncrease = Math.round(mobileUsers * 10 / 100)
        mobilePurchaseIncrease = Math.round(mobilePurchases * 12 / 100)
        mobileRevenueIncrease = Math.round(mobileRevenue * 15 / 100)
      }
      
      // Calculate new values for acquired users
      const newMobileUsers = mobileUsers + mobileIncrease
      const newWebUsers = webUsers + webIncrease
      const newCtvUsers = ctvUsers + ctvIncrease
      const newPcUsers = pcUsers + pcIncrease
      
      // For incrementality layer, we need special handling for the total
      const newTotalUsers = layerType === "incrementality" && !isOrganic
        ? totalUsers + (Math.round(totalUsers * 10 / 100)) // Direct 10% increase to total for non-organic
        : totalUsers + mobileIncrease + webIncrease + ctvIncrease + pcIncrease
      
      // Calculate new values for purchases
      const newMobilePurchases = mobilePurchases + mobilePurchaseIncrease
      const newWebPurchases = webPurchases + webPurchaseIncrease
      const newCtvPurchases = ctvPurchases + ctvPurchaseIncrease
      const newPcPurchases = pcPurchases + pcPurchaseIncrease
      
      // For incrementality layer, we need special handling for the total
      const newTotalPurchases = layerType === "incrementality" && !isOrganic
        ? totalPurchases + (Math.round(totalPurchases * 12 / 100)) // Direct 12% increase to total for non-organic
        : totalPurchases + mobilePurchaseIncrease + webPurchaseIncrease + ctvPurchaseIncrease + pcPurchaseIncrease
      
      // Calculate new values for revenue
      const newMobileRevenue = mobileRevenue + mobileRevenueIncrease
      const newWebRevenue = webRevenue + webRevenueIncrease
      const newCtvRevenue = ctvRevenue + ctvRevenueIncrease
      const newPcRevenue = pcRevenue + pcRevenueIncrease
      
      // For incrementality layer, we need special handling for the total
      const newTotalRevenue = layerType === "incrementality" && !isOrganic
        ? totalRevenue + (Math.round(totalRevenue * 15 / 100)) // Direct 15% increase to total for non-organic
        : totalRevenue + mobileRevenueIncrease + webRevenueIncrease + ctvRevenueIncrease + pcRevenueIncrease
      
      // Calculate the percentage increases
      const totalPercentIncreaseUsers = ((newTotalUsers - totalUsers) / totalUsers) * 100
      const totalPercentIncreasePurchases = ((newTotalPurchases - totalPurchases) / totalPurchases) * 100
      const totalPercentIncreaseRevenue = ((newTotalRevenue - totalRevenue) / totalRevenue) * 100
      
      // Store the individual platform percentages for display
      percentages[key] = {
        // Acquired users percentages
        total: isOrganic && layerType === "incrementality" ? 0 : parseFloat(totalPercentIncreaseUsers.toFixed(1)),
        mobile: layerType === "incrementality" ? 0 : mobileIncrease > 0 ? parseFloat((mobileIncrease / mobileUsers * 100).toFixed(1)) : 0,
        web: layerType === "incrementality" ? 0 : webIncrease > 0 ? parseFloat((webIncrease / webUsers * 100).toFixed(1)) : 0,
        ctv: layerType === "incrementality" ? 0 : ctvIncrease > 0 ? parseFloat((ctvIncrease / ctvUsers * 100).toFixed(1)) : 0,
        pc: layerType === "incrementality" ? 0 : pcIncrease > 0 ? parseFloat((pcIncrease / pcUsers * 100).toFixed(1)) : 0,
        
        // Purchases percentages
        purchasesTotal: isOrganic && layerType === "incrementality" ? 0 : parseFloat(totalPercentIncreasePurchases.toFixed(1)),
        purchasesMobile: layerType === "incrementality" ? 0 : mobilePurchaseIncrease > 0 ? parseFloat((mobilePurchaseIncrease / mobilePurchases * 100).toFixed(1)) : 0,
        purchasesWeb: layerType === "incrementality" ? 0 : webPurchaseIncrease > 0 ? parseFloat((webPurchaseIncrease / webPurchases * 100).toFixed(1)) : 0,
        purchasesCtv: layerType === "incrementality" ? 0 : ctvPurchaseIncrease > 0 ? parseFloat((ctvPurchaseIncrease / ctvPurchases * 100).toFixed(1)) : 0,
        purchasesPc: layerType === "incrementality" ? 0 : pcPurchaseIncrease > 0 ? parseFloat((pcPurchaseIncrease / pcPurchases * 100).toFixed(1)) : 0,
        
        // Revenue percentages
        revenueTotal: isOrganic && layerType === "incrementality" ? 0 : parseFloat(totalPercentIncreaseRevenue.toFixed(1)),
        revenueMobile: layerType === "incrementality" ? 0 : mobileRevenueIncrease > 0 ? parseFloat((mobileRevenueIncrease / mobileRevenue * 100).toFixed(1)) : 0,
        revenueWeb: layerType === "incrementality" ? 0 : webRevenueIncrease > 0 ? parseFloat((webRevenueIncrease / webRevenue * 100).toFixed(1)) : 0,
        revenueCtv: layerType === "incrementality" ? 0 : ctvRevenueIncrease > 0 ? parseFloat((ctvRevenueIncrease / ctvRevenue * 100).toFixed(1)) : 0,
        revenuePc: layerType === "incrementality" ? 0 : pcRevenueIncrease > 0 ? parseFloat((pcRevenueIncrease / pcRevenue * 100).toFixed(1)) : 0
      }
      
      result[key] = {
        ...value,
        acquiredUsers: {
          total: newTotalUsers.toLocaleString(),
          mobile: newMobileUsers.toLocaleString(),
          web: newWebUsers.toLocaleString(),
          ctv: newCtvUsers.toLocaleString(),
          pc: newPcUsers.toLocaleString(),
        },
        purchases: {
          total: newTotalPurchases.toLocaleString(),
          mobile: newMobilePurchases.toLocaleString(),
          web: newWebPurchases.toLocaleString(),
          ctv: newCtvPurchases.toLocaleString(),
          pc: newPcPurchases.toLocaleString(),
        },
        revenue: {
          total: newTotalRevenue.toLocaleString(),
          mobile: newMobileRevenue.toLocaleString(),
          web: newWebRevenue.toLocaleString(),
          ctv: newCtvRevenue.toLocaleString(),
          pc: newPcRevenue.toLocaleString(),
        }
      }
      
      if (value.subRows) {
        const { data: subRowsData, percentages: subRowsPercentages } = 
          calculateLayerImpact(value.subRows, layerType)
        
        result[key].subRows = subRowsData
        
        // Merge the sub-row percentages into the main percentages object
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
      // Most values below 100% (showing decrease), some above 100% (showing increase)
      const generateFactor = () => {
        return Math.random() > 0.2 
          ? 60 + Math.random() * 35 // 60-95% (decrease factor) - 80% chance
          : 100 + Math.random() * 50 // 100-150% (increase factor) - 20% chance
      }
      
      // For organic media sources, set all factors to 0
      const totalFactor = isOrganic ? 0 : generateFactor()
      
      // For incrementality, only generate factors for totals, set others to 0
      result[key] = {
        // Acquired users factors
        total: parseFloat(totalFactor.toFixed(1)),
        mobile: 0, // No incrementality factor for individual platforms
        web: 0,
        ctv: 0,
        pc: 0,
        
        // Purchases factors
        purchasesTotal: isOrganic ? 0 : parseFloat((totalFactor * 0.95).toFixed(1)),
        purchasesMobile: 0, // No incrementality factor for individual platforms
        purchasesWeb: 0,
        purchasesCtv: 0,
        purchasesPc: 0,
        
        // Revenue factors
        revenueTotal: isOrganic ? 0 : parseFloat((totalFactor * 1.05).toFixed(1)),
        revenueMobile: 0, // No incrementality factor for individual platforms
        revenueWeb: 0,
        revenueCtv: 0,
        revenuePc: 0
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
    const deviceTypes = ["Mobile", "Web", "CTV", "PC"]
    const mediaSources = ["Facebook Ads", "Organic", "Unity Ads", "Apple Search Ads", "Roku"]
    const campaigns = ["Summer Sale", "Holiday Special", "New User Promo", "Retention Campaign"]
    const adSets = ["Ad Set 1", "Ad Set 2", "Ad Set 3", "Ad Set 4"]
    const ads = ["Banner Ad", "Video Ad", "Interactive Ad", "Story Ad"]
    const dates = ["2025-02-23", "2025-02-24", "2025-02-25", "2025-02-26"]
    const attributionMethods = ["Last Click", "Last View", "First Click", "Multi-Touch"]

    // Create a mapping of dimension types to their values
    const dimensionValues: Record<Dimension, string[]> = {
      device_type: deviceTypes,
      media_source: mediaSources,
      campaign: campaigns,
      ad_set: adSets,
      ad: ads,
      date: dates,
      attribution_method: attributionMethods
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
        
        // Handle the Roku special case - only CTV device type
        const isRoku = primaryValue === "Roku"
        
        // Handle Facebook Ads special case - only Mobile and Web
        const isFacebookAds = primaryValue === "Facebook Ads"
        
        // Generate subrows for each secondary dimension value
        secondaryValues.forEach((secondaryValue, secondaryIndex) => {
          // Skip creating entries for non-CTV devices if this is Roku and secondary dimension is device_type
          if (isRoku && secondaryDimension === "device_type" && secondaryValue !== "CTV") {
            return; // Skip this iteration
          }
          
          // Skip creating entries for CTV and PC devices if this is Facebook Ads and secondary dimension is device_type
          if (isFacebookAds && secondaryDimension === "device_type" && (secondaryValue === "CTV" || secondaryValue === "PC")) {
            return; // Skip this iteration
          }
          
          // Generate some mock metrics based on indices for variety
          const baseValue = (primaryIndex + 1) * 1000 + (secondaryIndex + 1) * 100
          
          // Create distribution that favors the matching dimension
          // Default distribution (balanced across device types)
          let mobileUsers = 0
          let webUsers = 0 
          let ctvUsers = 0
          let pcUsers = 0
          
          // Set fixed values for Roku - distribute the 640 users among campaigns
          if (isRoku) {
            mobileUsers = 0
            webUsers = 0
            
            // Distribute the 640 CTV users among the campaigns
            if (secondaryDimension === "campaign") {
              // Distribute 640 users among campaigns
              if (secondaryValue === "Summer Sale") {
                ctvUsers = 160
              } else if (secondaryValue === "Holiday Special") {
                ctvUsers = 160
              } else if (secondaryValue === "New User Promo") {
                ctvUsers = 160
              } else if (secondaryValue === "Retention Campaign") {
                ctvUsers = 160
              } else {
                ctvUsers = 0
              }
            } else {
              // For other secondary dimensions, keep all users in CTV
              ctvUsers = 640
            }
            
            pcUsers = 0
          } else if (isFacebookAds) {
            // For Facebook Ads, only distribute to mobile and web (60/40 split)
            mobileUsers = Math.round(baseValue * 0.6)
            webUsers = Math.round(baseValue * 0.4)
            ctvUsers = 0 // No CTV for Facebook Ads
            pcUsers = 0  // No PC for Facebook Ads
          } else {
            // For non-Roku, non-Facebook media sources, use the regular distribution logic
            mobileUsers = Math.round(baseValue * 0.2)
            webUsers = Math.round(baseValue * 0.2)
            ctvUsers = Math.round(baseValue * 0.2)
            pcUsers = Math.round(baseValue * 0.2)
            
            // Adjust distribution based on secondary dimension
            if (secondaryDimension === "device_type") {
              // Apply the >90% rule for device type dimensions
              if (secondaryValue === "Mobile") {
                mobileUsers = Math.round(baseValue * 0.92)
                webUsers = Math.round(baseValue * 0.03)
                ctvUsers = Math.round(baseValue * 0.03)
                pcUsers = Math.round(baseValue * 0.02)
              } else if (secondaryValue === "Web") {
                mobileUsers = Math.round(baseValue * 0.03)
                webUsers = Math.round(baseValue * 0.92)
                ctvUsers = Math.round(baseValue * 0.03)
                pcUsers = Math.round(baseValue * 0.02)
              } else if (secondaryValue === "CTV") {
                mobileUsers = Math.round(baseValue * 0.03)
                webUsers = Math.round(baseValue * 0.02)
                ctvUsers = Math.round(baseValue * 0.95)
                pcUsers = 0
              } else if (secondaryValue === "PC") {
                mobileUsers = Math.round(baseValue * 0.02)
                webUsers = Math.round(baseValue * 0.03)
                ctvUsers = Math.round(baseValue * 0.03)
                pcUsers = Math.round(baseValue * 0.92)
              }
            }
          }
          
          const totalUsers = mobileUsers + webUsers + ctvUsers + pcUsers
          
          // Create purchases with conversion rates that maintain the device distribution
          // For Mobile device: 30% conversion
          const mobilePurchases = Math.round(mobileUsers * 0.3)
          // For Web device: 25% conversion 
          const webPurchases = Math.round(webUsers * 0.25)
          // For CTV device: 20% conversion
          const ctvPurchases = Math.round(ctvUsers * 0.2)
          // For PC device: 28% conversion
          const pcPurchases = Math.round(pcUsers * 0.28)
          const totalPurchases = mobilePurchases + webPurchases + ctvPurchases + pcPurchases
          
          // Create revenue based on purchases (average order value)
          const mobileRevenue = mobilePurchases * 50
          const webRevenue = webPurchases * 45
          const ctvRevenue = ctvPurchases * 80
          const pcRevenue = pcPurchases * 55
          const totalRevenue = mobileRevenue + webRevenue + ctvRevenue + pcRevenue
          
          subRows[secondaryValue] = {
            cost: (baseValue * 10).toLocaleString(),
            impressions: (baseValue * 300).toLocaleString(),
            clicks: (baseValue * 3).toLocaleString(),
            purchases: {
              total: totalPurchases.toLocaleString(),
              mobile: mobilePurchases.toLocaleString(),
              web: webPurchases.toLocaleString(),
              ctv: ctvPurchases.toLocaleString(),
              pc: pcPurchases.toLocaleString(),
            },
            revenue: {
              total: totalRevenue.toLocaleString(),
              mobile: mobileRevenue.toLocaleString(),
              web: webRevenue.toLocaleString(),
              ctv: ctvRevenue.toLocaleString(),
              pc: pcRevenue.toLocaleString(),
            },
            acquiredUsers: {
              total: totalUsers.toLocaleString(),
              mobile: mobileUsers.toLocaleString(),
              web: webUsers.toLocaleString(),
              ctv: ctvUsers.toLocaleString(),
              pc: pcUsers.toLocaleString(),
            }
          }
        })
        
        // Create the primary dimension entry with aggregated metrics
        const totalValue = (primaryIndex + 1) * 1000 * secondaryValues.length
        
        // Fixed values for Roku at the parent level
        let mobileUsers = 0
        let webUsers = 0 
        let ctvUsers = 0
        let pcUsers = 0
        
        // Handle Facebook Ads special case at parent level
        const parentIsFacebookAds = primaryValue === "Facebook Ads"
        
        // Set fixed values for Roku or use distribution for other media sources
        if (isRoku) {
          mobileUsers = 0
          webUsers = 0
          
          // For Roku, the parent row should reflect the sum of the campaign distributions
          if (secondaryDimension === "campaign") {
            ctvUsers = 640 // Total of 640 distributed among campaigns
          } else {
            ctvUsers = 640
          }
          
          pcUsers = 0
        } else if (parentIsFacebookAds) {
          // For Facebook Ads, only distribute to mobile and web (60/40 split)
          mobileUsers = Math.round(totalValue * 0.6)
          webUsers = Math.round(totalValue * 0.4)
          ctvUsers = 0 // No CTV for Facebook Ads
          pcUsers = 0  // No PC for Facebook Ads
        } else {
          // Create distribution that favors the matching dimension
          // Default distribution for non-Roku
          mobileUsers = Math.round(totalValue * 0.15)
          webUsers = Math.round(totalValue * 0.15)
          ctvUsers = Math.round(totalValue * 0.15)
          pcUsers = Math.round(totalValue * 0.15)
          
          // Adjust distribution based on primary dimension
          if (primaryDimension === "device_type") {
            if (primaryValue === "Mobile") {
              mobileUsers = Math.round(totalValue * 0.92)
              webUsers = Math.round(totalValue * 0.03)
              ctvUsers = Math.round(totalValue * 0.03)
              pcUsers = Math.round(totalValue * 0.02)
            } else if (primaryValue === "Web") {
              mobileUsers = Math.round(totalValue * 0.03)
              webUsers = Math.round(totalValue * 0.92)
              ctvUsers = Math.round(totalValue * 0.03)
              pcUsers = Math.round(totalValue * 0.02)
            } else if (primaryValue === "CTV") {
              mobileUsers = Math.round(totalValue * 0.03)
              webUsers = Math.round(totalValue * 0.02)
              ctvUsers = Math.round(totalValue * 0.95)
              pcUsers = 0
            } else if (primaryValue === "PC") {
              mobileUsers = Math.round(totalValue * 0.02)
              webUsers = Math.round(totalValue * 0.03)
              ctvUsers = Math.round(totalValue * 0.03)
              pcUsers = Math.round(totalValue * 0.92)
            }
          }
        }
        
        const totalUsers = mobileUsers + webUsers + ctvUsers + pcUsers
        
        // Create purchases with conversion rates
        const mobilePurchases = Math.round(mobileUsers * 0.3)
        const webPurchases = Math.round(webUsers * 0.25)
        const ctvPurchases = Math.round(ctvUsers * 0.2)
        const pcPurchases = Math.round(pcUsers * 0.28)
        const totalPurchases = mobilePurchases + webPurchases + ctvPurchases + pcPurchases
        
        // Create revenue based on purchases (average order value)
        const mobileRevenue = mobilePurchases * 50
        const webRevenue = webPurchases * 45
        const ctvRevenue = ctvPurchases * 80
        const pcRevenue = pcPurchases * 55
        const totalRevenue = mobileRevenue + webRevenue + ctvRevenue + pcRevenue
        
        // Only add the entry if there are actual sub-rows (relevant for Roku)
        if (Object.keys(subRows).length > 0 || !isRoku) {
          result[primaryValue] = {
            cost: (totalValue * 10).toLocaleString(),
            impressions: (totalValue * 300).toLocaleString(),
            clicks: (totalValue * 3).toLocaleString(),
            purchases: {
              total: totalPurchases.toLocaleString(),
              mobile: mobilePurchases.toLocaleString(),
              web: webPurchases.toLocaleString(),
              ctv: ctvPurchases.toLocaleString(),
              pc: pcPurchases.toLocaleString(),
            },
            revenue: {
              total: totalRevenue.toLocaleString(),
              mobile: mobileRevenue.toLocaleString(),
              web: webRevenue.toLocaleString(),
              ctv: ctvRevenue.toLocaleString(),
              pc: pcRevenue.toLocaleString(),
            },
            acquiredUsers: {
              total: totalUsers.toLocaleString(),
              mobile: mobileUsers.toLocaleString(),
              web: webUsers.toLocaleString(),
              ctv: ctvUsers.toLocaleString(),
              pc: pcUsers.toLocaleString(),
            },
            subRows: Object.keys(subRows).length > 0 ? subRows : undefined
          }
        }
      })
      
      return result
    }
    
    // Use cost engine data if available, otherwise generate mock data
    const mockData = costData ? transformCostDataToTableFormat(costData) : generateMockData(groupBy[0], groupBySecondary)
    
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
  }, [groupBy, groupBySecondary, selectedLayers, costData])

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

    // We're no longer conditionally hiding devices, instead showing all with 0 values
    const isRoku = key === "Roku"

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

    // Helper to render incrementality factors
    const renderIncrementalityFactor = (factor: number) => {
      if (!factor) return null;
      
      const isIncrease = factor >= 100;
      
      return (
        <div className={`flex items-center ml-1 ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
          {isIncrease ? (
            // Up-right arrow for increases (≥ 100%)
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            // Down-right arrow for decreases (< 100%)
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
          
          {/* Acquired Users columns */}
          {acquiredUsersExpanded ? (
            <>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.total ? (
                  <ErrorTooltip factor={currentErrorFactors.total}>
                    <div className="flex items-center justify-center">
                      {data.acquiredUsers.total}
                      {renderIncrementalityFactor(currentErrorFactors.total)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.acquiredUsers.total}
                    {showArrows && currentPercentages.total > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.total}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.mobile ? (
                  <ErrorTooltip factor={currentErrorFactors.mobile}>
                    <div className="flex items-center justify-center">
                      {data.acquiredUsers.mobile}
                      {renderIncrementalityFactor(currentErrorFactors.mobile)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.acquiredUsers.mobile}
                    {showArrows && currentPercentages.mobile > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.mobile}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.web ? (
                  <ErrorTooltip factor={currentErrorFactors.web}>
                    <div className="flex items-center justify-center">
                      {data.acquiredUsers.web}
                      {renderIncrementalityFactor(currentErrorFactors.web)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.acquiredUsers.web}
                    {showArrows && currentPercentages.web > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.web}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.ctv ? (
                  <ErrorTooltip factor={currentErrorFactors.ctv}>
                    <div className="flex items-center justify-center">
                      {data.acquiredUsers.ctv}
                      {renderIncrementalityFactor(currentErrorFactors.ctv)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.acquiredUsers.ctv}
                    {showArrows && currentPercentages.ctv > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.ctv}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50 border-r" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.pc ? (
                  <ErrorTooltip factor={currentErrorFactors.pc}>
                    <div className="flex items-center justify-center">
                      {data.acquiredUsers.pc}
                      {renderIncrementalityFactor(currentErrorFactors.pc)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.acquiredUsers.pc}
                    {showArrows && currentPercentages.pc > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.pc}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
            </>
          ) : (
            <td className="text-center px-4 py-2 min-w-[120px] border-r" style={{ display: 'none' }}>
              {showErrorFactors && currentErrorFactors.total ? (
                <ErrorTooltip factor={currentErrorFactors.total}>
                  <div className="flex items-center justify-center">
                    {data.acquiredUsers.total}
                    {renderIncrementalityFactor(currentErrorFactors.total)}
                  </div>
                </ErrorTooltip>
              ) : (
                <div className="flex items-center justify-center">
                  {data.acquiredUsers.total}
                  {showArrows && currentPercentages.total > 0 && (
                    <div className="flex items-center ml-1 text-green-500">
                      <ArrowUpRight className="h-3 w-3" />
                      <span className="text-xs ml-0.5">{currentPercentages.total}%</span>
                    </div>
                  )}
                </div>
              )}
            </td>
          )}
          
          <td className="text-right px-2 py-2 border-l">{data.cost}</td>
          <td className="text-right px-4 py-2 border-r" style={{ display: 'none' }}>{data.impressions}</td>
          <td className="text-right px-4 py-2 border-r" style={{ display: 'none' }}>{data.clicks}</td>
          
          {/* Purchases columns */}
          {purchasesExpanded ? (
            <>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.purchasesTotal ? (
                  <ErrorTooltip factor={currentErrorFactors.purchasesTotal}>
                    <div className="flex items-center justify-center">
                      {data.purchases.total}
                      {renderIncrementalityFactor(currentErrorFactors.purchasesTotal)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.purchases.total}
                    {showArrows && currentPercentages.purchasesTotal > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.purchasesTotal}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.purchasesMobile ? (
                  <ErrorTooltip factor={currentErrorFactors.purchasesMobile}>
                    <div className="flex items-center justify-center">
                      {data.purchases.mobile}
                      {renderIncrementalityFactor(currentErrorFactors.purchasesMobile)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.purchases.mobile}
                    {showArrows && currentPercentages.purchasesMobile > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.purchasesMobile}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.purchasesWeb ? (
                  <ErrorTooltip factor={currentErrorFactors.purchasesWeb}>
                    <div className="flex items-center justify-center">
                      {data.purchases.web}
                      {renderIncrementalityFactor(currentErrorFactors.purchasesWeb)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.purchases.web}
                    {showArrows && currentPercentages.purchasesWeb > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.purchasesWeb}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.purchasesCtv ? (
                  <ErrorTooltip factor={currentErrorFactors.purchasesCtv}>
                    <div className="flex items-center justify-center">
                      {data.purchases.ctv}
                      {renderIncrementalityFactor(currentErrorFactors.purchasesCtv)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.purchases.ctv}
                    {showArrows && currentPercentages.purchasesCtv > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.purchasesCtv}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50 border-r" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.purchasesPc ? (
                  <ErrorTooltip factor={currentErrorFactors.purchasesPc}>
                    <div className="flex items-center justify-center">
                      {data.purchases.pc}
                      {renderIncrementalityFactor(currentErrorFactors.purchasesPc)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.purchases.pc}
                    {showArrows && currentPercentages.purchasesPc > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.purchasesPc}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
            </>
          ) : (
            <td className="text-center px-4 py-2 min-w-[120px] border-r" style={{ display: 'none' }}>
              {showErrorFactors && currentErrorFactors.purchasesTotal ? (
                <ErrorTooltip factor={currentErrorFactors.purchasesTotal}>
                  <div className="flex items-center justify-center">
                    {data.purchases.total}
                    {renderIncrementalityFactor(currentErrorFactors.purchasesTotal)}
                  </div>
                </ErrorTooltip>
              ) : (
                <div className="flex items-center justify-center">
                  {data.purchases.total}
                  {showArrows && currentPercentages.purchasesTotal > 0 && (
                    <div className="flex items-center ml-1 text-green-500">
                      <ArrowUpRight className="h-3 w-3" />
                      <span className="text-xs ml-0.5">{currentPercentages.purchasesTotal}%</span>
                    </div>
                  )}
                </div>
              )}
            </td>
          )}
          
          {/* Revenue columns */}
          {revenueExpanded ? (
            <>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.revenueTotal ? (
                  <ErrorTooltip factor={currentErrorFactors.revenueTotal}>
                    <div className="flex items-center justify-center">
                      {data.revenue.total}
                      {renderIncrementalityFactor(currentErrorFactors.revenueTotal)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.revenue.total}
                    {showArrows && currentPercentages.revenueTotal > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.revenueTotal}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.revenueMobile ? (
                  <ErrorTooltip factor={currentErrorFactors.revenueMobile}>
                    <div className="flex items-center justify-center">
                      {data.revenue.mobile}
                      {renderIncrementalityFactor(currentErrorFactors.revenueMobile)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.revenue.mobile}
                    {showArrows && currentPercentages.revenueMobile > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.revenueMobile}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.revenueWeb ? (
                  <ErrorTooltip factor={currentErrorFactors.revenueWeb}>
                    <div className="flex items-center justify-center">
                      {data.revenue.web}
                      {renderIncrementalityFactor(currentErrorFactors.revenueWeb)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.revenue.web}
                    {showArrows && currentPercentages.revenueWeb > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.revenueWeb}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.revenueCtv ? (
                  <ErrorTooltip factor={currentErrorFactors.revenueCtv}>
                    <div className="flex items-center justify-center">
                      {data.revenue.ctv}
                      {renderIncrementalityFactor(currentErrorFactors.revenueCtv)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.revenue.ctv}
                    {showArrows && currentPercentages.revenueCtv > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.revenueCtv}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>
                {showErrorFactors && currentErrorFactors.revenuePc ? (
                  <ErrorTooltip factor={currentErrorFactors.revenuePc}>
                    <div className="flex items-center justify-center">
                      {data.revenue.pc}
                      {renderIncrementalityFactor(currentErrorFactors.revenuePc)}
                    </div>
                  </ErrorTooltip>
                ) : (
                  <div className="flex items-center justify-center">
                    {data.revenue.pc}
                    {showArrows && currentPercentages.revenuePc > 0 && (
                      <div className="flex items-center ml-1 text-green-500">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs ml-0.5">{currentPercentages.revenuePc}%</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
            </>
          ) : (
            <td className="text-center px-4 py-2 min-w-[120px]" style={{ display: 'none' }}>
              {showErrorFactors && currentErrorFactors.revenueTotal ? (
                <ErrorTooltip factor={currentErrorFactors.revenueTotal}>
                  <div className="flex items-center justify-center">
                    {data.revenue.total}
                    {renderIncrementalityFactor(currentErrorFactors.revenueTotal)}
                  </div>
                </ErrorTooltip>
              ) : (
                <div className="flex items-center justify-center">
                  {data.revenue.total}
                  {showArrows && currentPercentages.revenueTotal > 0 && (
                    <div className="flex items-center ml-1 text-green-500">
                      <ArrowUpRight className="h-3 w-3" />
                      <span className="text-xs ml-0.5">{currentPercentages.revenueTotal}%</span>
                    </div>
                  )}
                </div>
              )}
            </td>
          )}
        </tr>
        {isExpanded &&
          hasSubRows &&
          Object.entries(data.subRows).map(([subKey, subData]) => renderRow(subKey, subData as any, depth + 1, key))}
      </React.Fragment>
    )
  }

  // Transform cost engine data to table format
  const transformCostDataToTableFormat = (costData: CostEngineResult): TableData => {
    const result: TableData = {}
    
    Object.entries(costData.tableRows).forEach(([key, row]) => {
      // For app grouping, show "NA" for zero costs, otherwise show the cost
      const costDisplay = (groupBy[0] === 'app' && row.cost === 0) ? "NA" : row.cost.toString();
      
      result[key] = {
        total: costDisplay,
        cost: costDisplay,
        impressions: "0", // Hidden anyway
        clicks: "0", // Hidden anyway
        purchases: {
          total: "0",
          mobile: "0",
          web: "0",
          ctv: "0",
          pc: "0"
        },
        revenue: {
          total: "0",
          mobile: "0",
          web: "0",
          ctv: "0",
          pc: "0"
        },
        acquiredUsers: {
          total: "0",
          mobile: "0",
          web: "0",
          ctv: "0",
          pc: "0"
        },
        subRows: row.subRows ? transformSubRows(row.subRows) : undefined
      }
    })
    
    return result
  }

  const transformSubRows = (subRows: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {}
    
    Object.entries(subRows).forEach(([key, row]) => {
      // For campaign sub-rows, show "NA" for zero costs, otherwise show the cost
      const costDisplay = (groupBySecondary === 'campaign' && row.cost === 0) ? "NA" : row.cost.toString();
      
      result[key] = {
        total: costDisplay,
        cost: costDisplay,
        impressions: "0",
        clicks: "0",
        purchases: {
          total: "0",
          mobile: "0",
          web: "0",
          ctv: "0",
          pc: "0"
        },
        revenue: {
          total: "0",
          mobile: "0",
          web: "0",
          ctv: "0",
          pc: "0"
        },
        acquiredUsers: {
          total: "0",
          mobile: "0",
          web: "0",
          ctv: "0",
          pc: "0"
        }
      }
    })
    
    return result
  }

  // Get dimension label for display
  const getDimensionLabel = (dimension: string): string => {
    const dimensionMap: Record<string, string> = {
      device_type: "Device Type",
      media_source: "Media Source",
      date: "Date",
      campaign: "Campaign",
      ad_set: "Ad Set",
      ad: "Ad",
      attribution_method: "Attribution Method",
      app: "App"
    }
    return dimensionMap[dimension] || dimension
  }

  return (
    <div className="w-full max-w-md">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left font-medium text-gray-500 px-4 py-2 w-auto" 
                  rowSpan={acquiredUsersExpanded || purchasesExpanded || revenueExpanded ? 2 : 1}>
                {getDimensionLabel(groupBy[0])}
              </th>
              
              {/* Acquired Users header */}
              {acquiredUsersExpanded ? (
                <th className="text-center font-medium text-gray-500 px-4 py-3 border-b-0 bg-gray-50" colSpan={5} style={{ display: 'none' }}>
                  <div className="flex items-center justify-center">
                    <span>Acquired Users</span>
                    <button onClick={toggleAcquiredUsers} className="ml-1">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ) : (
                <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] border-r"
                    rowSpan={purchasesExpanded || revenueExpanded ? 2 : 1} style={{ display: 'none' }}>
                  <div className="flex items-center justify-center">
                    <span>Acquired Users</span>
                    <button onClick={toggleAcquiredUsers} className="ml-1">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              )}
              
              <th className="text-right font-medium text-gray-500 px-2 py-2 w-auto border-l" 
                  rowSpan={acquiredUsersExpanded || purchasesExpanded || revenueExpanded ? 2 : 1}>
                Cost
              </th>
              <th className="text-right font-medium text-gray-500 px-4 py-2 min-w-[100px] border-r" 
                  rowSpan={acquiredUsersExpanded || purchasesExpanded || revenueExpanded ? 2 : 1}
                  style={{ display: 'none' }}>
                Impressions
              </th>
              <th className="text-right font-medium text-gray-500 px-4 py-2 min-w-[100px] border-r" 
                  rowSpan={acquiredUsersExpanded || purchasesExpanded || revenueExpanded ? 2 : 1}
                  style={{ display: 'none' }}>
                Clicks
              </th>
              
              {/* Purchases header */}
              {purchasesExpanded ? (
                <th className="text-center font-medium text-gray-500 px-4 py-3 border-b-0 bg-gray-50" colSpan={5}
                    style={{ display: 'none' }}>
                  <div className="flex items-center justify-center">
                    <span>Purchases</span>
                    <button onClick={togglePurchases} className="ml-1">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ) : (
                <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] border-r"
                    rowSpan={acquiredUsersExpanded || revenueExpanded ? 2 : 1}
                    style={{ display: 'none' }}>
                  <div className="flex items-center justify-center">
                    <span>Purchases</span>
                    <button onClick={togglePurchases} className="ml-1">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              )}
              
              {/* Revenue header */}
              {revenueExpanded ? (
                <th className="text-center font-medium text-gray-500 px-4 py-3 border-b-0 bg-gray-50" colSpan={5}
                    style={{ display: 'none' }}>
                  <div className="flex items-center justify-center">
                    <span>Revenue</span>
                    <button onClick={toggleRevenue} className="ml-1">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ) : (
                <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px]"
                    rowSpan={acquiredUsersExpanded || purchasesExpanded ? 2 : 1}
                    style={{ display: 'none' }}>
                  <div className="flex items-center justify-center">
                    <span>Revenue</span>
                    <button onClick={toggleRevenue} className="ml-1">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              )}
            </tr>
            
            {/* Sub-headers */}
            {(acquiredUsersExpanded || purchasesExpanded || revenueExpanded) && (
              <tr className="border-b bg-gray-50">
                {acquiredUsersExpanded && (
                  <>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>Total</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>Mobile</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>Web</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>CTV</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50 border-r" style={{ display: 'none' }}>PC</th>
                  </>
                )}
                
                {purchasesExpanded && (
                  <>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>Total</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>Mobile</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>Web</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>CTV</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50 border-r" style={{ display: 'none' }}>PC</th>
                  </>
                )}
                
                {revenueExpanded && (
                  <>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>Total</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>Mobile</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>Web</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>CTV</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2 min-w-[120px] bg-gray-50" style={{ display: 'none' }}>PC</th>
                  </>
                )}
              </tr>
            )}
          </thead>
          <tbody>
            {/* Totals row */}
            {costData && (
              <tr className="border-b bg-blue-50 font-semibold">
                <td className="px-4 py-2">Total</td>
                <td className="text-right px-2 py-2">{costData.totalCost}</td>
              </tr>
            )}
            {Object.entries(tableData).map(([key, data]) => renderRow(key, data))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

