"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface Option {
  value: string
  label: string
  icon?: React.ElementType
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  singleSelect?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
  singleSelect = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    if (singleSelect) {
      onChange([value])
      setOpen(false)
    } else {
      const newSelected = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
      onChange(newSelected)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between", className)}
        >
          {singleSelect && selected.length > 0
            ? options.find((option) => option.value === selected[0])?.label
            : selected.length > 0
              ? `${selected.length} selected`
              : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search options..." />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                  <Check
                    className={cn("mr-2 h-4 w-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")}
                  />
                  {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

