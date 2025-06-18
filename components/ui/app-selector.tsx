import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppOption {
  value: string
  label: string
  icon: React.ComponentType<any>
  color: string
}

interface AppSelectorProps {
  options: AppOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function AppSelector({
  options,
  selected,
  onChange,
  placeholder = "Select apps...",
  className
}: AppSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleApp = (appValue: string) => {
    if (selected.includes(appValue)) {
      onChange(selected.filter(app => app !== appValue))
    } else {
      onChange([...selected, appValue])
    }
  }



  const getAppOption = (value: string) => {
    return options.find(option => option.value === value)
  }

  return (
    <div className={cn("relative", className)}>
      <Label htmlFor="apps">Apps</Label>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full min-w-[450px] h-auto min-h-[40px] justify-between text-left font-normal p-2"
          >
            <div className="flex gap-1 flex-1 items-center">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map(appValue => {
                  const option = getAppOption(appValue)
                  if (!option) return null
                  
                  return (
                    <div
                      key={appValue}
                      className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded-md px-2 py-1 text-xs"
                    >
                      <div className={`h-3 w-3 ${option.color} rounded-sm flex items-center justify-center text-white`}>
                        <option.icon className="h-2 w-2" />
                      </div>
                      <span>{option.label}</span>
                    </div>
                  )
                })
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[450px]">
          {options.map(option => (
            <DropdownMenuItem
              key={option.value}
              onClick={(e) => {
                e.preventDefault()
                handleToggleApp(option.value)
              }}
              className="flex items-center justify-between cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex items-center">
                <div className={`h-4 w-4 mr-2 ${option.color} rounded-sm flex items-center justify-center text-white`}>
                  <option.icon className="h-3 w-3" />
                </div>
                {option.label}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => {}} // Handled by parent onClick
                  className="ml-2"
                />
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 