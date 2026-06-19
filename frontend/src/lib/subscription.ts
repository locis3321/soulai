// Subscription and entitlement system for SoulAI

export type SubscriptionTier = "free" | "plus" | "premium";

export interface SubscriptionFeatures {
  // Daily Insights
  dailyInsights: boolean;
  
  // AI Chat
  aiChatMessages: number; // -1 for unlimited
  aiChatHistory: boolean;
  
  // Tarot
  tarotSingleCard: boolean;
  tarotThreeCards: boolean;
  tarotCelticCross: boolean;
  tarotDeepReading: boolean;
  
  // Divination
  astrologyBasic: boolean;
  astrologyDetailed: boolean;
  baziBasic: boolean;
  baziDetailed: boolean;
  ziweiBasic: boolean;
  ziweiDetailed: boolean;
  iching: boolean;
  liuyao: boolean;
  numerology: boolean;
  
  // Healing
  moodCheckIn: boolean;
  breathingExercise: boolean;
  meditationBasic: boolean;
  meditationPremium: boolean;
  journaling: boolean;
  emotionTrends: boolean;
  
  // Reports
  weeklyReport: boolean;
  monthlyReport: boolean;
  yearlyReport: boolean;
  relationshipReport: boolean;
  careerReport: boolean;
  
  // Marketplace
  viewMasters: boolean;
  bookSession: boolean;
  priorityBooking: boolean;
  
  // Community
  viewPosts: boolean;
  createPosts: boolean;
  comment: boolean;
  
  // Profile
  basicProfile: boolean;
  detailedProfile: boolean;
  birthChart: boolean;
  
  // Support
  standardSupport: boolean;
  prioritySupport: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    dailyInsights: true,
    aiChatMessages: 5,
    aiChatHistory: false,
    tarotSingleCard: true,
    tarotThreeCards: false,
    tarotCelticCross: false,
    tarotDeepReading: false,
    astrologyBasic: true,
    astrologyDetailed: false,
    baziBasic: true,
    baziDetailed: false,
    ziweiBasic: true,
    ziweiDetailed: false,
    iching: true,
    liuyao: true,
    numerology: true,
    moodCheckIn: true,
    breathingExercise: true,
    meditationBasic: true,
    meditationPremium: false,
    journaling: true,
    emotionTrends: false,
    weeklyReport: false,
    monthlyReport: false,
    yearlyReport: false,
    relationshipReport: false,
    careerReport: false,
    viewMasters: true,
    bookSession: false,
    priorityBooking: false,
    viewPosts: true,
    createPosts: false,
    comment: false,
    basicProfile: true,
    detailedProfile: false,
    birthChart: false,
    standardSupport: true,
    prioritySupport: false
  },
  plus: {
    dailyInsights: true,
    aiChatMessages: 50,
    aiChatHistory: true,
    tarotSingleCard: true,
    tarotThreeCards: true,
    tarotCelticCross: false,
    tarotDeepReading: false,
    astrologyBasic: true,
    astrologyDetailed: true,
    baziBasic: true,
    baziDetailed: true,
    ziweiBasic: true,
    ziweiDetailed: true,
    iching: true,
    liuyao: true,
    numerology: true,
    moodCheckIn: true,
    breathingExercise: true,
    meditationBasic: true,
    meditationPremium: true,
    journaling: true,
    emotionTrends: true,
    weeklyReport: true,
    monthlyReport: false,
    yearlyReport: false,
    relationshipReport: false,
    careerReport: false,
    viewMasters: true,
    bookSession: true,
    priorityBooking: false,
    viewPosts: true,
    createPosts: true,
    comment: true,
    basicProfile: true,
    detailedProfile: true,
    birthChart: true,
    standardSupport: true,
    prioritySupport: false
  },
  premium: {
    dailyInsights: true,
    aiChatMessages: -1,
    aiChatHistory: true,
    tarotSingleCard: true,
    tarotThreeCards: true,
    tarotCelticCross: true,
    tarotDeepReading: true,
    astrologyBasic: true,
    astrologyDetailed: true,
    baziBasic: true,
    baziDetailed: true,
    ziweiBasic: true,
    ziweiDetailed: true,
    iching: true,
    liuyao: true,
    numerology: true,
    moodCheckIn: true,
    breathingExercise: true,
    meditationBasic: true,
    meditationPremium: true,
    journaling: true,
    emotionTrends: true,
    weeklyReport: true,
    monthlyReport: true,
    yearlyReport: true,
    relationshipReport: true,
    careerReport: true,
    viewMasters: true,
    bookSession: true,
    priorityBooking: true,
    viewPosts: true,
    createPosts: true,
    comment: true,
    basicProfile: true,
    detailedProfile: true,
    birthChart: true,
    standardSupport: true,
    prioritySupport: true
  }
};

export const SUBSCRIPTION_PRICES = {
  free: {
    monthly: 0,
    yearly: 0
  },
  plus: {
    monthly: 4.99,
    yearly: 49.99
  },
  premium: {
    monthly: 9.99,
    yearly: 99.99
  }
};

export interface UserSubscription {
  tier: SubscriptionTier;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  autoRenew: boolean;
}

export function hasFeatureAccess(
  userTier: SubscriptionTier,
  feature: keyof SubscriptionFeatures
): boolean {
  const features = SUBSCRIPTION_FEATURES[userTier];
  const value = features[feature];
  
  if (typeof value === "boolean") {
    return value;
  }
  
  if (typeof value === "number") {
    return value > 0 || value === -1; // -1 means unlimited
  }
  
  return false;
}

export function getFeatureLimit(
  userTier: SubscriptionTier,
  feature: keyof SubscriptionFeatures
): number | boolean {
  const features = SUBSCRIPTION_FEATURES[userTier];
  return features[feature];
}

export function canUseFeature(
  userTier: SubscriptionTier,
  feature: keyof SubscriptionFeatures,
  currentUsage?: number
): boolean {
  const limit = getFeatureLimit(userTier, feature);
  
  if (typeof limit === "boolean") {
    return limit;
  }
  
  if (typeof limit === "number") {
    if (limit === -1) return true; // Unlimited
    if (currentUsage === undefined) return true;
    return currentUsage < limit;
  }
  
  return false;
}

export function getUpgradeRecommendation(
  currentTier: SubscriptionTier,
  desiredFeature: keyof SubscriptionFeatures
): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ["free", "plus", "premium"];
  const currentIndex = tiers.indexOf(currentTier);
  
  for (let i = currentIndex + 1; i < tiers.length; i++) {
    if (hasFeatureAccess(tiers[i], desiredFeature)) {
      return tiers[i];
    }
  }
  
  return null;
}
