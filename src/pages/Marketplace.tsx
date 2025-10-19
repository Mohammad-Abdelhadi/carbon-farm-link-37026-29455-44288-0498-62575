import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sprout, TrendingUp, Search, Filter, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNFTMinting } from "@/hooks/useNFTMinting";

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
  const { checkAndMintNFTs } = useNFTMinting();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "tons">("price");

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

  const handleBuy = (farm: Farm) => {
    if (user?.role !== "investor") {
      toast({
        title: "غير مصرح",
        description: "يجب أن تكون مستثمراً للشراء",
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/purchase/${farm.id}`);
  };

  const filteredFarms = farms
    .filter(farm => 
      farm.farm_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "price") {
        return a.price_per_ton - b.price_per_ton;
      }
      return b.tons - a.tons;
    });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl">
                <Leaf className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
              سوق رموز الكربون
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              استثمر في مستقبل مستدام واحصل على رموز كربون حقيقية من مزارع معتمدة
            </p>
            <div className="flex gap-4 justify-center items-center flex-wrap">
              <Badge variant="outline" className="text-base px-4 py-2">
                🌱 {farms.length} مزرعة متاحة
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-2">
                ♻️ {farms.reduce((sum, f) => sum + f.tons, 0)} طن CO₂
              </Badge>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="ابحث عن مزرعة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 text-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === "price" ? "default" : "outline"}
                    onClick={() => setSortBy("price")}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    السعر
                  </Button>
                  <Button
                    variant={sortBy === "tons" ? "default" : "outline"}
                    onClick={() => setSortBy("tons")}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    الكمية
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Farms Grid */}
          {loadingFarms ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground text-lg">جاري تحميل المزارع...</p>
              </div>
            </div>
          ) : filteredFarms.length === 0 ? (
            <Card className="p-16 text-center">
              <Sprout className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
              <h2 className="text-3xl font-semibold mb-3">
                {searchTerm ? "لا توجد نتائج" : "لا توجد مزارع متاحة"}
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                {searchTerm 
                  ? "جرب مصطلح بحث مختلف"
                  : "تحقق مرة أخرى لاحقاً لمزيد من الفرص الاستثمارية"}
              </p>
              {searchTerm && (
                <Button onClick={() => setSearchTerm("")}>
                  مسح البحث
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFarms.map((farm) => (
                <Card 
                  key={farm.id} 
                  className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden border-2 hover:border-primary/50"
                >
                  <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
                  
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                        <Sprout className="h-7 w-7 text-green-600" />
                      </div>
                      <Badge className="text-base px-3 py-1 bg-green-500/10 text-green-700 border-green-500/30">
                        {farm.tons} طن
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold mb-1 group-hover:text-primary transition-colors">
                        {farm.farm_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        رموز كربون معتمدة
                      </p>
                    </div>
                    
                    <div className="space-y-3 py-4 border-y">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">السعر لكل طن</span>
                        <span className="text-xl font-bold text-green-600">
                          {farm.price_per_ton} HBAR
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">الإجمالي</span>
                        <span className="text-2xl font-bold">
                          {(farm.price_per_ton * farm.tons).toFixed(2)} HBAR
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-mono truncate">
                        TX: {farm.transaction_id?.substring(0, 30)}...
                      </p>
                      <p>
                        📅 {new Date(farm.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>

                    {user?.role === "investor" && (
                      <Button 
                        onClick={() => handleBuy(farm)}
                        className="w-full h-12 text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        size="lg"
                      >
                        <TrendingUp className="h-5 w-5 mr-2" />
                        شراء الرموز
                      </Button>
                    )}
                    
                    {user?.role === "farmer" && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          متاح للمستثمرين فقط
                        </p>
                      </div>
                    )}
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

export default Marketplace;
