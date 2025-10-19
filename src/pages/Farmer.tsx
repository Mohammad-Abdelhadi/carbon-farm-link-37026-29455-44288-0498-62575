import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { mintTokens } from "@/lib/hederaClient";
import { Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { FarmerNFTBadge } from "@/components/FarmerNFTBadge";
import { useNFTMinting } from "@/hooks/useNFTMinting";

const Farmer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isWalletConnected, loading } = useAuth();
  const { checkAndMintNFTs } = useNFTMinting();
  const [actionLoading, setActionLoading] = useState(false);
  const tokenId = localStorage.getItem("agripulse_token_id") || import.meta.env.VITE_TOKEN_ID || "0.0.4956206";
  
  const [formData, setFormData] = useState({
    farmName: "",
    tons: "",
    pricePerTon: "10",
  });

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate("/auth");
    } else if (user.role !== "farmer") {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة للمزارعين فقط",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast, loading]);

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

    setActionLoading(true);

    try {
      const amount = parseInt(formData.tons);
      
      const txId = await mintTokens(
        user!.accountId!,
        user!.privateKey!,
        tokenId,
        amount
      );

      // Save farm to database
      const { error } = await (supabase as any).from("farms").insert({
        user_id: user!.id,
        farm_name: formData.farmName,
        tons: amount,
        token_id: tokenId,
        transaction_id: txId,
        price_per_ton: parseFloat(formData.pricePerTon),
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "✅ تم تسجيل المزرعة بنجاح!",
        description: (
          <div className="space-y-2 mt-2">
            <p>تم mint {amount} رمز كربون</p>
            <p className="font-mono text-xs break-all">Transaction ID: {txId}</p>
            <a
              href={`https://hashscan.io/testnet/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary underline block"
            >
              عرض على HashScan
            </a>
          </div>
        ),
      });

      setFormData({ farmName: "", tons: "", pricePerTon: "10" });
    } catch (error: any) {
      toast({
        title: "❌ حدث خطأ",
        description: error.message || "فشلت عملية mint",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* NFT Badges Section */}
          <FarmerNFTBadge />

          {/* Farm Registration Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sprout className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">تسجيل المزرعة</h2>
                      <p className="text-sm text-muted-foreground">أضف مزرعتك إلى المنصة</p>
                    </div>
                  </div>
                </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="farmName">اسم المزرعة</Label>
                <Input
                  id="farmName"
                  placeholder="مزرعة النخيل"
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tons">الكمية المتوقعة (بالطن CO₂e)</Label>
                <Input
                  id="tons"
                  type="number"
                  placeholder="100"
                  value={formData.tons}
                  onChange={(e) => setFormData({ ...formData, tons: e.target.value })}
                  required
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerTon">السعر لكل طن (HBAR)</Label>
                <Input
                  id="pricePerTon"
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  value={formData.pricePerTon}
                  onChange={(e) => setFormData({ ...formData, pricePerTon: e.target.value })}
                  required
                  min="0.01"
                />
              </div>

              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-xs font-semibold mb-1">Token ID:</p>
                <p className="text-sm font-mono" dir="ltr">{tokenId}</p>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={actionLoading}
                >
                  {actionLoading ? "جاري التسجيل..." : "تسجيل المزرعة"}
                </Button>
              </div>
            </form>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-semibold mb-1">ملاحظة:</p>
              <p>محفظتك: {user?.accountId || "غير متصلة"}</p>
              <p className="mt-2">سيتم مراجعة مزرعتك من قبل الإدارة قبل ظهورها في السوق</p>
            </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Farmer;
