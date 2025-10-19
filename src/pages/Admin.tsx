import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mintTokens, createToken } from "@/lib/hederaClient";
import { Shield, Plus, Coins, CheckCircle, XCircle } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Farm {
  id: string;
  farm_name: string;
  tons: number;
  transaction_id: string;
  user_id: string;
  created_at: string;
  status: string;
}

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  
  const [createdTokenId, setCreatedTokenId] = useState(
    localStorage.getItem("agripulse_token_id") || import.meta.env.VITE_TOKEN_ID || ""
  );
  
  const [createFormData, setCreateFormData] = useState({
    serviceId: "",
    accountId: "",
    privateKey: "",
    tokenName: "AgriPulse Carbon Credits",
    tokenSymbol: "APCC",
    initialSupply: "1000",
  });

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate("/auth");
    } else if (user.role !== "admin") {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة للمديرين فقط",
        variant: "destructive",
      });
      navigate("/");
    } else {
      loadFarms();
    }
  }, [user, navigate, loading, toast]);

  const loadFarms = async () => {
    setLoadingFarms(true);
    const { data, error } = await (supabase as any)
      .from("farms")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFarms(data);
    }
    setLoadingFarms(false);
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const initialSupply = parseInt(createFormData.initialSupply);
      
      const result = await createToken(
        createFormData.accountId,
        createFormData.privateKey,
        createFormData.tokenName,
        createFormData.tokenSymbol,
        initialSupply
      );

      setCreatedTokenId(result.tokenId);
      localStorage.setItem("agripulse_token_id", result.tokenId);
      if (createFormData.serviceId) {
        localStorage.setItem("agripulse_service_id", createFormData.serviceId);
      }

      toast({
        title: "🎉 تم إنشاء الرمز بنجاح!",
        description: (
          <div className="space-y-2 mt-2">
            {createFormData.serviceId && (
              <p className="font-bold">Service ID: {createFormData.serviceId}</p>
            )}
            <p className="font-bold">Token ID: {result.tokenId}</p>
            <p>تم إنشاء {initialSupply} رمز أولي</p>
            <p className="font-mono text-xs break-all">Transaction ID: {result.transactionId}</p>
            <a
              href={`https://hashscan.io/testnet/token/${result.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline block"
            >
              عرض الرمز على HashScan
            </a>
          </div>
        ),
      });

      setCreateFormData({
        ...createFormData,
        serviceId: "",
        accountId: "",
        privateKey: "",
        initialSupply: "1000",
      });
    } catch (error: any) {
      toast({
        title: "❌ حدث خطأ",
        description: error.message || "فشل في إنشاء الرمز",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleApprove = async (farmId: string) => {
    setActionLoading(true);
    const { error } = await (supabase as any)
      .from("farms")
      .update({ status: "approved" })
      .eq("id", farmId);

    if (!error) {
      toast({ title: "تمت الموافقة على المزرعة!" });
      loadFarms();
    } else {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
    setActionLoading(false);
  };

  const handleReject = async (farmId: string) => {
    setActionLoading(true);
    const { error } = await (supabase as any)
      .from("farms")
      .update({ status: "rejected" })
      .eq("id", farmId);

    if (!error) {
      toast({ title: "تم رفض المزرعة" });
      loadFarms();
    } else {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
    setActionLoading(false);
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <div className="min-h-screen p-6">
        <Card className="w-full max-w-6xl mx-auto p-8 shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">لوحة الإدارة</h2>
                  <p className="text-sm text-muted-foreground">إدارة الرموز والمزارع</p>
                </div>
              </div>
            </div>

            {createdTokenId && (
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <p className="text-sm font-semibold mb-1">🎯 Token ID الحالي:</p>
                <p className="font-mono text-lg" dir="ltr">{createdTokenId}</p>
              </div>
            )}

            <Tabs defaultValue="farms" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="farms" className="gap-2">
                  <Shield className="h-4 w-4" />
                  إدارة المزارع
                </TabsTrigger>
                <TabsTrigger value="create" className="gap-2">
                  <Plus className="h-4 w-4" />
                  إنشاء رمز جديد
                </TabsTrigger>
              </TabsList>

              <TabsContent value="farms" className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    راجع المزارع وقم بالموافقة أو الرفض
                  </p>
                </div>

                {loadingFarms ? (
                  <div className="text-center p-8">جاري التحميل...</div>
                ) : farms.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    لا توجد مزارع مسجلة
                  </div>
                ) : (
                  <div className="space-y-4">
                    {farms.map((farm) => (
                      <Card key={farm.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold">{farm.farm_name}</h3>
                              <Badge variant={
                                farm.status === "approved" ? "default" : 
                                farm.status === "rejected" ? "destructive" : 
                                "secondary"
                              }>
                                {farm.status === "approved" ? "موافق عليها" :
                                 farm.status === "rejected" ? "مرفوضة" :
                                 "قيد المراجعة"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {farm.tons} طن CO₂e
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {farm.transaction_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(farm.created_at).toLocaleString('ar-EG')}
                            </p>
                          </div>
                          
                          {farm.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(farm.id)}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(farm.id)}
                                disabled={actionLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    إنشاء رمز جديد على Hedera Testnet. سيتم حفظ Token ID تلقائياً.
                  </p>
                </div>

                <form onSubmit={handleCreateToken} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-serviceId">Service ID (اختياري)</Label>
                    <Input
                      id="create-serviceId"
                      placeholder="0.0.xxxxx"
                      value={createFormData.serviceId}
                      onChange={(e) => setCreateFormData({ ...createFormData, serviceId: e.target.value })}
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-accountId">Treasury Account ID</Label>
                    <Input
                      id="create-accountId"
                      placeholder="0.0.xxxxx"
                      value={createFormData.accountId}
                      onChange={(e) => setCreateFormData({ ...createFormData, accountId: e.target.value })}
                      required
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-privateKey">Treasury Private Key</Label>
                    <Input
                      id="create-privateKey"
                      type="password"
                      placeholder="302e..."
                      value={createFormData.privateKey}
                      onChange={(e) => setCreateFormData({ ...createFormData, privateKey: e.target.value })}
                      required
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tokenName">اسم الرمز</Label>
                      <Input
                        id="tokenName"
                        placeholder="AgriPulse Carbon Credits"
                        value={createFormData.tokenName}
                        onChange={(e) => setCreateFormData({ ...createFormData, tokenName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tokenSymbol">الرمز المختصر</Label>
                      <Input
                        id="tokenSymbol"
                        placeholder="APCC"
                        value={createFormData.tokenSymbol}
                        onChange={(e) => setCreateFormData({ ...createFormData, tokenSymbol: e.target.value })}
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="initialSupply">العدد الأولي من الرموز</Label>
                    <Input
                      id="initialSupply"
                      type="number"
                      placeholder="1000"
                      value={createFormData.initialSupply}
                      onChange={(e) => setCreateFormData({ ...createFormData, initialSupply: e.target.value })}
                      required
                      min="0"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={createLoading}
                  >
                    {createLoading ? "جاري الإنشاء..." : "إنشاء الرمز"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              <p className="font-semibold mb-1">⚠️ تحذير:</p>
              <p>هذه الصفحة للإدارة فقط. احتفظ بـ Private Key الخاص بك في مكان آمن.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Admin;
