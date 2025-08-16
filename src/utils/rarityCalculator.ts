import { NFT } from '../types';

// Simple rarity score calculation based on traits
// In a real implementation, this would use actual trait rarity data
export function calculateRarityScore(nft: NFT): number {
  let score = 0;
  
  // Base score
  score = 5000;
  
  // Add/subtract based on traits (mock calculation)
  // In reality, this would be based on trait frequency analysis
  
  // Type rarity
  if (nft.type) {
    const typeScores: Record<string, number> = {
      'Diamond': 2000,
      'Gold': 1500,
      'Silver': 1000,
      'Bronze': 500,
    };
    score += typeScores[nft.type] || 100;
  }
  
  // Gender (assuming balanced distribution)
  if (nft.gender) {
    score += 100;
  }
  
  // Badge count bonus
  const badgeCount = [nft.badge1, nft.badge2, nft.badge3, nft.badge4, nft.badge5].filter(Boolean).length;
  score += badgeCount * 200;
  
  // Trait combinations
  if (nft.background && nft.body && nft.face && nft.hair) {
    score += 300; // Complete trait set bonus
  }
  
  // Ensure score is within reasonable bounds
  score = Math.max(100, Math.min(10000, score));
  
  // Add some randomness for demo purposes
  const variance = Math.floor(Math.random() * 200) - 100;
  score += variance;
  
  return Math.floor(score);
}

// Calculate trait rarity percentages
export function getTraitRarity(trait: string, value: string, allNfts: NFT[]): number {
  const total = allNfts.length;
  const count = allNfts.filter(nft => nft[trait as keyof NFT] === value).length;
  return (count / total) * 100;
}

// Get rarity tier
export function getRarityTier(score: number): { tier: string; color: string } {
  if (score >= 8000) return { tier: 'Legendary', color: '#ff6b6b' };
  if (score >= 6500) return { tier: 'Epic', color: '#c77dff' };
  if (score >= 5000) return { tier: 'Rare', color: '#4dabf7' };
  if (score >= 3500) return { tier: 'Uncommon', color: '#51cf66' };
  return { tier: 'Common', color: '#868e96' };
}