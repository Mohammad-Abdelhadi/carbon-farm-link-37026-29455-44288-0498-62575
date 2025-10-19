import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Farmer from "./pages/Farmer";
import Investor from "./pages/Investor";
import Admin from "./pages/Admin";
import Wallet from "./pages/Wallet";
import Marketplace from "./pages/Marketplace";
import Auth from "./pages/Auth";
import ConnectWallet from "./pages/ConnectWallet";
import SeedData from "./pages/SeedData";
import NFTGallery from "./pages/NFTGallery";
import PaymentHistory from "./pages/PaymentHistory";
import PurchaseFarm from "./pages/PurchaseFarm";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/connect-wallet" element={<ConnectWallet />} />
            <Route path="/seed-data" element={<SeedData />} />
            <Route path="/farmer" element={<Farmer />} />
            <Route path="/investor" element={<Investor />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/nft-gallery" element={<NFTGallery />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            <Route path="/purchase/:farmId" element={<PurchaseFarm />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
