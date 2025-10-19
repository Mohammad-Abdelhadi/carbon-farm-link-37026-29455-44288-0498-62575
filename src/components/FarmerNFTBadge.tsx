import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Sparkles, Crown, Users, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mintNFT } from "@/lib/hederaClient";

interface NFTLevel {
  id: string;
  name: string;
  level: number;
  investors_required: number;
  rarity: string;
  benefits: string;
  image_url?: string;
}

interface FarmerNFT {
  id: string;
  nft_level_id: string;
  investor_count: number;
  minted_at: string;
  token_id?: string;
  nft_level: NFTLevel;
}

export const FarmerNFTBadge = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [nfts, setNfts] = useState<FarmerNFT[]>([]);
  const [allLevels, setAllLevels] = useState<NFTLevel[]>([]);
  const [investorCount, setInvestorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "farmer") {
      fetchNFTs();
      fetchInvestorCount();
    }
  }, [user]);

  const fetchNFTs = async () => {
    if (!user) return;

    const { data: levels } = await (supabase as any)
      .from("nft_levels")
      .select("*")
      .order("level", { ascending: true });

    if (levels) setAllLevels(levels);

    const { data: userNfts } = await (supabase as any)
      .from("farmer_nfts")
      .select(`
        *,
        nft_level:nft_levels(*)
      `)
      .eq("user_id", user.id);

    if (userNfts) {
      setNfts(userNfts as any);
    }
    setLoading(false);
  };

  const fetchInvestorCount = async () => {
    if (!user) return;

    // Count approved farms as a proxy for investor engagement
    const { count } = await (supabase as any)
      .from("farms")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "approved");

    setInvestorCount(count || 0);
  };

  const claimNFT = async (levelId: string) => {
    if (!user || !user.accountId || !user.privateKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Hedera wallet to claim NFTs",
        variant: "destructive",
      });
      return;
    }

    const level = allLevels.find(l => l.id === levelId);
    if (!level) return;

    setClaiming(levelId);

    try {
      // Mint NFT on Hedera blockchain
      const nftTokenId = localStorage.getItem("agripulse_nft_token_id");
      let tokenId = "";
      let serialNumber = "";

      if (nftTokenId) {
        const metadata = JSON.stringify({
          name: level.name,
          level: level.level,
          rarity: level.rarity,
          benefits: level.benefits,
          minted_at: new Date().toISOString(),
        });

        const result = await mintNFT(
          user.accountId,
          user.privateKey,
          nftTokenId,
          metadata
        );
        
        tokenId = nftTokenId;
        serialNumber = result.serialNumber;
      }

      const { error } = await (supabase as any)
        .from("farmer_nfts")
        .insert({
          user_id: user.id,
          nft_level_id: levelId,
          investor_count: investorCount,
          token_id: tokenId,
        });

      if (error) throw error;

      toast({
        title: "🎉 NFT Badge Claimed!",
        description: (
          <div className="space-y-2">
            <p>You've earned the {level.name}!</p>
            {tokenId && (
              <a
                href={`https://hashscan.io/testnet/token/${tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline flex items-center gap-1"
              >
                View on HashScan <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ),
      });
      
      fetchNFTs();
    } catch (error: any) {
      console.error("Error claiming NFT:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to claim NFT",
        variant: "destructive",
      });
    } finally {
      setClaiming(null);
    }
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

  if (user?.role !== "farmer" || loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Crown className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Elite Farmer NFTs
            </h3>
            <p className="text-sm text-muted-foreground">Exclusive blockchain-verified achievements</p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Users className="h-4 w-4 mr-2" />
          {investorCount} Investors
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {allLevels.map((level) => {
          const hasNFT = nfts.some(nft => nft.nft_level_id === level.id);
          const nft = nfts.find(nft => nft.nft_level_id === level.id);
          const isQualified = investorCount >= level.investors_required;
          const Icon = getRarityIcon(level.rarity);
          const progress = Math.min((investorCount / level.investors_required) * 100, 100);

          return (
            <Card
              key={level.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                hasNFT
                  ? "border-2 border-primary shadow-xl shadow-primary/20 bg-gradient-to-br from-primary/10 via-background to-background"
                  : isQualified
                  ? "border-2 border-primary/50 shadow-lg"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              {hasNFT && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />
              )}
              
              <div className="p-6 flex flex-col items-center text-center space-y-4 relative">
                <div className={`relative ${hasNFT ? getRarityColor(level.rarity) : "text-muted-foreground"}`}>
                  <div className={`absolute inset-0 blur-xl ${hasNFT ? "opacity-50" : "opacity-0"}`}>
                    <Icon className="h-16 w-16" />
                  </div>
                  <Icon className="h-16 w-16 relative animate-fade-in" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-bold">{level.name}</h4>
                  <Badge 
                    variant={hasNFT ? "default" : "outline"} 
                    className={hasNFT ? getRarityColor(level.rarity) : ""}
                  >
                    {level.rarity}
                  </Badge>
                </div>

                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {investorCount}/{level.investors_required} investors required
                  </div>
                </div>

                <p className="text-xs text-muted-foreground px-2">{level.benefits}</p>

                {hasNFT && nft?.token_id && (
                  <div className="w-full space-y-2">
                    <Badge className="w-full bg-green-500 hover:bg-green-600">
                      ✓ Minted on Hedera
                    </Badge>
                    <a
                      href={`https://hashscan.io/testnet/token/${nft.token_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
                    >
                      View on HashScan <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                
                {hasNFT && !nft?.token_id && (
                  <Badge className="w-full bg-green-500">
                    ✓ Earned
                  </Badge>
                )}
                
                {!hasNFT && isQualified && (
                  <Button 
                    onClick={() => claimNFT(level.id)}
                    disabled={claiming === level.id}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    {claiming === level.id ? "Claiming..." : "🎁 Claim NFT"}
                  </Button>
                )}
                
                {!hasNFT && !isQualified && (
                  <Badge variant="outline" className="w-full">
                    Locked
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {investorCount === 0 && (
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="text-center space-y-2">
            <Sparkles className="h-8 w-8 mx-auto text-primary" />
            <p className="font-semibold">Start Your Journey</p>
            <p className="text-sm text-muted-foreground">
              Create approved farms to attract investors and earn exclusive NFT badges! 🌱
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
