"use client"

import React, { useState } from "react"
import {
  ChevronDown,
  X,
  Tv,
  Monitor,
  Globe,
  Smartphone,
  ArrowRight,
  InfoIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"

// Types for our mock data
type DeviceType = "Mobile" | "Web" | "TV" | "PC"

interface JourneyData {
  impressions: {
    [key in DeviceType]?: {
      count: number
      clicks: number
      campaigns: { name: string; location: string; count: number }[]
    }
  }
  acquisitions: {
    [key in DeviceType]?: {
      count: number
      fromImpressions: {
        [key in DeviceType]?: number
      }
    }
  }
  conversions: {
    purchases: {
      [key in DeviceType]?: {
        count: number
        revenue: number
        fromAcquisitions: {
          [key in DeviceType]?: number
        }
      }
    }
  }
}

// Mock data for user journeys
const mockJourneyData: JourneyData = {
  impressions: {
    Mobile: {
      count: 45000,
      clicks: 3200,
      campaigns: [
        { name: "Summer Sale", location: "US", count: 25000 },
        { name: "New Features", location: "Global", count: 20000 },
      ],
    },
    TV: {
      count: 12000,
      clicks: 900,
      campaigns: [
        { name: "Premium Content", location: "US", count: 7000 },
        { name: "Holiday Special", location: "EU", count: 5000 },
      ],
    },
    Web: {
      count: 30000,
      clicks: 2100,
      campaigns: [
        { name: "Blog Promotion", location: "Global", count: 18000 },
        { name: "Search Ads", location: "US, EU", count: 12000 },
      ],
    },
    PC: {
      count: 8000,
      clicks: 450,
      campaigns: [
        { name: "Desktop App", location: "US", count: 5000 },
        { name: "Gaming Integration", location: "Global", count: 3000 },
      ],
    },
  },
  acquisitions: {
    Mobile: {
      count: 4200,
      fromImpressions: {
        Mobile: 2800,
        TV: 1400,
      },
    },
    Web: {
      count: 1800,
      fromImpressions: {
        Web: 800,
        Mobile: 600,
        TV: 400,
      },
    },
    PC: {
      count: 600,
      fromImpressions: {
        Web: 600,
      },
    },
  },
  conversions: {
    purchases: {
      Mobile: {
        count: 2500,
        revenue: 50000,
        fromAcquisitions: {
          Mobile: 2000,
          Web: 500,
        },
      },
      Web: {
        count: 1200,
        revenue: 36000,
        fromAcquisitions: {
          Web: 800,
          Mobile: 400,
        },
      },
      PC: {
        count: 400,
        revenue: 16000,
        fromAcquisitions: {
          PC: 400,
        },
      },
    },
  },
}

// Component for device icon
const DeviceIcon: React.FC<{ deviceType: DeviceType; size?: number }> = ({ deviceType, size = 4 }) => {
  const sizeClass = `h-${size} w-${size}`
  
  switch (deviceType) {
    case "Mobile":
      return <Smartphone className={sizeClass} />
    case "Web":
      return <Globe className={sizeClass} />
    case "TV":
      return <Tv className={sizeClass} />
    case "PC":
      return <Monitor className={sizeClass} />
    default:
      return <Globe className={sizeClass} />
  }
}

// Get background color based on device type
const getDeviceColor = (deviceType: DeviceType) => {
  switch (deviceType) {
    case "Mobile":
      return "bg-blue-500"
    case "Web":
      return "bg-purple-500"
    case "TV":
      return "bg-red-500"
    case "PC":
      return "bg-green-500"
    default:
      return "bg-gray-500"
  }
}

export function UserJourneysButton() {
  const [open, setOpen] = useState(false)
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-[13px] font-normal h-8"
        onClick={() => setOpen(true)}
      >
        View User Journeys
      </Button>

      <UserJourneysModal open={open} setOpen={setOpen} />
    </>
  )
}

interface UserJourneysModalProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function UserJourneysModal({ open, setOpen }: UserJourneysModalProps) {
  const [selectedAcquisitionDevice, setSelectedAcquisitionDevice] = useState<DeviceType>("Mobile")
  const [conversionMetric, setConversionMetric] = useState<"purchases" | "revenue">("purchases")
  
  const allDevices: DeviceType[] = ["Mobile", "Web", "TV", "PC"]
  
  const handleDeviceSelect = (device: DeviceType) => {
    setSelectedAcquisitionDevice(device)
  }
  
  // Find all impression devices that contribute to the selected acquisition device
  const getImpressionDevices = (): DeviceType[] => {
    const devices: Set<DeviceType> = new Set()
    
    const impressionSources = mockJourneyData.acquisitions[selectedAcquisitionDevice]?.fromImpressions || {}
    Object.keys(impressionSources).forEach(source => devices.add(source as DeviceType))
    
    return Array.from(devices)
  }
  
  // Find all conversion devices that are influenced by the selected acquisition device
  const getConversionDevices = (): DeviceType[] => {
    const devices: Set<DeviceType> = new Set()
    
    Object.entries(mockJourneyData.conversions.purchases).forEach(([conversionDevice, data]) => {
      const acquisitionSources = Object.keys(data.fromAcquisitions)
      const hasSelectedSource = acquisitionSources.includes(selectedAcquisitionDevice)
      
      if (hasSelectedSource) {
        devices.add(conversionDevice as DeviceType)
      }
    })
    
    return Array.from(devices)
  }
  
  // Get source devices that contribute to a target device
  const getContributingSources = (targetDevice: DeviceType, stage: 'impression-to-acquisition' | 'acquisition-to-conversion'): DeviceType[] => {
    if (stage === 'impression-to-acquisition') {
      return Object.keys(mockJourneyData.acquisitions[targetDevice]?.fromImpressions || {}) as DeviceType[]
    } else {
      return [selectedAcquisitionDevice].filter(acqDevice => 
        Object.keys(mockJourneyData.conversions.purchases[targetDevice]?.fromAcquisitions || {})
          .includes(acqDevice)
      )
    }
  }
  
  // Get the impression devices to display
  const impressionDevices = getImpressionDevices()
  
  // Get the conversion devices to display
  const conversionDevices = getConversionDevices()
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Cross-Device User Journeys</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Acquisition devices selector */}
          <div className="flex items-center space-x-4">
            <Label htmlFor="assets">Select acquisition device to display:</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between text-left font-normal"
                >
                  {selectedAcquisitionDevice}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]">
                {allDevices.map(device => (
                  <DropdownMenuItem
                    key={device}
                    onClick={() => handleDeviceSelect(device)}
                    className={selectedAcquisitionDevice === device ? "bg-accent" : ""}
                  >
                    <div className="flex items-center">
                      <div className={`h-4 w-4 mr-2 ${getDeviceColor(device)} rounded-sm flex items-center justify-center text-white`}>
                        {device === "Mobile" && <Smartphone className="h-3 w-3" />}
                        {device === "Web" && <Globe className="h-3 w-3" />}
                        {device === "TV" && <Tv className="h-3 w-3" />}
                        {device === "PC" && <Monitor className="h-3 w-3" />}
                      </div>
                      {device}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between text-left font-normal"
                  >
                    Conversion metric: {conversionMetric === "purchases" ? "Purchases" : "Revenue"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setConversionMetric("purchases")}>
                    Purchases
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConversionMetric("revenue")}>
                    Revenue
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Journey diagram */}
          <div className="border rounded-md p-4">
            <div className="relative w-full" style={{ minHeight: "400px" }}>
              <div className="grid grid-cols-3 gap-6 relative">
                {/* Ad Impressions */}
                <div className="space-y-4">
                  <div className="text-center font-medium text-gray-700 bg-gray-50 py-2 rounded-md">
                    Ad Impressions
                  </div>
                  <div className="flex flex-col items-center space-y-6">
                    {impressionDevices.map((device) => {
                      const data = mockJourneyData.impressions[device]
                      if (!data) return null
                      
                      // Calculate total (impressions + clicks)
                      const totalInteractions = data.count + data.clicks
                      
                      return (
                        <div key={`impression-${device}`} className="relative flex flex-col items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={`${getDeviceColor(device)} text-white p-4 rounded-full relative`}
                                  id={`impression-${device}-node`}
                                  data-device-type={device}
                                >
                                  <DeviceIcon deviceType={device} size={6} />
                                  <div className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full px-1.5 py-0.5 border">
                                    <InfoIcon className="h-3 w-3" />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="w-64">
                                <div className="space-y-2">
                                  <div className="font-bold">{device} Ad Impressions</div>
                                  <div className="grid grid-cols-2 gap-x-2 text-sm">
                                    <span>Total:</span>
                                    <span className="font-semibold">{totalInteractions.toLocaleString()}</span>
                                    <span>Impressions:</span>
                                    <span className="font-semibold">{data.count.toLocaleString()}</span>
                                    <span>Clicks:</span>
                                    <span className="font-semibold">{data.clicks.toLocaleString()}</span>
                                  </div>
                                  <div className="text-sm font-semibold mt-1">Campaigns:</div>
                                  {data.campaigns.map((campaign, idx) => (
                                    <div key={idx} className="text-xs border-t pt-1">
                                      <div className="font-medium">{campaign.name}</div>
                                      <div className="flex justify-between">
                                        <span>Location: {campaign.location}</span>
                                        <span>{campaign.count.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="text-xs text-gray-500 mt-1">
                                    Connected to: {mockJourneyData.acquisitions[selectedAcquisitionDevice]?.fromImpressions[device] ? selectedAcquisitionDevice : ''}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="mt-2 text-center">
                            <div className="font-semibold">{device}</div>
                            <div className="text-sm">{totalInteractions.toLocaleString()}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Acquired Users */}
                <div className="space-y-4">
                  <div className="text-center font-medium text-gray-700 bg-gray-50 py-2 rounded-md">
                    Acquired Users
                  </div>
                  <div className="flex flex-col items-center space-y-6">
                    {/* Render the selected acquisition device */}
                    {(() => {
                      const acquisitionData = mockJourneyData.acquisitions[selectedAcquisitionDevice]
                      if (!acquisitionData) return null
                      
                      // Get all impression sources that contribute to this acquisition
                      const sourcesFromImpressions = getContributingSources(selectedAcquisitionDevice, 'impression-to-acquisition')
                      
                      return (
                        <div key={`acquisition-${selectedAcquisitionDevice}`} className="relative flex flex-col items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={`${getDeviceColor(selectedAcquisitionDevice)} text-white p-4 rounded-full relative`}
                                  id={`acquisition-${selectedAcquisitionDevice}-node`}
                                  data-device-type={selectedAcquisitionDevice}
                                >
                                  <DeviceIcon deviceType={selectedAcquisitionDevice} size={6} />
                                  <div className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full px-1.5 py-0.5 border">
                                    <InfoIcon className="h-3 w-3" />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="w-64">
                                <div className="space-y-2">
                                  <div className="font-bold">{selectedAcquisitionDevice} Acquisitions</div>
                                  <div className="grid grid-cols-2 gap-x-2 text-sm">
                                    <span>Total Acquired:</span>
                                    <span className="font-semibold">{acquisitionData.count.toLocaleString()}</span>
                                  </div>
                                  <div className="text-sm font-semibold mt-1">From Ad Impressions:</div>
                                  {Object.entries(acquisitionData.fromImpressions)
                                    .map(([fromDevice, count], idx) => (
                                      <div key={idx} className="text-xs border-t pt-1 flex justify-between">
                                        <span>From {fromDevice}:</span>
                                        <span className="font-medium">{count.toLocaleString()}</span>
                                      </div>
                                    ))
                                  }
                                  <div className="text-xs text-gray-500 mt-1">
                                    Influences conversions in: {conversionDevices.join(', ')}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="mt-2 text-center">
                            <div className="font-semibold">{selectedAcquisitionDevice}</div>
                            <div className="text-sm">{acquisitionData.count.toLocaleString()}</div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
                
                {/* Conversions */}
                <div className="space-y-4">
                  <div className="text-center font-medium text-gray-700 bg-gray-50 py-2 rounded-md">
                    Conversions {conversionMetric === "revenue" && "(Revenue)"}
                  </div>
                  <div className="flex flex-col items-center space-y-6">
                    {/* Render conversion devices that are influenced by selected acquisition device */}
                    {conversionDevices.map((device) => {
                      const conversionData = mockJourneyData.conversions.purchases[device]
                      if (!conversionData) return null
                      
                      // Get all acquisition sources that contribute to this conversion
                      const sourcesFromAcquisitions = getContributingSources(device, 'acquisition-to-conversion')
                      
                      return (
                        <div key={`conversion-${device}`} className="relative flex flex-col items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={`${getDeviceColor(device)} text-white p-4 rounded-full relative`}
                                  id={`conversion-${device}-node`}
                                  data-device-type={device}
                                >
                                  <DeviceIcon deviceType={device} size={6} />
                                  <div className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full px-1.5 py-0.5 border">
                                    <InfoIcon className="h-3 w-3" />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="w-64">
                                <div className="space-y-2">
                                  <div className="font-bold">{device} Conversions</div>
                                  <div className="grid grid-cols-2 gap-x-2 text-sm">
                                    <span>Purchases:</span>
                                    <span className="font-semibold">{conversionData.count.toLocaleString()}</span>
                                    <span>Revenue:</span>
                                    <span className="font-semibold">${conversionData.revenue.toLocaleString()}</span>
                                  </div>
                                  <div className="text-sm font-semibold mt-1">From Acquisitions:</div>
                                  {Object.entries(conversionData.fromAcquisitions)
                                    .filter(([fromDevice]) => fromDevice === selectedAcquisitionDevice)
                                    .map(([fromDevice, count], idx) => (
                                      <div key={idx} className="text-xs border-t pt-1 flex justify-between">
                                        <span>From {fromDevice}:</span>
                                        <span className="font-medium">{count.toLocaleString()}</span>
                                      </div>
                                    ))
                                  }
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="mt-2 text-center">
                            <div className="font-semibold">{device}</div>
                            <div className="text-sm">
                              {conversionMetric === "purchases" 
                                ? conversionData.count.toLocaleString() 
                                : `$${conversionData.revenue.toLocaleString()}`}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 