import {
  Client,
  AccountBalanceQuery,
  TokenMintTransaction,
  TransferTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
  AccountId,
  TokenId,
} from "@hashgraph/sdk";

export const createClient = (accountId: string, privateKey: string) => {
  const client = Client.forTestnet();
  // Try ED25519 first (most common), fallback to DER format
  let key: PrivateKey;
  try {
    key = PrivateKey.fromStringED25519(privateKey);
  } catch {
    try {
      key = PrivateKey.fromStringDer(privateKey);
    } catch {
      key = PrivateKey.fromStringECDSA(privateKey);
    }
  }
  client.setOperator(AccountId.fromString(accountId), key);
  return client;
};

export async function getBalance(accountId: string, privateKey: string) {
  try {
    const client = createClient(accountId, privateKey);
    const balance = await new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId))
      .execute(client);
    
    return {
      hbars: balance.hbars.toString(),
      tokens: balance.tokens ? balance.tokens.toString() : "{}",
    };
  } catch (error) {
    console.error("Error getting balance:", error);
    throw error;
  }
}

export async function transferTokens(
  senderId: string,
  senderKey: string,
  receiverId: string,
  tokenId: string,
  amount: number
) {
  try {
    const client = createClient(senderId, senderKey);
    const tx = await new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(senderId), -amount)
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(receiverId), amount)
      .execute(client);
    
    const receipt = await tx.getReceipt(client);
    return tx.transactionId.toString();
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw error;
  }
}

export async function createToken(
  treasuryId: string,
  treasuryKey: string,
  tokenName: string,
  tokenSymbol: string,
  initialSupply: number
) {
  try {
    const client = createClient(treasuryId, treasuryKey);
    
    // Parse the private key with proper method
    let supplyKey: PrivateKey;
    try {
      supplyKey = PrivateKey.fromStringED25519(treasuryKey);
    } catch {
      try {
        supplyKey = PrivateKey.fromStringDer(treasuryKey);
      } catch {
        supplyKey = PrivateKey.fromStringECDSA(treasuryKey);
      }
    }
    
    const tx = await new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(0)
      .setInitialSupply(initialSupply)
      .setTreasuryAccountId(AccountId.fromString(treasuryId))
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(supplyKey)
      .setAdminKey(supplyKey)
      .freezeWith(client);
    
    const signedTx = await tx.sign(supplyKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    return {
      tokenId: receipt.tokenId?.toString() || "",
      transactionId: txResponse.transactionId.toString(),
    };
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
}

export async function mintTokens(
  adminId: string,
  adminKey: string,
  tokenId: string,
  amount: number
) {
  try {
    const client = createClient(adminId, adminKey);
    const tx = await new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setAmount(amount)
      .execute(client);
    
    const receipt = await tx.getReceipt(client);
    return tx.transactionId.toString();
  } catch (error) {
    console.error("Error minting tokens:", error);
    throw error;
  }
}

export async function createNFT(
  treasuryId: string,
  treasuryKey: string,
  nftName: string,
  nftSymbol: string,
  metadata: string
) {
  try {
    const client = createClient(treasuryId, treasuryKey);
    
    let supplyKey: PrivateKey;
    try {
      supplyKey = PrivateKey.fromStringED25519(treasuryKey);
    } catch {
      try {
        supplyKey = PrivateKey.fromStringDer(treasuryKey);
      } catch {
        supplyKey = PrivateKey.fromStringECDSA(treasuryKey);
      }
    }
    
    const tx = await new TokenCreateTransaction()
      .setTokenName(nftName)
      .setTokenSymbol(nftSymbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(AccountId.fromString(treasuryId))
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(supplyKey)
      .setAdminKey(supplyKey)
      .freezeWith(client);
    
    const signedTx = await tx.sign(supplyKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    return {
      tokenId: receipt.tokenId?.toString() || "",
      transactionId: txResponse.transactionId.toString(),
    };
  } catch (error) {
    console.error("Error creating NFT:", error);
    throw error;
  }
}

export async function mintNFT(
  adminId: string,
  adminKey: string,
  tokenId: string,
  metadata: string
) {
  try {
    const client = createClient(adminId, adminKey);
    const metadataBytes = new TextEncoder().encode(metadata);
    
    const tx = await new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata([metadataBytes])
      .execute(client);
    
    const receipt = await tx.getReceipt(client);
    return {
      transactionId: tx.transactionId.toString(),
      serialNumber: receipt.serials[0]?.toString() || "1"
    };
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
}
