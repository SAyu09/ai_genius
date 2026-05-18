"use client";

import * as React from "react";

import { cn } from "@/frontend/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-100",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

