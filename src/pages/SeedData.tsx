import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "lucide-react";

const SeedData = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-test-data');
      
      if (error) throw error;

      toast({
        title: "✅ تم إضافة البيانات التجريبية",
        description: (
          <div className="space-y-2 mt-2 text-right" dir="rtl">
            <p className="font-semibold">يمكنك الآن تسجيل الدخول باستخدام:</p>
            <div className="space-y-1 text-sm">
              <p>👨‍💼 Admin: admin@test.com / admin123</p>
              <p>💰 Investor: investor@test.com / investor123</p>
              <p>🌾 Farmer: farmer@test.com / farmer123</p>
            </div>
          </div>
        ),
      });
    } catch (error: any) {
      toast({
        title: "❌ حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Database className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">إضافة بيانات تجريبية</h2>
            <p className="text-muted-foreground">
              سيتم إنشاء 3 حسابات تجريبية مع بيانات نموذجية
            </p>
          </div>

          <Button
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {loading ? "جاري الإضافة..." : "إضافة البيانات التجريبية"}
          </Button>

          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg text-right" dir="rtl">
            <p className="font-semibold mb-2">سيتم إنشاء:</p>
            <ul className="space-y-1">
              <li>• حساب مدير (admin@test.com)</li>
              <li>• حساب مستثمر (investor@test.com)</li>
              <li>• حساب مزارع (farmer@test.com)</li>
              <li>• 3 مزارع نموذجية</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SeedData;
