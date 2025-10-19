import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ConnectWallet = () => {
  const { toast } = useToast();
  const { user, connectWallet, isWalletConnected } = useAuth();
  const navigate = useNavigate();
  
  const [walletData, setWalletData] = useState({
    accountId: "",
    privateKey: "",
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    
    connectWallet(walletData.accountId, walletData.privateKey);
    
    toast({
      title: "✅ تم ربط المحفظة بنجاح",
      description: "يمكنك الآن إجراء المعاملات",
    });
    
    navigate("/");
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (isWalletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">محفظتك متصلة</h2>
            <p className="text-muted-foreground">Account ID: {user.accountId}</p>
            <Link to="/">
              <Button className="bg-primary hover:bg-primary/90">
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">ربط المحفظة</h2>
                <p className="text-sm text-muted-foreground">قم بتوصيل حساب Hedera الخاص بك</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountId">Hedera Account ID</Label>
              <Input
                id="accountId"
                placeholder="0.0.xxxxx"
                value={walletData.accountId}
                onChange={(e) => setWalletData({ ...walletData, accountId: e.target.value })}
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateKey">Private Key</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="302e..."
                value={walletData.privateKey}
                onChange={(e) => setWalletData({ ...walletData, privateKey: e.target.value })}
                required
                dir="ltr"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                ربط المحفظة
              </Button>
            </div>
          </form>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-semibold mb-1">ملاحظة:</p>
            <p>ستحتاج إلى حساب Hedera Testnet لإجراء المعاملات</p>
            <p className="mt-2">يمكنك إنشاء حساب مجاني على Hedera Portal</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConnectWallet;
