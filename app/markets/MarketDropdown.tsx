import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

import type { Market } from '@/contexts/MarketContext';

interface MarketDropdownProps {
  currentMarket: Market;
  setCurrentMarket: (market: Market) => void;
  availableMarkets: Market[];
}

export function MarketDropdown({ currentMarket, setCurrentMarket, availableMarkets }: MarketDropdownProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between px-3 py-2 text-sm font-normal min-w-[160px]"
          role="combobox"
          aria-expanded={open}
        >
          {currentMarket.name}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0" align="end">
        <div className="py-1">
          {availableMarkets.map((market) => (
            <button
              key={market.id}
              className={cn(
                'flex w-full items-center px-3 py-2 text-sm rounded-md transition-colors',
                currentMarket.id === market.id
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
              onClick={() => {
                setCurrentMarket(market);
                setOpen(false);
              }}
              disabled={currentMarket.id === market.id}
            >
              {market.name}
              {currentMarket.id === market.id && (
                <Check className="ml-auto h-4 w-4 text-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default MarketDropdown;
