import { Link, usePage } from "@inertiajs/react";
import { BarChart3, Bell, Box, History, LayoutDashboard, Package, Settings, ShoppingCart, Users, LogOut, Package2, Superscript, SuperscriptIcon, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Inertia } from "@inertiajs/inertia";

const navItems = [
  { title: "Home", href: "Home", icon: LayoutDashboard, color: "text-indigo-600" },
  { title: "Orders", href: "orders", icon: ShoppingCart, color: "text-teal-600" },
  { title: "Cart", href: "cart", icon: ShoppingCart, color: "text-purple-600" },
  { title: "Products", href: "AllProduct", icon: Package2, color: "text-orange-600" },
  { title: "Support", href: "Support", icon: SuperscriptIcon, color: "text-orange-600" },
  { title: "Expenses", href: "Expenses", icon: IndianRupee, color: "text-orange-600" },
];

export function Layout({ children }) {
  const pathname = window.location.pathname;
  const { auth } = usePage().props;
  const endpoint = import.meta.env.VITE_ENVIRONMENT === "production" 
      ? import.meta.env.VITE_API_BASE_URL
      : "/";
  const handleLogout = () => {
    Inertia.get("logout");
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar for desktop - Fixed, hidden until xl */}
      <aside className="hidden xl:block fixed top-0 left-0 w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-md z-50">
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-indigo-600 dark:bg-indigo-800">
          <Link href={endpoint} className="flex items-center gap-2">
            <Package className="h-6 w-6 text-white" />
            <span className="text-lg font-semibold text-white">StockMaster</span>
          </Link>
        </div>
        <nav className="space-y-1 p-3 overflow-y-auto h-[calc(100vh-3.5rem)]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                pathname === item.href
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200"
                  : "text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", item.color)} />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col w-full xl:ml-64">
        {/* Header - Fixed */}
        <header className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-md z-40">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Package className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <SheetHeader className="flex h-14 items-center border-b border-gray-200 dark:border-gray-700 bg-indigo-600 dark:bg-indigo-800 px-4">
                <SheetTitle className="flex items-center gap-2">
                  <Package className="h-6 w-6 text-white" />
                  <span className="text-lg font-semibold text-white">StockMaster</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="space-y-1 p-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                      pathname === item.href
                        ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200"
                        : "text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", item.color)} />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Right side of header */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hidden sm:block">
              {auth.user?.name || "Guest"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-colors duration-200 text-xs sm:text-sm px-2 sm:px-3"
            >
              <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {/* Main content area - Adjusted for fixed header */}
        <main className="flex-1 pt-10  bg-white dark:bg-gray-900 rounded-tl-xl shadow-md mt-2 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}