"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Asset {
  value: string
  label: string
}

interface AssetComboboxProps {
  value: string
  onChange: (value: string) => void
  assets: Asset[]
  placeholder?: string
  className?: string
}

export function AssetCombobox({
  value,
  onChange,
  assets,
  placeholder = "Select asset...",
  className
}: AssetComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between px-2 py-1.5 h-auto text-xs font-normal",
            className
          )}
        >
          {value
            ? assets.find((asset) => asset.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search asset..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="text-xs py-2">No asset found.</CommandEmpty>
            <CommandGroup>
              {assets.map((asset) => (
                <CommandItem
                  key={asset.value}
                  value={asset.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      value === asset.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {asset.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
