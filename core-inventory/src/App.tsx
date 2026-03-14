import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

// Layout & Core
import { AppLayout } from "@/components/layout";
import { Login, Signup, ResetPassword } from "@/pages/auth";
import { Dashboard } from "@/pages/dashboard";

// Features
import { ProductsList, ProductForm, ProductDetail } from "@/pages/products";
import { CategoriesPage } from "@/pages/categories";
import { SettingsPage } from "@/pages/settings";
import { ReceiptsList, ReceiptForm, ReceiptDetail } from "@/pages/receipts";
import { DeliveriesList, DeliveryForm, DeliveryDetail } from "@/pages/deliveries";
import { TransfersList, TransferForm, TransferDetail } from "@/pages/transfers";
import { AdjustmentsList, AdjustmentForm, AdjustmentDetail } from "@/pages/adjustments";
import { LedgerList } from "@/pages/ledger";

// Configure Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

// Global Fetch Interceptor to inject Token automatically into all API calls
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem("core_inventory_token");
  if (token) {
    init = init || {};
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    init.headers = headers;
  }
  const response = await originalFetch(input, init);
  if (response.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem("core_inventory_token");
    window.location.href = "/login";
  }
  return response;
};

// Protected Wrapper for Layout & Routing Logic
function ProtectedApp() {
  const token = localStorage.getItem("core_inventory_token");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) setLocation("/login");
  }, [token, setLocation]);

  if (!token) return null;

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={() => { setLocation("/dashboard"); return null; }} />
        <Route path="/dashboard" component={Dashboard} />
        
        <Route path="/products" component={ProductsList} />
        <Route path="/products/new" component={ProductForm} />
        <Route path="/products/:id" component={ProductDetail} />
        
        <Route path="/categories" component={CategoriesPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/warehouses" component={() => { setLocation("/settings"); return null; }} />
        
        <Route path="/receipts" component={ReceiptsList} />
        <Route path="/receipts/new" component={ReceiptForm} />
        <Route path="/receipts/:id" component={ReceiptDetail} />
        
        <Route path="/deliveries" component={DeliveriesList} />
        <Route path="/deliveries/new" component={DeliveryForm} />
        <Route path="/deliveries/:id" component={DeliveryDetail} />
        
        <Route path="/transfers" component={TransfersList} />
        <Route path="/transfers/new" component={TransferForm} />
        <Route path="/transfers/:id" component={TransferDetail} />
        
        <Route path="/adjustments" component={AdjustmentsList} />
        <Route path="/adjustments/new" component={AdjustmentForm} />
        <Route path="/adjustments/:id" component={AdjustmentDetail} />
        
        <Route path="/ledger" component={LedgerList} />
        
        <Route component={() => <div className="p-10 text-center text-xl text-muted-foreground font-semibold">Page not found</div>} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route component={ProtectedApp} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
