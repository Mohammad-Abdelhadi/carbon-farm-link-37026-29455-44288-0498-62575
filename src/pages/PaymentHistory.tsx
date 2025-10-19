import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

interface Purchase {
  id: string;
  farm_id: string;
  investor_id: string;
  amount: number;
  total_cost: number;
  price_per_ton: number;
  hedera_transaction_id?: string;
  status: string;
  created_at: string;
  farm?: {
    farm_name: string;
  };
}

const PaymentHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPayments();
  }, [user, navigate, loading]);

  const fetchPayments = async () => {
    if (!user) return;

    let query = supabase.from("purchases").select(`
      *,
      farm:farms(farm_name)
    `);

    if (user.role === "investor") {
      query = query.eq("investor_id", user.id);
    } else if (user.role === "farmer") {
      const { data: farms } = await supabase
        .from("farms")
        .select("id")
        .eq("user_id", user.id);
      
      if (farms && farms.length > 0) {
        const farmIds = farms.map(f => f.id);
        query = query.in("farm_id", farmIds);
      }
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (!error && data) {
      setPurchases(data as any);
    }
    setLoadingData(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-500";
      case "pending": return "bg-yellow-500/10 text-yellow-500";
      case "failed": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "مكتمل";
      case "pending": return "قيد الانتظار";
      case "failed": return "فشل";
      default: return status;
    }
  };

  if (loading || loadingData) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <History className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">سجل المدفوعات</h1>
              <p className="text-muted-foreground">تتبع جميع معاملاتك</p>
            </div>
          </div>

          {purchases.length === 0 ? (
            <Card className="p-12 text-center">
              <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">لا توجد معاملات بعد</h2>
              <p className="text-muted-foreground mb-6">
                {user?.role === "investor" 
                  ? "ابدأ بالاستثمار في المزارع المستدامة"
                  : "انتظر حتى يستثمر المستثمرون في مزارعك"}
              </p>
              {user?.role === "investor" && (
                <Button onClick={() => navigate("/marketplace")}>
                  تصفح المزارع
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <Card key={purchase.id} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        user?.role === "investor" 
                          ? "bg-red-500/10" 
                          : "bg-green-500/10"
                      }`}>
                        {user?.role === "investor" 
                          ? <ArrowUpRight className="h-6 w-6 text-red-500" />
                          : <ArrowDownLeft className="h-6 w-6 text-green-500" />
                        }
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">
                            {(purchase.farm as any)?.farm_name || "مزرعة"}
                          </h3>
                          <Badge className={getStatusColor(purchase.status)}>
                            {getStatusText(purchase.status)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{purchase.amount} طن × {purchase.price_per_ton} HBAR</p>
                          <p className="font-mono text-xs">
                            {new Date(purchase.created_at).toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className={`text-2xl font-bold ${
                        user?.role === "investor" ? "text-red-500" : "text-green-500"
                      }`}>
                        {user?.role === "investor" ? "-" : "+"}{purchase.total_cost} HBAR
                      </p>
                      
                      {purchase.hedera_transaction_id && purchase.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(
                            `https://hashscan.io/testnet/transaction/${purchase.hedera_transaction_id}`,
                            "_blank"
                          )}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          عرض في HashScan
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentHistory;
