import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createNFT, mintNFT } from "@/lib/hederaClient";
import { useToast } from "@/hooks/use-toast";

export const useNFTMinting = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role === "farmer" && user.accountId && user.privateKey) {
      checkAndMintNFTs();
    }
  }, [user]);

  const checkAndMintNFTs = async () => {
    if (!user || !user.accountId || !user.privateKey) return;

    try {
      // Get all purchases for farmer's farms
      const { data: farms } = await supabase
        .from("farms")
        .select("id")
        .eq("user_id", user.id);

      if (!farms || farms.length === 0) return;

      const farmIds = farms.map(f => f.id);
      
      // Count unique investors across all farms
      const { data: purchases } = await supabase
        .from("purchases")
        .select("investor_id")
        .in("farm_id", farmIds)
        .eq("status", "completed");

      if (!purchases) return;

      const uniqueInvestors = new Set(purchases.map(p => p.investor_id));
      const investorCount = uniqueInvestors.size;

      // Get NFT levels
      const { data: nftLevels } = await supabase
        .from("nft_levels")
        .select("*")
        .order("level", { ascending: true });

      if (!nftLevels) return;

      // Get farmer's existing NFTs
      const { data: existingNFTs } = await supabase
        .from("farmer_nfts")
        .select("nft_level_id")
        .eq("user_id", user.id);

      const existingLevelIds = new Set(existingNFTs?.map(n => n.nft_level_id) || []);

      // Check which NFTs should be minted
      for (const level of nftLevels) {
        if (investorCount >= level.investors_required && !existingLevelIds.has(level.id)) {
          await mintAndRecordNFT(level, investorCount);
        }
      }
    } catch (error) {
      console.error("Error checking NFT minting:", error);
    }
  };

  const mintAndRecordNFT = async (nftLevel: any, investorCount: number) => {
    if (!user || !user.accountId || !user.privateKey) return;

    try {
      // Check if NFT token already exists for this level
      const { data: existingNFT } = await supabase
        .from("farmer_nfts")
        .select("token_id")
        .eq("user_id", user.id)
        .eq("nft_level_id", nftLevel.id)
        .maybeSingle();

      let tokenId: string;

      if (existingNFT?.token_id) {
        tokenId = existingNFT.token_id;
      } else {
        // Create new NFT token
        const nftResult = await createNFT(
          user.accountId,
          user.privateKey,
          nftLevel.name,
          `FARM_${nftLevel.level}`,
          JSON.stringify({
            name: nftLevel.name,
            level: nftLevel.level,
            rarity: nftLevel.rarity,
            benefits: nftLevel.benefits,
            investorCount: investorCount
          })
        );

        tokenId = nftResult.tokenId;
      }

      // Mint the NFT to farmer's account
      const mintResult = await mintNFT(
        user.accountId,
        user.privateKey,
        tokenId,
        JSON.stringify({
          farmer: user.email,
          mintedAt: new Date().toISOString(),
          investorCount: investorCount,
          level: nftLevel.level
        })
      );

      // Record in database
      await supabase
        .from("farmer_nfts")
        .upsert({
          user_id: user.id,
          nft_level_id: nftLevel.id,
          investor_count: investorCount,
          token_id: tokenId
        });

      toast({
        title: "🎉 تهانينا! حصلت على NFT جديد",
        description: `لقد حصلت على ${nftLevel.name}! شاهده في معرض NFTs الخاص بك.`,
      });
    } catch (error) {
      console.error("Error minting NFT:", error);
      toast({
        title: "خطأ في إنشاء NFT",
        description: "حدث خطأ أثناء إنشاء NFT. حاول مرة أخرى لاحقاً.",
        variant: "destructive",
      });
    }
  };

  return { checkAndMintNFTs };
};
