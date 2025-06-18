"use client"

import * as React from "react"
import { Check, ChevronDown, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface LayerOption {
  value: string
  label: string
  icon: React.ElementType
}

interface LayerSelectProps {
  options: LayerOption[]
  selected: string[]
  visibleLayer: string | null
  onChange: (selected: string[]) => void
  onVisibilityChange: (layer: string | null) => void
  placeholder?: string
  className?: string
}

export function LayerSelect({
  options,
  selected,
  visibleLayer,
  onChange,
  onVisibilityChange,
  placeholder = "Select layers",
  className,
}: LayerSelectProps) {
  const [open, setOpen] = React.useState(false)

  // Only clear visibility if the visible layer is deselected
  React.useEffect(() => {
    if (visibleLayer && !selected.includes(visibleLayer)) {
      onVisibilityChange(null)
    }
  }, [selected, visibleLayer, onVisibilityChange])

  const handleSelect = (value: string) => {
    const isCurrentlySelected = selected.includes(value)
    const newSelected = isCurrentlySelected 
      ? selected.filter((item) => item !== value) 
      : [...selected, value]
    
    // If we're deselecting the visible layer, clear visibility
    if (visibleLayer === value && !newSelected.includes(value)) {
      onVisibilityChange(null)
    }
    // If we're selecting a new layer, automatically make it the visible one
    // regardless of whether another layer is currently visible
    else if (!isCurrentlySelected) {
      onVisibilityChange(value)
    }
    
    onChange(newSelected)
  }

  const toggleVisibility = (e: React.MouseEvent, value: string) => {
    e.stopPropagation() // Prevent triggering the CommandItem's onSelect
    
    // Only allow toggling visibility for selected layers
    if (!selected.includes(value)) return
    
    // Toggle visibility - if already visible, turn off, otherwise make this layer visible
    onVisibilityChange(visibleLayer === value ? null : value)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-w-[200px]", className)}
        >
          <span>
            Layers
            {visibleLayer && (
              <span className="ml-1 text-muted-foreground">
                Visible: <span className="ml-1">{options.find(opt => opt.value === visibleLayer)?.label}</span>
              </span>
            )}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Search layers..." />
          <CommandList>
            <CommandEmpty>No layer found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Check
                        className={cn("mr-2 h-4 w-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")}
                      />
                      {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                      {option.label}
                    </div>
                    <button
                      onClick={(e) => toggleVisibility(e, option.value)}
                      className={cn(
                        "ml-2 p-1 rounded-sm transition-colors",
                        !selected.includes(option.value) && "opacity-30 cursor-not-allowed",
                        selected.includes(option.value) && "hover:bg-gray-100"
                      )}
                    >
                      {visibleLayer === option.value ? (
                        <Eye className="h-4 w-4 text-blue-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 