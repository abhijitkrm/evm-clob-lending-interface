"use client";

import { cn } from "@/lib/utils";

export const tableHeaderStyles = "grid grid-cols-5 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider pt-1 pb-3 border-b border-gray-200";

export const tableRowStyles = "grid grid-cols-5 gap-4 py-3 text-xs border-b border-gray-100 last:border-b-0 transition-colors";

export const tableContainerStyles = "space-y-1";

export const TableHeader = ({ 
  className, 
  children 
}: { 
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn(tableHeaderStyles, className)}>
    {children}
  </div>
);

export const TableRow = ({ 
  className, 
  children 
}: { 
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn(tableRowStyles, className)}>
    {children}
  </div>
);

export const TableCell = ({ 
  className, 
  children 
}: { 
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn("", className)}>
    {children}
  </div>
);

export const TableContainer = ({ 
  className, 
  children 
}: { 
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn(tableContainerStyles, className)}>
    {children}
  </div>
);
