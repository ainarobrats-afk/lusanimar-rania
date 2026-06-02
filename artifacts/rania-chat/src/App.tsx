import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/Home";
import StaffMonitor from "@/pages/StaffMonitor";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import GroupPaymentTracker from "@/pages/GroupPaymentTracker";
import BookingStatus from "@/pages/BookingStatus";
import LiveMonitor from "@/pages/LiveMonitor";
import Explore from "@/pages/Explore";
import PartnerRegister from "@/pages/PartnerRegister";
import DestinationDetail from "@/pages/DestinationDetail";
import TestLab from "@/pages/TestLab";
import TestHistory from "@/pages/TestHistory";
import FlightRoutesMap from "@/pages/FlightRoutesMap";
import FlightQA from "@/pages/FlightQA";
import SplashScreen, { hasSplashBeenShown } from "@/components/SplashScreen";

const queryClient = new QueryClient();

// Splash only on "/" — must live inside WouterRouter to use useLocation
function SplashGate() {
  const [location] = useLocation();
  const [splashDone, setSplashDone] = useState(() => hasSplashBeenShown());
  if (splashDone || location !== "/") return null;
  return <SplashScreen onDone={() => setSplashDone(true)} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/explore" component={Explore} />
      <Route path="/partner/register" component={PartnerRegister} />
      <Route path="/staff" component={StaffMonitor} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/group-payment/:bookingId" component={GroupPaymentTracker} />
      <Route path="/status/:bookingId" component={BookingStatus} />
      <Route path="/live" component={LiveMonitor} />
      <Route path="/destination/:iata" component={DestinationDetail} />
      <Route path="/test-lab" component={TestLab} />
      <Route path="/admin/test-history" component={TestHistory} />
      <Route path="/flight-routes" component={FlightRoutesMap} />
      <Route path="/admin/flight-qa" component={FlightQA} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
            <SplashGate />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
