import { Badge } from './badges';

// Badge rarity scoring based on estimated distribution
// These values can be adjusted based on actual collection analysis
const BADGE_RARITY_SCORES: { [key: string]: number } = {
  // Common badges (lower rarity score)
  'any_gvc': 1.0,
  'gamer': 1.2,
  'plants': 1.3,
  'science_goggles': 1.4,
  'toy_bricks': 1.5,
  
  // Uncommon badges
  'rainbow_boombox': 2.0,
  'rainbow_bubble_goggles': 2.1,
  'surfer': 2.2,
  'pothead': 2.3,
  'gradient_lover': 2.4,
  'grayscale_seeker': 2.5,
  'plastic_lover': 2.6,
  'robot_lover': 2.7,
  'ladies_night': 2.8,
  'necks_level': 2.9,
  'vibetown_social_club': 3.0,
  'party_in_the_back': 3.1,
  'ranger': 3.2,
  
  // Rare badges
  'astro_bean': 4.0,
  'cosmic': 4.2,
  'funky_fresh': 4.4,
  'fur_the_win': 4.6,
  'gold_member': 4.8,
  'great_stacheby': 5.0,
  'gud_meat': 5.2,
  'hail_mary_heroes': 5.4,
  
  // Ultra rare badges (higher rarity score)
  'full_send_maverick': 8.0,
  
  // Default for unknown badges
  'default': 1.0
};

export interface BPRData {
  score: number;
  badgeCount: number;
  totalRarityScore: number;
  priceInEth: number;
  badges: Badge[];
}

/**
 * Calculate Badge Price Ratio (BPR) for an NFT
 * BPR = (Badge Count × Average Badge Rarity Score) / Price in ETH
 * 
 * Higher BPR = Better value (more/rarer badges for the price)
 * Lower BPR = Potentially overpriced relative to badge strength
 * 
 * @param badges Array of Badge objects
 * @param priceInEth Current listing price in ETH (0 if not listed)
 * @returns BPRData object with score and breakdown
 */
export function calculateBPR(badges: Badge[], priceInEth: number): BPRData {
  const badgeCount = badges.length;
  
  if (badgeCount === 0) {
    return {
      score: 0,
      badgeCount: 0,
      totalRarityScore: 0,
      priceInEth,
      badges
    };
  }
  
  // Calculate total rarity score
  const totalRarityScore = badges.reduce((total, badge) => {
    const rarityScore = BADGE_RARITY_SCORES[badge.key] || BADGE_RARITY_SCORES.default;
    return total + rarityScore;
  }, 0);
  
  // If not listed, return rarity score as BPR (for sorting unlisted items)
  if (priceInEth <= 0) {
    return {
      score: totalRarityScore,
      badgeCount,
      totalRarityScore,
      priceInEth: 0,
      badges
    };
  }
  
  // Calculate BPR: (Badge Count × Average Rarity) / Price
  const averageRarity = totalRarityScore / badgeCount;
  const bprScore = (badgeCount * averageRarity) / priceInEth;
  
  return {
    score: Math.round(bprScore * 100) / 100, // Round to 2 decimal places
    badgeCount,
    totalRarityScore: Math.round(totalRarityScore * 100) / 100,
    priceInEth,
    badges
  };
}

/**
 * Get BPR rating description
 */
export function getBPRRating(bprScore: number, isListed: boolean): string {
  if (!isListed) {
    return 'Not Listed';
  }
  
  if (bprScore >= 10) return 'Excellent Value';
  if (bprScore >= 5) return 'Great Value';
  if (bprScore >= 2) return 'Good Value';
  if (bprScore >= 1) return 'Fair Value';
  return 'Premium Price';
}

/**
 * Get BPR color based on score
 */
export function getBPRColor(bprScore: number, isListed: boolean): string {
  if (!isListed) {
    return '#aaa';
  }
  
  if (bprScore >= 5) return '#4CAF50'; // Green - Great value
  if (bprScore >= 2) return '#FFC107'; // Yellow - Good value
  if (bprScore >= 1) return '#FF9800'; // Orange - Fair value
  return '#F44336'; // Red - Premium price
}

/**
 * Format BPR for display
 */
export function formatBPR(bprScore: number, isListed: boolean): string {
  if (!isListed) {
    return 'N/A';
  }
  
  // Validate bprScore is a valid number
  if (isNaN(bprScore) || !isFinite(bprScore)) {
    console.warn('Invalid BPR score:', bprScore);
    return 'N/A';
  }
  
  if (bprScore >= 100) {
    return '99+';
  }
  
  return bprScore.toFixed(1);
}