import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getBalance } from "@/lib/hederaClient";
import { Wallet as WalletIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";

interface BalanceData {
  hbars: string;
  tokens: string;
}

const Wallet = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isWalletConnected } = useAuth();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<BalanceData | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleCheckBalance = async () => {
    if (!isWalletConnected) {
      toast({
        title: "يجب ربط المحفظة أولاً",
        description: "قم بتوصيل محفظة Hedera لعرض الرصيد",
        variant: "destructive",
      });
      navigate("/connect-wallet");
      return;
    }

    setLoading(true);

    try {
      const balanceData = await getBalance(user!.accountId!, user!.privateKey!);
      setBalance(balanceData);

      toast({
        title: "✅ تم تحميل الرصيد",
        description: "تم عرض رصيدك بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "❌ حدث خطأ",
        description: error.message || "فشل في تحميل الرصيد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseTokens = (tokensString: string) => {
    try {
      const cleaned = tokensString.replace(/^\{|\}$/g, '').trim();
      if (!cleaned) return [];
      
      const pairs = cleaned.split(',').map(pair => pair.trim());
      return pairs.map(pair => {
        const [tokenId, amount] = pair.split('=');
        return { tokenId, amount };
      });
    } catch {
      return [];
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
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <WalletIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">المحفظة</h2>
                  <p className="text-sm text-muted-foreground">تحقق من رصيدك</p>
                </div>
              </div>
            </div>

            {isWalletConnected ? (
              <>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">حسابك</p>
                  <p className="font-mono text-sm">{user.accountId}</p>
                </div>

                <Button
                  onClick={handleCheckBalance}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? "جاري التحميل..." : "عرض الرصيد"}
                </Button>

                {balance && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">رصيد HBAR</p>
                      <p className="text-2xl font-bold text-primary">{balance.hbars}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">الرموز:</p>
                      {parseTokens(balance.tokens).length > 0 ? (
                        <div className="space-y-2">
                          {parseTokens(balance.tokens).map((token, index) => (
                            <div
                              key={index}
                              className="bg-muted p-3 rounded-lg flex justify-between items-center"
                            >
                              <span className="text-xs font-mono">{token.tokenId}</span>
                              <span className="font-semibold">{token.amount}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          لا توجد رموز في هذا الحساب
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">يجب ربط المحفظة أولاً</p>
                <Button
                  onClick={() => navigate("/connect-wallet")}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  ربط المحفظة
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};

export default Wallet;
