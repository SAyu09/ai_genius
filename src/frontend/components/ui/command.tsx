"use client";

import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search, Bot, CreditCard, Laptop, ShoppingBag, Code, DollarSign, Shield, Activity, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import { cn } from "@/frontend/lib/utils";
import { Dialog, DialogContent } from "@/frontend/components/ui/dialog";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground border border-gray-150 shadow-lg",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 max-w-[540px] rounded-xl border border-gray-200 shadow-2xl">
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-3 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4 [&_[cmdk-item]_svg]:text-gray-400">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-gray-100 px-3" cmdk-input-wrapper="">
    <Search className="mr-2.5 h-4 w-4 shrink-0 text-gray-400" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-md bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[360px] overflow-y-auto overflow-x-hidden py-2", className)}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-8 text-center text-sm text-gray-400 font-medium" {...props} />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-gray-700 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider",
      className,
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-100", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer gap-2.5 select-none items-center rounded-md px-3 py-2 text-sm text-gray-600 font-medium outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900 data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 transition-colors duration-100",
      className,
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-[10px] tracking-widest text-gray-400 font-mono bg-gray-50 border border-gray-150 px-1.5 py-0.5 rounded", className)}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

/* ─── Global Omnibar component for Instantaneous Cross-Platform Nav ─── */
export function Omnibar() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((action: () => void) => {
    setOpen(false);
    action();
  }, []);

  const role = session?.user?.role || "buyer";

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search page..." />
      <CommandList>
        <CommandEmpty>No actions or pages found.</CommandEmpty>
        
        {/* Buyer Navigation Group */}
        <CommandGroup heading="Buyer Workspace">
          <CommandItem onSelect={() => runCommand(() => router.push("/marketplace"))}>
            <Search />
            <span>Discover Business Automation Marketplace</span>
            <CommandShortcut>⌘M</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/marketplace/my-agents"))}>
            <Bot />
            <span>My Active & Subscribed Agents</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/marketplace/billing"))}>
            <CreditCard />
            <span>Buyer Billing & Active Subscriptions</span>
          </CommandItem>
        </CommandGroup>

        {/* Creator Studio Navigation Group */}
        {(role === "seller" || role === "admin") && (
          <CommandGroup heading="Creator Studio (Seller Mode)">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/seller"))}>
              <Laptop />
              <span>Seller Dashboard Overview</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/seller/listings"))}>
              <ShoppingBag />
              <span>Manage My Listed Agents</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/seller/developer"))}>
              <Code />
              <span>Developer Keys & Webhook Logs</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/seller/earnings"))}>
              <DollarSign />
              <span>Telemetry & Churn Analytics</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Platform Operations Group */}
        {role === "admin" && (
          <CommandGroup heading="Platform Operations (Admin Mode)">
            <CommandItem onSelect={() => runCommand(() => router.push("/admin"))}>
              <Shield />
              <span>Operations Control Panel</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/monitor"))}>
              <Activity />
              <span>Live Infrastructure Performance Telemetry</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Unified Account & System Actions */}
        <CommandGroup heading="System Commands">
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings />
            <span>User Account & Security Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => signOut({ callbackUrl: "/" }))}>
            <LogOut className="text-red-600" />
            <span className="text-red-600 font-semibold">Sign Out from Platform</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
