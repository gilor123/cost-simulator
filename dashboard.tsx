"use client"

import React, { useState, useEffect } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  HelpCircle,
  Info,
  Search,
  Settings,
  Share2,
  User,
  Tv,
  Monitor,
  Globe,
  Smartphone,
  Layers,
  Calendar,
  Target,
  Image,
  Activity,
  Apple,
  SmartphoneIcon as Android,
  ArrowRight,
  Download,
  Music,
  Film,
  Gamepad2,
  CheckIcon,
  Filter,
  Plus,
  Share,
  Database,
  BarChart2,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AppSelector } from "@/components/ui/app-selector"

import { EnhancedTable } from "@/components/enhanced-table"
import { DeviceLevelTable } from "@/components/device-level-table"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { processCostData, type DatabaseRecord } from "@/utils/cost-engine"
import { TableLoader } from "@/components/ui/table-loader"


export default function Dashboard() {
  const [selectedApps, setSelectedApps] = useState<string[]>(["Wolt iOS", "Wolt Android"])
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])
  const [visibleLayer, setVisibleLayer] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<string[]>(["media_source"])
  const [groupBySecondary, setGroupBySecondary] = useState<string>("campaign")
  const [limit, setLimit] = useState<number>(25)
  const [attributionType, setAttributionType] = useState<"user_level" | "device_level">("user_level")
  const [dateFrom, setDateFrom] = useState<Date>(new Date(2025, 5, 1)) // June 1, 2025
  const [dateTo, setDateTo] = useState<Date | null>(new Date(2025, 5, 8)) // June 8, 2025
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState<string>("custom")
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false)
  const [appLevelCostView, setAppLevelCostView] = useState<boolean>(true)
  const [appDateScope, setAppDateScope] = useState<boolean>(false)



  // Get icon for title
  const getTitleIcon = (title: string) => {
    if (title === "Wolt iOS") {
      return (
        <div className="h-4 w-4 mr-2 bg-blue-500 rounded-sm flex items-center justify-center text-white">
          <Apple className="h-3 w-3" />
        </div>
      )
    } else if (title === "Wolt Android") {
      return (
        <div className="h-4 w-4 mr-2 bg-green-500 rounded-sm flex items-center justify-center text-white">
          <Android className="h-3 w-3" />
        </div>
      )
    } else if (title === "Wolt Web") {
      return (
        <div className="h-4 w-4 mr-2 bg-orange-500 rounded-sm flex items-center justify-center text-white">
          <Globe className="h-3 w-3" />
        </div>
      )
    }
    return null
  }

  // App options for multi-select
  const appOptions = [
    { value: "Wolt iOS", label: "Wolt iOS", icon: Apple, color: "bg-blue-500" },
    { value: "Wolt Android", label: "Wolt Android", icon: Android, color: "bg-green-500" },
    { value: "Wolt Web", label: "Wolt Web", icon: Globe, color: "bg-orange-500" },
  ]



  // Handle layer selection changes
  const handleLayerChange = (layers: string[]) => {
    // Find if we're adding a new layer
    const addedLayer = layers.find(layer => !selectedLayers.includes(layer));
    
    // If we're removing the visible layer, clear visibility
    if (visibleLayer && !layers.includes(visibleLayer)) {
      setVisibleLayer(null);
    }
    // If we're adding a new layer, make it visible (replacing any currently visible layer)
    else if (addedLayer) {
      setVisibleLayer(addedLayer);
    }
    
    setSelectedLayers(layers);
  };

  // Handle visibility changes
  const handleVisibilityChange = (layer: string | null) => {
    setVisibleLayer(layer);
  };

  // Date helper functions
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDateForInput = (date: Date) => {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getDateRangeText = () => {
    if (!dateTo) {
      return formatDate(dateFrom);
    }
    return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
  };

  const handlePredefinedDateRange = (range: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    switch (range) {
      case "today":
        setDateFrom(new Date(today));
        setDateTo(new Date(today));
        break;
      case "yesterday":
        setDateFrom(new Date(yesterday));
        setDateTo(new Date(yesterday));
        break;
      case "last7days":
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 6);
        setDateFrom(last7);
        setDateTo(new Date(today));
        break;
      case "last7daysToday":
        const last7Today = new Date(today);
        last7Today.setDate(today.getDate() - 7);
        setDateFrom(last7Today);
        setDateTo(new Date(today));
        break;
      case "last30days":
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 29);
        setDateFrom(last30);
        setDateTo(new Date(today));
        break;
      case "thisMonth":
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setDateFrom(firstOfMonth);
        setDateTo(new Date(today));
        break;
      case "lastMonth":
        const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setDateFrom(firstOfLastMonth);
        setDateTo(lastOfLastMonth);
        break;
      case "last3months":
        const last3Months = new Date(today);
        last3Months.setMonth(today.getMonth() - 3);
        setDateFrom(last3Months);
        setDateTo(new Date(today));
        break;
    }
    setSelectedDateRange(range);
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isDateInRange = (date: Date, from: Date, to: Date) => {
    const checkDate = new Date(date);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return checkDate >= fromDate && checkDate <= toDate;
  };

  const handleDateClick = (day: number, month: number, year: number) => {
    const clickedDate = new Date(year, month, day);
    
    if (!dateFrom || (dateFrom && dateTo)) {
      // Start new selection - set only From date
      setDateFrom(clickedDate);
      setDateTo(null as any); // Clear To date
    } else if (!dateTo) {
      // Second click - set To date
      if (clickedDate < dateFrom) {
        // If clicked date is before From date, swap them
        setDateTo(dateFrom);
        setDateFrom(clickedDate);
      } else {
        // Normal case - set To date
        setDateTo(clickedDate);
      }
    } else {
      // Third click onwards - start new selection
      setDateFrom(clickedDate);
      setDateTo(null as any);
    }
    setSelectedDateRange("custom");
  };

  // Date Picker Content Component
  const DatePickerContent = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date(2025, 5)); // June 2025
    const [nextMonth, setNextMonth] = useState(new Date(2025, 6)); // July 2025

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

    const navigateMonth = (direction: number) => {
      const newCurrentMonth = new Date(currentMonth);
      newCurrentMonth.setMonth(currentMonth.getMonth() + direction);
      const newNextMonth = new Date(newCurrentMonth);
      newNextMonth.setMonth(newCurrentMonth.getMonth() + 1);
      
      setCurrentMonth(newCurrentMonth);
      setNextMonth(newNextMonth);
    };

    const renderCalendar = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = getDaysInMonth(date);
      const firstDay = getFirstDayOfMonth(date);
      const days = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const isFromDate = dateFrom && isSameDay(currentDate, dateFrom);
        const isToDate = dateTo && isSameDay(currentDate, dateTo);
        const isSelected = isFromDate || isToDate;
        const isInRange = dateFrom && dateTo && isDateInRange(currentDate, dateFrom, dateTo);

        let buttonClass = "w-8 h-8 text-sm rounded-full flex items-center justify-center hover:bg-blue-100 ";
        
        if (isSelected) {
          buttonClass += "bg-blue-500 text-white";
        } else if (isInRange) {
          buttonClass += "bg-blue-100";
        } else {
          buttonClass += "hover:bg-gray-100";
        }

        days.push(
          <button
            key={day}
            onClick={() => handleDateClick(day, month, year)}
            className={buttonClass}
          >
            {day}
          </button>
        );
      }

      return (
        <div className="flex-1">
          <div className="text-center font-medium mb-4">
            {monthNames[month]} {year}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="w-8 h-8 text-xs text-gray-500 flex items-center justify-center font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </div>
      );
    };

    return (
      <div className="flex">
        {/* Left sidebar with predefined ranges */}
        <div className="w-48 border-r p-4">
          <div className="space-y-1">
            {[
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "last7days", label: "Last 7 days" },
              { key: "last7daysToday", label: "Last 7 days & today" },
              { key: "last30days", label: "Last 30 days" },
              { key: "thisMonth", label: "This month" },
              { key: "lastMonth", label: "Last month" },
              { key: "last3months", label: "Last 3 months" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handlePredefinedDateRange(key)}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                  selectedDateRange === key ? "bg-blue-50 text-blue-600" : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right side with calendar and date inputs */}
        <div className="flex-1 p-4">
          {/* Date inputs */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">From</label>
              <input
                type="text"
                value={formatDateForInput(dateFrom)}
                onChange={(e) => {
                  const [month, day, year] = e.target.value.split('/');
                  if (month && day && year) {
                    const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    if (!isNaN(newDate.getTime())) {
                      setDateFrom(newDate);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="MM/DD/YYYY"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">To</label>
              <input
                type="text"
                value={dateTo ? formatDateForInput(dateTo) : ""}
                onChange={(e) => {
                  const [month, day, year] = e.target.value.split('/');
                  if (month && day && year) {
                    const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    if (!isNaN(newDate.getTime())) {
                      setDateTo(newDate);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="MM/DD/YYYY"
              />
            </div>
          </div>

          {/* Calendar navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Dual calendar */}
          <div className="flex gap-8">
            {renderCalendar(currentMonth)}
            {renderCalendar(nextMonth)}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDatePickerOpen(false)}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsDatePickerOpen(false)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const apps = [
    { value: "android", label: "Android App", icon: Android },
    { value: "ios", label: "iOS App", icon: Apple },
    { value: "web", label: "Web App", icon: Globe },
    { value: "ctv", label: "CTV App", icon: Tv },
    { value: "pc", label: "PC App", icon: Monitor },
  ]

  const layers = [
    { value: "skan", label: "SKAN", icon: Layers },
    { value: "incrementality", label: "Incrementality", icon: Layers },
    { value: "sandbox", label: "Sandbox", icon: Layers },
  ]

  const groupByOptions = [
    { value: "campaign", label: "Campaign", icon: Target },
    { value: "media_source", label: "Media Source", icon: Globe },
    { value: "date", label: "Date", icon: Calendar },
    { value: "app", label: "App", icon: Smartphone },
  ]

  // Get group by label
  const getGroupByLabel = (value: string) => {
    return groupByOptions.find(option => option.value === value)?.label || value;
  }



  const setGroupByPrimary = (value: string) => {
    setGroupBy([value])
  }

  // Database data from screenshots (merged duplicate Day 2 row)
  const rawDatabaseData: DatabaseRecord[] = [
    // Wolt_1 data (Google campaigns)
    { day: "Jun 1, 2025", mediaSource: "Google", campaign: "wolt_1", cost: 10, impressions: 10, clicks: 30, apps: "Wolt iOS" },
    { day: "Jun 2, 2025", mediaSource: "Google", campaign: "wolt_1", cost: 10, impressions: 10, clicks: 40, apps: "Wolt iOS, Wolt Android" },
    { day: "Jun 3, 2025", mediaSource: "Google", campaign: "wolt_1", cost: 10, impressions: 10, clicks: 50, apps: "Wolt iOS" },
    { day: "Jun 4, 2025", mediaSource: "Google", campaign: "wolt_1", cost: 10, impressions: 20, clicks: 50, apps: "Wolt iOS" },
    { day: "Jun 5, 2025", mediaSource: "Google", campaign: "wolt_1", cost: 10, impressions: 20, clicks: 0, apps: "Wolt iOS, Wolt Android, Wolt Web" },
    { day: "Jun 6, 2025", mediaSource: "Google", campaign: "wolt_1", cost: 10, impressions: 10, clicks: 10, apps: "Wolt iOS" },
    { day: "Jun 7, 2025", mediaSource: "Google", campaign: "wolt_1", cost: 10, impressions: 10, clicks: 10, apps: "Wolt iOS" },
    { day: "Jun 8, 2025", mediaSource: "Google", campaign: "wolt_1", cost: 10, impressions: 10, clicks: 10, apps: "Wolt iOS, Wolt Android" },
    
    // Wolt_2 data (TikTok campaigns)
    { day: "Jun 1, 2025", mediaSource: "TikTok", campaign: "wolt_2", cost: 20, impressions: 150, clicks: 100, apps: "Wolt Android" },
    { day: "Jun 2, 2025", mediaSource: "TikTok", campaign: "wolt_2", cost: 20, impressions: 100, clicks: 0, apps: "Wolt Android" },
    { day: "Jun 3, 2025", mediaSource: "TikTok", campaign: "wolt_2", cost: 20, impressions: 100, clicks: 100, apps: "Wolt Android" },
    { day: "Jun 4, 2025", mediaSource: "TikTok", campaign: "wolt_2", cost: 20, impressions: 100, clicks: 0, apps: "Wolt Android" },
    { day: "Jun 5, 2025", mediaSource: "TikTok", campaign: "wolt_2", cost: 20, impressions: 100, clicks: 100, apps: "Wolt Android" },
    { day: "Jun 6, 2025", mediaSource: "TikTok", campaign: "wolt_2", cost: 20, impressions: 150, clicks: 0, apps: "Wolt Android" },
    { day: "Jun 7, 2025", mediaSource: "TikTok", campaign: "wolt_2", cost: 20, impressions: 150, clicks: 0, apps: "Wolt Android" },
    { day: "Jun 8, 2025", mediaSource: "TikTok", campaign: "wolt_2", cost: 20, impressions: 150, clicks: 0, apps: "Wolt Android" },
  ]

  // Function to trigger loading and process data
  const triggerDataUpdate = () => {
    setIsTableLoading(true)
    // Simulate calculation time
    setTimeout(() => {
      setIsTableLoading(false)
    }, 1000)
  }

  // Process data using cost engine
  const costEngineResult = processCostData(
    rawDatabaseData,
    dateFrom,
    dateTo,
    selectedApps,
    groupBy[0],
    groupBySecondary,
    appLevelCostView
  )

  // Trigger loading when filters change
  React.useEffect(() => {
    triggerDataUpdate()
  }, [dateFrom, dateTo, selectedApps, groupBy, groupBySecondary])

  // Sorting state for database
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Sort data based on current sort field and direction
  const sortedDatabaseData = [...rawDatabaseData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    
    // For date field, convert to Date objects for proper sorting
    if (sortField === "day") {
      const dateA = new Date(String(aValue));
      const dateB = new Date(String(bValue));
      const comparison = dateA.getTime() - dateB.getTime();
      return sortDirection === "asc" ? comparison : -comparison;
    }
    
    // For text fields (campaign, mediaSource, apps), sort alphabetically
    if (sortField === "campaign" || sortField === "mediaSource" || sortField === "apps") {
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === "asc" ? comparison : -comparison;
    }
    
    // For numeric fields, sort numerically
    const numA = Number(aValue);
    const numB = Number(bValue);
    const comparison = numA - numB;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const databaseData = sortedDatabaseData;

  // Handle column header click for sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Calculate totals
  const totals = {
    cost: databaseData.reduce((sum, row) => sum + row.cost, 0),
    impressions: databaseData.reduce((sum, row) => sum + row.impressions, 0),
    clicks: databaseData.reduce((sum, row) => sum + row.clicks, 0),
  }



  return (
    <div className="flex h-screen bg-white font-sans text-[13px]">
      {/* Sidebar */}
      <div className="w-[166px] bg-[#2d1a57] flex flex-col">
        <div className="p-4 border-b border-[#3d2a67]">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-5fub0tbxFIVkKnKVS79rFczH10lUjZ.png"
            alt="AppsFlyer Logo"
            className="h-6"
          />
        </div>

        <div className="flex-1 overflow-auto">
          <SidebarItem 
            icon="BarChart2" 
            text="Dashboard" 
            active={true}
          />
        </div>

        <div className="mt-auto">
          <SidebarItem icon="Settings" text="Settings" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="h-[52px] border-b flex items-center justify-between px-4">
          <div className="flex items-center space-x-8">
            {/* App-level cost view toggle */}
            <div className="flex items-center space-x-2">
              <label className="text-[13px] text-gray-700 font-medium">App-level cost view</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Toggle between viewing total campaign cost or attributing cost to specific apps when possible.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={appLevelCostView}
                  onChange={(e) => setAppLevelCostView(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Selective Date Scope toggle */}
            <div className="flex items-center space-x-2">
              <label className="text-[13px] text-gray-700 font-medium">Selective Date Scope</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Define whether cost should be attributed only on dates the selected apps were active, or across the full selected date range.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={appDateScope}
                  onChange={(e) => setAppDateScope(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-[13px] font-normal h-8">
                  English
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>Spanish</DropdownMenuItem>
                <DropdownMenuItem>French</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="sm" className="text-[13px] font-normal h-8">
              <HelpCircle className="h-4 w-4 mr-1" />
              Help
            </Button>

            <div className="relative">
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Settings className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  2
                </span>
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-[13px] font-normal h-8">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>GF</AvatarFallback>
                  </Avatar>
                  <span>gil@appsflyer.com</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard Content */}
        <>
          {/* Filter Bar */}
          <div className="border-b px-4 py-2 flex items-center text-[13px]">
            <div className="flex items-center gap-4">
              <AppSelector
                options={appOptions}
                selected={selectedApps}
                onChange={setSelectedApps}
                placeholder="Select apps..."
                className="w-[450px]"
              />

              <div className="relative w-[300px]">
                <Label htmlFor="attributionDates">Attribution dates</Label>
                <DropdownMenu open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="justify-between w-full text-left font-normal"
                    >
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {getDateRangeText()}
                      </div>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[800px] p-0" align="start">
                    <DatePickerContent />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="ml-auto flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Share className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 border-gray-300">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>



          {/* Main Content Area - Split Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Half - Enhanced Table */}
            <div className="w-1/2 flex flex-col border-r">
              {/* Total Cost Card */}
              <div className="px-4 py-4">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 max-w-xs">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Cost</div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">${costEngineResult.totalCost}</div>
                </div>
              </div>

              {/* Group By Bar */}
              <div className="border-b px-4 py-2 flex items-center text-[13px]">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Label htmlFor="groupBy">Group by</Label>
                    <div className="flex items-center mt-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="justify-between text-left font-normal"
                          >
                            {getGroupByLabel(groupBy[0])}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {groupByOptions
                            .map((option) => (
                              <DropdownMenuItem 
                                key={option.value} 
                                onClick={() => setGroupByPrimary(option.value)}
                                className={`flex items-center ${option.value === groupBySecondary ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={option.value === groupBySecondary}
                              >
                                <option.icon className="h-3.5 w-3.5 mr-2" />
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="mx-2">
                        <ArrowRight className="h-4 w-4 text-gray-500" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="justify-between text-left font-normal"
                          >
                            {getGroupByLabel(groupBySecondary)}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {groupByOptions
                            .map((option) => (
                              <DropdownMenuItem 
                                key={option.value} 
                                onClick={() => setGroupBySecondary(option.value)}
                                className={`flex items-center ${option.value === groupBy[0] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={option.value === groupBy[0]}
                              >
                                <option.icon className="h-3.5 w-3.5 mr-2" />
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <div className="ml-auto flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <span className="text-xs">⋮</span>
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <TableLoader isLoading={isTableLoading}>
                  {attributionType === "user_level" ? (
                    <EnhancedTable
                      groupBy={groupBy}
                      groupBySecondary={groupBySecondary}
                      selectedApps={selectedApps}
                      selectedLayers={selectedLayers}
                      visibleLayer={visibleLayer}
                      costData={costEngineResult}
                    />
                  ) : (
                    <DeviceLevelTable 
                      groupBy={groupBy}
                      groupBySecondary={groupBySecondary}
                      selectedApps={selectedApps}
                      selectedLayers={selectedLayers}
                      visibleLayer={visibleLayer}
                      selectedAsset={null}
                    />
                  )}
                </TableLoader>
              </div>

              {/* Pagination */}
              <div className="border-t p-2 flex justify-end space-x-2">
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs border-gray-300 font-normal">
                  Top 25
                </Button>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs border-gray-300 font-normal">
                  Top 50
                </Button>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs border-gray-300 font-normal">
                  Top 100
                </Button>
              </div>
            </div>

            {/* Right Half - Database View */}
            <div className="w-1/2 flex flex-col">
              <div className="flex-1 overflow-auto p-2">
                <div className="bg-white rounded-lg shadow">
                  <div className="p-3 border-b">
                    <h2 className="text-base font-semibold text-gray-900">Campaign Database</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("day")}
                          >
                            <div className="flex items-center justify-between">
                              Date
                              <div className="flex flex-col">
                                <ChevronUp className={`h-3 w-3 ${sortField === "day" && sortDirection === "asc" ? "text-gray-900" : "text-gray-400"}`} />
                                <ChevronDown className={`h-3 w-3 ${sortField === "day" && sortDirection === "desc" ? "text-gray-900" : "text-gray-400"}`} />
                              </div>
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("mediaSource")}
                          >
                            <div className="flex items-center justify-between">
                              Media source
                              <div className="flex flex-col">
                                <ChevronUp className={`h-3 w-3 ${sortField === "mediaSource" && sortDirection === "asc" ? "text-gray-900" : "text-gray-400"}`} />
                                <ChevronDown className={`h-3 w-3 ${sortField === "mediaSource" && sortDirection === "desc" ? "text-gray-900" : "text-gray-400"}`} />
                              </div>
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("campaign")}
                          >
                            <div className="flex items-center justify-between">
                              Campaign
                              <div className="flex flex-col">
                                <ChevronUp className={`h-3 w-3 ${sortField === "campaign" && sortDirection === "asc" ? "text-gray-900" : "text-gray-400"}`} />
                                <ChevronDown className={`h-3 w-3 ${sortField === "campaign" && sortDirection === "desc" ? "text-gray-900" : "text-gray-400"}`} />
                              </div>
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("cost")}
                          >
                            <div className="flex items-center justify-between">
                              Cost
                              <div className="flex flex-col">
                                <ChevronUp className={`h-3 w-3 ${sortField === "cost" && sortDirection === "asc" ? "text-gray-900" : "text-gray-400"}`} />
                                <ChevronDown className={`h-3 w-3 ${sortField === "cost" && sortDirection === "desc" ? "text-gray-900" : "text-gray-400"}`} />
                              </div>
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("apps")}
                          >
                            <div className="flex items-center justify-between">
                              Apps
                              <div className="flex flex-col">
                                <ChevronUp className={`h-3 w-3 ${sortField === "apps" && sortDirection === "asc" ? "text-gray-900" : "text-gray-400"}`} />
                                <ChevronDown className={`h-3 w-3 ${sortField === "apps" && sortDirection === "desc" ? "text-gray-900" : "text-gray-400"}`} />
                              </div>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {databaseData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5 text-xs text-gray-900 border-r">{row.day}</td>
                            <td className="px-2 py-1.5 text-xs text-gray-900 border-r">{row.mediaSource}</td>
                            <td className="px-2 py-1.5 text-xs text-gray-900 border-r">{row.campaign}</td>
                            <td className="px-2 py-1.5 text-xs text-gray-900 border-r">{row.cost}</td>
                            <td className="px-2 py-1.5 text-xs text-gray-900">{row.apps}</td>
                          </tr>
                        ))}
                        {/* Total row */}
                        <tr className="bg-blue-50 font-medium">
                          <td className="px-2 py-1.5 text-xs text-gray-900 border-r font-semibold">Total</td>
                          <td className="px-2 py-1.5 text-xs text-gray-900 border-r"></td>
                          <td className="px-2 py-1.5 text-xs text-gray-900 border-r"></td>
                          <td className="px-2 py-1.5 text-xs text-gray-900 border-r font-semibold">{totals.cost}</td>
                          <td className="px-2 py-1.5 text-xs text-gray-900"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
  )
}

function SidebarItem({
  icon,
  text,
  active = false,
  hasSubmenu = false,
  onClick,
}: {
  icon: string
  text: string
  active?: boolean
  hasSubmenu?: boolean
  onClick?: () => void
}) {
  const IconComponent = icon === "BarChart2" ? BarChart2 : icon === "Database" ? Database : BarChart2;
  
  return (
    <div
      className={`flex items-center px-4 py-2 text-[13px] ${
        active ? "text-white" : "text-[#a99fc2]"
      } hover:bg-[#3d2a67] cursor-pointer`}
      onClick={onClick}
    >
      <IconComponent className="w-5 h-5 mr-2" />
      <span>{text}</span>
      {hasSubmenu && <ChevronDown className="ml-auto h-4 w-4" />}
    </div>
  )
}

function SidebarSubmenuItem({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center py-1 text-[11px] ${
        active ? "text-white" : "text-[#a99fc2]"
      } hover:text-white cursor-pointer`}
    >
      <span>{text}</span>
      {active && <div className="ml-auto w-1 h-1 bg-white rounded-full"></div>}
    </div>
  )
}

function TableRow({
  name,
  expanded,
  onToggle,
  data,
}: {
  name: string
  expanded: boolean
  onToggle: () => void
  data: {
    total: string
    installs: string
    reAttributions: string
    reEngagements: string
    impressions: string
    clicks: string
  }
}) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-2">
        <div className="flex items-center">
          <button onClick={onToggle} className="mr-1">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {name}
        </div>
      </td>
      <td className="px-4 py-2"></td>
      <td className="text-right px-4 py-2">{data.total}</td>
      <td className="text-right px-4 py-2">{data.installs}</td>
      <td className="text-right px-4 py-2">{data.reAttributions}</td>
      <td className="text-right px-4 py-2">{data.reEngagements}</td>
      <td className="text-right px-4 py-2">{data.impressions}</td>
      <td className="text-right px-4 py-2">{data.clicks}</td>
    </tr>
  )
}

