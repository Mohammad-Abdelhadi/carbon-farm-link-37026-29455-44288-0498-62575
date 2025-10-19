# AgriPulse - Carbon Credit Trading Platform

## 🌟 Project Overview
AgriPulse is a blockchain-based carbon credit trading platform built on Hedera Hashgraph. It connects farmers who sequester carbon with investors looking to purchase carbon credits, using NFT badges to reward successful farmers.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (Lovable Cloud)
- **Blockchain**: Hedera Hashgraph (Testnet)
- **Database**: PostgreSQL (via Supabase)

### Key Components

#### 1. User Roles System
- **Farmer**: Can register farms and mint carbon tokens
- **Investor**: Can purchase carbon credits from farms
- **Admin**: Can approve/manage farms (to be implemented)

Role management is handled via:
- `user_roles` table with enum type `app_role`
- `has_role()` function for secure role checking
- RLS policies for data access control

#### 2. Carbon Credit System
**Farms Table**:
- Stores farm information (name, tons, price, status)
- Links to farmers via `user_id`
- Status: 'pending' → 'approved' (admin approval flow)

**Flow**:
1. Farmer registers farm → mints fungible tokens on Hedera
2. Admin approves farm → visible in marketplace
3. Investor purchases credits → tokens transferred + payment recorded

#### 3. NFT Achievement System
**NFT Levels Table**:
```sql
- Bronze Farmer (5 investors) - Common
- Silver Farmer (15 investors) - Rare  
- Gold Farmer (30 investors) - Legendary
```

**Farmer NFTs Table**:
- Tracks earned NFT badges per farmer
- Links to Hedera NFT token ID
- Auto-mints when investor threshold reached

**How It Works**:
1. Farmer attracts investors to their farms
2. System counts approved farms (proxy for investor engagement)
3. When threshold reached → NFT minted on Hedera blockchain
4. NFT displayed in farmer's collection with blockchain verification

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Farmers can only see/edit their own farms
- Investors can see approved farms + their purchases
- Admins have full access

### Authentication
- Supabase Auth integration
- Email/password authentication
- Role assignment on signup via trigger

### Wallet Security
- Private keys stored locally (for demo)
- ⚠️ **Production**: Use Hedera Wallet Connect instead

## 📊 Database Schema

### Core Tables
1. **user_roles**: User role assignments
2. **farms**: Farm registrations and carbon credits
3. **purchases**: Investment transactions
4. **nft_levels**: NFT tier definitions
5. **farmer_nfts**: Minted NFT records

### Key Relationships
- `farms.user_id` → farmer
- `purchases.farm_id` → farm
- `purchases.investor_id` → investor
- `farmer_nfts.nft_level_id` → nft_levels

## 🎨 UI/UX Features

### Design System
- Semantic color tokens (HSL format)
- Gradient backgrounds for premium feel
- Animations: fade-in, scale, pulse
- Responsive grid layouts

### NFT Gallery
- Premium card designs with rarity-based gradients
- Progress tracking for each NFT tier
- Blockchain verification badges
- HashScan integration for on-chain proof

### Key Pages
- `/auth` - Login/Signup
- `/farmer` - Farm registration + NFT showcase
- `/investor` - Token purchase
- `/marketplace` - Browse approved farms
- `/nft-gallery` - View collected NFTs
- `/admin` - Farm approval (admin only)

## 🔗 Hedera Integration

### Token Types
1. **Fungible Tokens**: Carbon credits (CO₂e)
   - Token ID stored in localStorage
   - Minted per farm registration
   
2. **NFT Tokens**: Achievement badges
   - Unique metadata per NFT level
   - Stored with serial numbers

### Key Functions (`hederaClient.ts`)
- `createToken()` - Create fungible token
- `mintTokens()` - Mint carbon credits
- `createNFT()` - Initialize NFT collection
- `mintNFT()` - Mint achievement NFT
- `transferTokens()` - Transfer tokens between accounts

## 🚀 Getting Started

### Prerequisites
1. Hedera Testnet account (via portal.hedera.com)
2. Note your Account ID and Private Key

### Setup Steps
1. Login/Signup in the app
2. Connect wallet (enter Hedera credentials)
3. **Admin**: Create carbon credit token
4. **Farmer**: Register farm → mint tokens
5. **Admin**: Approve farms
6. **Investor**: Purchase credits
7. **Farmer**: Earn NFT badges as investors grow

## 📈 NFT Tracking

### How to Track NFTs
1. Navigate to **NFT Gallery** page
2. View all earned NFTs with:
   - Rarity tier
   - Minting date
   - Investor count at time of mint
   - Hedera Token ID
   - Link to HashScan explorer

### NFT Metadata
Stored on-chain as JSON:
```json
{
  "name": "Bronze Farmer",
  "level": 1,
  "rarity": "Common",
  "benefits": "...",
  "minted_at": "2024-01-01T00:00:00Z"
}
```

## 💰 Investment Flow

### Current Implementation
1. Investor selects farm from marketplace
2. Enters amount of credits to purchase
3. System calculates: `total = amount × price_per_ton`
4. Records purchase in database
5. Updates farm's available tons
6. Shows success notification

### Payment Settlement
**Current**: Database-recorded transactions
**Production Ready**: 
- Implement HBAR transfers via Hedera SDK
- Or use stablecoin (USDC) for payments
- Add escrow for secure transactions

## ⚠️ Important Notes

### For Demo/Development
- Wallet keys stored in localStorage
- Admin approval simulated
- Payments recorded but not executed on-chain

### For Production
- Use Hedera Wallet Connect (HashPack, Blade)
- Implement proper admin dashboard
- Add real HBAR/stablecoin transfers
- Implement oracle for carbon credit verification
- Add KYC/AML for regulatory compliance

## 🔧 Configuration Files

### Environment Variables
- `VITE_SUPABASE_URL` - Auto-configured
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Auto-configured
- `VITE_TOKEN_ID` - Set after creating fungible token

### Token IDs (localStorage)
- `agripulse_token_id` - Fungible carbon credit token
- `agripulse_nft_token_id` - NFT collection token

## 📱 Mobile Responsiveness
- Fully responsive design
- Touch-optimized interactions
- Mobile-first approach

## 🎯 Future Enhancements
1. Real-time updates via Supabase Realtime
2. Advanced analytics dashboard
3. Multi-language support (currently AR/EN mix)
4. AI-powered carbon verification
5. Integration with IoT sensors
6. Carbon offset retirement certificates
7. Secondary marketplace for NFTs

## 🐛 Known Issues
- NFT minting requires farmer wallet connection
- Admin approval UI needs enhancement
- Need to implement proper token transfer flow

## 📞 Support
For issues or questions:
- Check Hedera docs: docs.hedera.com
- Supabase docs: supabase.com/docs
- Project repo issues

---

**Last Updated**: January 2025
**Version**: 1.0.0 (MVP)
