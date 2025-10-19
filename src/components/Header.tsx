import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Sprout, LogOut, Wallet, Award, History } from "lucide-react";

const Header = () => {
  const { user, logout, isWalletConnected } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sprout className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold">AgriPulse</span>
          </Link>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/marketplace">
                <Button variant={isActive("/marketplace") ? "secondary" : "ghost"} size="sm">
                  السوق
                </Button>
              </Link>
              
              <Link to="/payment-history">
                <Button variant={isActive("/payment-history") ? "secondary" : "ghost"} size="sm" className="gap-2">
                  <History className="h-4 w-4" />
                  المدفوعات
                </Button>
              </Link>
              
              {user.role === "farmer" && (
                <>
                  <Link to="/farmer">
                    <Button variant={isActive("/farmer") ? "secondary" : "ghost"} size="sm">
                      مزرعتي
                    </Button>
                  </Link>
                  <Link to="/nft-gallery">
                    <Button variant={isActive("/nft-gallery") ? "secondary" : "ghost"} size="sm" className="gap-2">
                      <Award className="h-4 w-4" />
                      NFT Gallery
                    </Button>
                  </Link>
                </>
              )}
              
              {user.role === "investor" && (
                <Link to="/investor">
                  <Button variant={isActive("/investor") ? "secondary" : "ghost"} size="sm">
                    استثمار
                  </Button>
                </Link>
              )}
              
              <Link to="/wallet">
                <Button variant={isActive("/wallet") ? "secondary" : "ghost"} size="sm">
                  المحفظة
                </Button>
              </Link>
            </nav>
          )}

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium">{user.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role === "farmer" ? "مزارع" : user.role === "investor" ? "مستثمر" : "مدير"}
                  </span>
                </div>
                
                {!isWalletConnected && (
                  <Link to="/connect-wallet">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Wallet className="h-4 w-4" />
                      <span className="hidden sm:inline">ربط المحفظة</span>
                    </Button>
                  </Link>
                )}
                
                <Button onClick={logout} variant="ghost" size="sm" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">خروج</span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90">
                  تسجيل الدخول
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
