import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { transferTokens } from "@/lib/hederaClient";

interface Farm {
  id: string;
  farm_name: string;
  tons: number;
  price_per_ton: number;
  user_id: string;
  token_id: string;
}

const PurchaseFarm = () => {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [farm, setFarm] = useState<Farm | null>(null);
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [farmerAccountId, setFarmerAccountId] = useState("");

  useEffect(() => {
    if (!user || user.role !== "investor") {
      navigate("/marketplace");
      return;
    }
    
    if (!user.accountId || !user.privateKey) {
      toast({
        title: "محفظة غير متصلة",
        description: "يجب عليك ربط محفظتك أولاً",
        variant: "destructive",
      });
      navigate("/wallet");
      return;
    }

    loadFarm();
  }, [farmId, user, navigate]);

  const loadFarm = async () => {
    const { data, error } = await supabase
      .from("farms")
      .select("*")
      .eq("id", farmId)
      .eq("status", "approved")
      .single();

    if (error || !data) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على المزرعة",
        variant: "destructive",
      });
      navigate("/marketplace");
      return;
    }

    setFarm(data as Farm);

    // Get farmer's wallet from database
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("wallet_address")
      .eq("user_id", data.user_id)
      .single();
    
    if (roleError || !roleData?.wallet_address) {
      toast({
        title: "خطأ",
        description: "المزارع لم يربط محفظته بعد",
        variant: "destructive",
      });
      navigate("/marketplace");
      return;
    }

    setFarmerAccountId(roleData.wallet_address);
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!farm || !user || !user.accountId || !user.privateKey) return;

    if (amount < 1 || amount > farm.tons) {
      toast({
        title: "كمية غير صالحة",
        description: `يجب أن تكون الكمية بين 1 و ${farm.tons}`,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const totalCost = amount * farm.price_per_ton;

      // Create purchase record first
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          farm_id: farm.id,
          investor_id: user.id,
          amount: amount,
          price_per_ton: farm.price_per_ton,
          total_cost: totalCost,
          status: "pending"
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Transfer tokens from investor to farmer using farm's token_id
      const transactionId = await transferTokens(
        user.accountId,
        user.privateKey,
        farmerAccountId,
        farm.token_id,
        totalCost
      );

      // Update purchase with transaction ID
      await supabase
        .from("purchases")
        .update({
          hedera_transaction_id: transactionId,
          status: "completed"
        })
        .eq("id", purchase.id);

      // Update farm tons
      const newTons = farm.tons - amount;
      await supabase
        .from("farms")
        .update({ tons: newTons })
        .eq("id", farm.id);

      toast({
        title: "✅ تمت عملية الشراء بنجاح",
        description: `تم شراء ${amount} طن من ${farm.farm_name}`,
      });

      navigate("/payment-history");
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "فشلت عملية الشراء",
        description: "حدث خطأ أثناء معالجة الشراء. تحقق من رصيدك وحاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!farm) return null;

  const totalCost = amount * farm.price_per_ton;

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/marketplace")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة إلى السوق
          </Button>

          <Card className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sprout className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{farm.farm_name}</h1>
                <p className="text-muted-foreground">شراء رموز الكربون</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">السعر لكل طن</p>
                  <p className="text-2xl font-bold">{farm.price_per_ton} HBAR</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المتاح</p>
                  <p className="text-2xl font-bold">{farm.tons} طن</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">الكمية (طن)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  max={farm.tons}
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  الحد الأقصى: {farm.tons} طن
                </p>
              </div>

              <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">الكمية</span>
                  <span className="font-bold">{amount} طن</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">السعر لكل طن</span>
                  <span className="font-bold">{farm.price_per_ton} HBAR</span>
                </div>
                <div className="border-t border-primary/20 my-4"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">الإجمالي</span>
                  <span className="text-3xl font-bold text-primary">
                    {totalCost} HBAR
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={processing}
                className="w-full text-lg h-14"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    تأكيد الشراء
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                بالنقر على "تأكيد الشراء"، سيتم تحويل {totalCost} HBAR من محفظتك إلى المزارع
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PurchaseFarm;
