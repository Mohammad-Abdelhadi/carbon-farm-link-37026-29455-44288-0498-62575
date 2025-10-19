import { Link, useNavigate } from "react-router-dom";
import { Sprout, TrendingUp, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            AgriPulse
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            سوق الكربون اللامركزي
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            نربط المزارعين بالمستثمرين من خلال رموز الكربون على شبكة Hedera
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sprout className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">للمزارعين</h3>
              <p className="text-muted-foreground">
                سجّل مزرعتك واحصل على رموز كربون مقابل الممارسات الصديقة للبيئة
              </p>
              {user?.role === "farmer" ? (
                <Link to="/farmer">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    ابدأ كمزارع
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  variant="outline"
                  className="w-full"
                >
                  سجل كمزارع
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary/50">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold">للمستثمرين</h3>
              <p className="text-muted-foreground">
                استثمر في المستقبل المستدام من خلال شراء رموز الكربون
              </p>
              {user?.role === "investor" ? (
                <Link to="/investor">
                  <Button className="w-full bg-secondary hover:bg-secondary/90">
                    ابدأ كمستثمر
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  variant="outline"
                  className="w-full"
                >
                  سجل كمستثمر
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-accent/50">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">الإدارة</h3>
              <p className="text-muted-foreground">
                إصدار رموز جديدة وإدارة النظام البيئي
              </p>
              <Link to="/admin">
                <Button className="w-full bg-accent hover:bg-accent/90">
                  لوحة الإدارة
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Wallet className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold">المحفظة</h3>
              <p className="text-muted-foreground">
                تحقق من رصيدك ورموزك على شبكة Hedera
              </p>
              <Link to="/wallet">
                <Button variant="outline" className="w-full">
                  افتح المحفظة
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Marketplace Link */}
        <div className="text-center">
          <Link to="/marketplace">
            <Button variant="outline" size="lg" className="text-lg">
              تصفح سوق المزارع
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          <p>مبني على شبكة Hedera Testnet</p>
          <p className="mt-2">لا حاجة لـ Backend - كل شيء يعمل من المتصفح مباشرة</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Landing;
