import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sprout, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Farm {
  id: string;
  farm_name: string;
  tons: number;
  transaction_id: string;
  user_id: string;
  created_at: string;
  status: string;
  price_per_ton: number;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    loadFarms();
  }, [user, navigate, loading]);

  const loadFarms = async () => {
    setLoadingFarms(true);
    const { data, error } = await (supabase as any)
      .from("farms")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFarms(data);
    }
    setLoadingFarms(false);
  };

  const handleBuy = async (farm: Farm) => {
    if (user?.role !== "investor") {
      toast({
        title: "غير مصرح",
        description: "يجب أن تكون مستثمراً للشراء",
        variant: "destructive",
      });
      return;
    }
    
    // Get farmer's wallet ID from localStorage
    const walletData = JSON.parse(localStorage.getItem(`wallet_${farm.user_id}`) || "{}");
    if (!walletData.accountId) {
      toast({
        title: "خطأ",
        description: "المزارع لم يربط محفظته بعد",
        variant: "destructive",
      });
      return;
    }
    
    navigate("/investor", { 
      state: { 
        farmerId: walletData.accountId,
        farmId: farm.id,
        pricePerTon: farm.price_per_ton,
        availableTons: farm.tons
      } 
    });
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">سوق رموز الكربون</h1>
          <p className="text-muted-foreground">اكتشف واستثمر في المزارع المستدامة</p>
        </div>

        {loadingFarms ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </Card>
        ) : farms.length === 0 ? (
          <Card className="p-12 text-center">
            <Sprout className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">لا توجد مزارع متاحة حالياً</h2>
            <p className="text-muted-foreground">تحقق مرة أخرى لاحقاً لمزيد من الفرص الاستثمارية</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <Card key={farm.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sprout className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary">{farm.tons} طن CO₂e</Badge>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{farm.farm_name}</h3>
                
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p className="font-mono break-all">TX: {farm.transaction_id?.substring(0, 20)}...</p>
                  <p>التاريخ: {new Date(farm.created_at).toLocaleDateString('ar-EG')}</p>
                  <p className="text-lg font-bold text-primary">
                    السعر: {farm.price_per_ton} HBAR لكل طن
                  </p>
                </div>

                {user?.role === "investor" && (
                  <Button 
                    onClick={() => handleBuy(farm)}
                    className="w-full bg-secondary hover:bg-secondary/90"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    شراء الرموز
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Marketplace;
