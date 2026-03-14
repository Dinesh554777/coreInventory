import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Box, Tags, Warehouse, ArrowDownToLine, 
  ArrowUpFromLine, ArrowRightLeft, PenTool, ClipboardList, Settings, Menu, X
} from "lucide-react";
import { Button } from "./ui";
import { useState, useEffect } from "react";

export const FadeIn = ({ children, delay = 0, className }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const navGroups = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "Inventory",
    items: [
      { href: "/products", label: "Products", icon: Box },
      { href: "/categories", label: "Categories", icon: Tags },
    ]
  },
  {
    title: "Operations",
    items: [
      { href: "/receipts", label: "Receipts", icon: ArrowDownToLine },
      { href: "/deliveries", label: "Deliveries", icon: ArrowUpFromLine },
      { href: "/transfers", label: "Transfers", icon: ArrowRightLeft },
      { href: "/adjustments", label: "Adjustments", icon: PenTool },
    ]
  },
  {
    title: "Reporting",
    items: [
      { href: "/ledger", label: "Move History", icon: ClipboardList },
    ]
  },
  {
    title: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ]
  }
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("core_inventory_token");
    window.location.href = "/login";
  };

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border gap-3 flex-shrink-0">
        <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
        <span className="font-display font-bold text-xl tracking-tight text-sidebar-foreground">CoreInventory</span>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50 mb-3">{group.title}</h4>
            <div className="space-y-1">
              {group.items.map(item => {
                const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200",
                    active 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25" 
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}>
                    <item.icon className={cn("w-5 h-5", active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-sidebar border-r border-sidebar-border shadow-2xl z-20 hidden lg:flex flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border shadow-2xl z-50 flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-display font-semibold text-lg text-foreground capitalize">
              {location.split('/')[1] || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold leading-none">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-inner">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block mx-1" />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:inline-flex text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              Logout
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
