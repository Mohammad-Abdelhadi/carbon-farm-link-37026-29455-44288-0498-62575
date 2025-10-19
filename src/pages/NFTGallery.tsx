import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Sparkles, Crown, ExternalLink, Calendar, Hash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

interface NFTLevel {
  id: string;
  name: string;
  level: number;
  investors_required: number;
  rarity: string;
  benefits: string;
}

interface FarmerNFT {
  id: string;
  nft_level_id: string;
  investor_count: number;
  minted_at: string;
  token_id?: string;
  nft_level: NFTLevel;
}

const NFTGallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nfts, setNfts] = useState<FarmerNFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "farmer") {
      fetchNFTs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchNFTs = async () => {
    if (!user) return;

    const { data } = await (supabase as any)
      .from("farmer_nfts")
      .select(`
        *,
        nft_level:nft_levels(*)
      `)
      .eq("user_id", user.id)
      .order("minted_at", { ascending: false });

    if (data) {
      setNfts(data as any);
    }
    setLoading(false);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "legendary": return "text-yellow-500";
      case "rare": return "text-purple-500";
      case "common": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "legendary": return Crown;
      case "rare": return Sparkles;
      case "common": return Award;
      default: return Award;
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "legendary": return "from-yellow-500/20 via-orange-500/10 to-background";
      case "rare": return "from-purple-500/20 via-pink-500/10 to-background";
      case "common": return "from-blue-500/20 via-cyan-500/10 to-background";
      default: return "from-gray-500/20 to-background";
    }
  };

  if (user?.role !== "farmer") {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-4">This page is only available for farmers.</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </Card>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your NFT collection...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl">
                <Crown className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              My NFT Collection
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your exclusive farmer achievement NFTs, verified on the Hedera blockchain
            </p>
            <Badge variant="outline" className="text-lg px-6 py-2">
              {nfts.length} NFT{nfts.length !== 1 ? "s" : ""} Collected
            </Badge>
          </div>

          {nfts.length === 0 ? (
            <Card className="p-12 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
              <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No NFTs Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start attracting investors to your farms to earn exclusive NFT badges!
              </p>
              <Button onClick={() => navigate("/farmer")}>
                Go to Farmer Dashboard
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {nfts.map((nft) => {
                const Icon = getRarityIcon(nft.nft_level.rarity);
                const gradient = getRarityGradient(nft.nft_level.rarity);

                return (
                  <Card
                    key={nft.id}
                    className={`overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2`}
                  >
                    <div className={`h-48 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-grid-white/[0.05]" />
                      <div className={`${getRarityColor(nft.nft_level.rarity)} relative z-10`}>
                        <Icon className="h-24 w-24 drop-shadow-2xl" />
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className={getRarityColor(nft.nft_level.rarity)}>
                          {nft.nft_level.rarity}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{nft.nft_level.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Level {nft.nft_level.level}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Minted: {new Date(nft.minted_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Hash className="h-4 w-4" />
                          <span>{nft.investor_count} Investors</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground border-t pt-4">
                        {nft.nft_level.benefits}
                      </p>

                      {nft.token_id && (
                        <div className="space-y-2 border-t pt-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">Token ID:</span>
                            <span className="font-mono truncate">{nft.token_id}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(`https://hashscan.io/testnet/token/${nft.token_id}`, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on HashScan
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NFTGallery;
