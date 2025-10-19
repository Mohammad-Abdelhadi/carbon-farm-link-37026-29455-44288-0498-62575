import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { transferTokens } from "@/lib/hederaClient";
import { TrendingUp } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

const Investor = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isWalletConnected } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const prefilledFarmerId = (location.state as any)?.farmerId || "";
  const farmId = (location.state as any)?.farmId || "";
  const pricePerTon = (location.state as any)?.pricePerTon || 0;
  const availableTons = (location.state as any)?.availableTons || 0;
  
  // Load token ID from localStorage (set by admin when creating token)
  const savedTokenId = localStorage.getItem('agripulse_token_id') || "";
  
  const [formData, setFormData] = useState({
    tokenId: savedTokenId || import.meta.env.VITE_TOKEN_ID || "0.0.4956206",
    farmerId: prefilledFarmerId,
    amount: "",
  });

  const totalCost = formData.amount ? (parseFloat(formData.amount) * pricePerTon).toFixed(2) : "0.00";

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (user.role !== "investor") {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة للمستثمرين فقط",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWalletConnected) {
      toast({
        title: "يجب ربط المحفظة أولاً",
        description: "قم بتوصيل محفظة Hedera لإجراء المعاملات",
        variant: "destructive",
      });
      navigate("/connect-wallet");
      return;
    }

    setLoading(true);

    try {
      const amount = parseInt(formData.amount);
      const totalCostValue = parseFloat(totalCost);
      
      // Get farm owner info
      const { data: farmData, error: farmError } = await (supabase as any)
        .from("farms")
        .select("user_id")
        .eq("id", farmId)
        .single();

      if (farmError) throw farmError;

      // Record the purchase in database
      const { error: purchaseError } = await (supabase as any)
        .from("purchases")
        .insert({
          investor_id: user!.id,
          farm_id: farmId,
          amount: amount,
          price_per_ton: pricePerTon,
          total_cost: totalCostValue
        });

      if (purchaseError) throw purchaseError;

      // Update farm's available tons
      const { error: updateError } = await (supabase as any)
        .from("farms")
        .update({
          tons: availableTons - amount
        })
        .eq("id", farmId);

      if (updateError) throw updateError;

      toast({
        title: "✅ Purchase Successful!",
        description: (
          <div className="space-y-2 mt-2">
            <p>Purchased {amount} tons of CO₂ credits</p>
            <p>Total Cost: {totalCostValue} HBAR</p>
            <p className="text-xs text-success mt-2">
              ✓ Payment recorded in the system
            </p>
            <p className="text-xs text-success">
              ✓ Farmer will receive {totalCostValue} HBAR
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Note: This demo records the transaction. For real HBAR transfers, implement Hedera token transfers.
            </p>
          </div>
        ),
      });

      // Navigate back to marketplace
      setTimeout(() => {
        navigate("/marketplace");
      }, 3000);

    } catch (error: any) {
      toast({
        title: "❌ Transaction Failed",
        description: error.message || "Purchase failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">شراء رموز الكربون</h2>
                  <p className="text-sm text-muted-foreground">استثمر في المستقبل المستدام</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenId">Token ID</Label>
                <Input
                  id="tokenId"
                  placeholder="0.0.xxxxx"
                  value={formData.tokenId}
                  onChange={(e) => setFormData({ ...formData, tokenId: e.target.value })}
                  required
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmerId">Farmer Account ID</Label>
                <Input
                  id="farmerId"
                  placeholder="0.0.xxxxx"
                  value={formData.farmerId}
                  onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                  required
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">عدد الرموز</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="1"
                  max={availableTons || undefined}
                />
                {availableTons > 0 && (
                  <p className="text-xs text-muted-foreground">
                    متاح: {availableTons} طن
                  </p>
                )}
              </div>

              {pricePerTon > 0 && (
                <div className="bg-secondary/10 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">السعر لكل طن:</span>
                    <span className="font-bold">{pricePerTon} HBAR</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">التكلفة الإجمالية:</span>
                    <span className="font-bold text-lg text-secondary">{totalCost} HBAR</span>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary/90"
                  disabled={loading}
                >
                  {loading ? "جاري الشراء..." : "شراء الرموز"}
                </Button>
              </div>
            </form>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-semibold mb-1">ملاحظة:</p>
              <p>محفظتك: {user?.accountId || "غير متصلة"}</p>
              <p className="mt-2">تأكد من أن لديك HBAR كافية لدفع رسوم المعاملة</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Investor;
