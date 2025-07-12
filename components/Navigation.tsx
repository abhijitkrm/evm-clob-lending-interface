'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();

  return (
    <NavigationMenu>
      <NavigationMenuList>

        
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={cn(
              navigationMenuTriggerStyle(),
              "h-8 px-3 text-sm font-light",
              pathname === "/markets" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900"
            )}>
            <Link href="/markets">
              Markets
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={cn(
              navigationMenuTriggerStyle(),
              "h-8 px-3 text-sm font-light",
              pathname === "/docs" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900"
            )}>
            <Link href="/docs">
              Docs
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
