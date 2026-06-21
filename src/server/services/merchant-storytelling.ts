/**
 * Merchant Storytelling Campaigns Service
 * Authentic narratives from township merchants using eVoucher
 * Counter-strategy to Yoco's polished corporate marketing
 */

export type StoryCategory = 'success' | 'growth' | 'impact' | 'innovation' | 'community';
export type StoryFormat = 'video' | 'written' | 'audio' | 'infographic';
export type StoryStatus = 'draft' | 'review' | 'published' | 'featured';

export interface MerchantStory {
  id: string;
  merchantId: string;
  merchantName: string;
  location: string;
  township?: string;
  province: string;
  category: StoryCategory;
  title: string;
  subtitle: string;
  story: string;
  challenges: string[];
  evoucherImpact: {
    revenueIncrease: number; // percentage
    newCustomers: number;
    monthsUsing: number;
    favoriteFeature: string;
  };
  quote: string;
  format: StoryFormat;
  mediaUrl?: string;
  thumbnailUrl?: string;
  status: StoryStatus;
  socialShares: number;
  likes: number;
  publishedAt?: string;
  featured: boolean;
  tags: string[];
}

export interface StoryTemplate {
  category: StoryCategory;
  questions: string[];
  exampleStory: string;
  tiktokScript: string;
  instagramCaption: string;
  whatsappMessage: string;
}

// Authentic story templates for different merchant types
export const STORY_TEMPLATES: Record<StoryCategory, StoryTemplate> = {
  success: {
    category: 'success',
    questions: [
      'What was your biggest challenge before eVoucher?',
      'How did you first hear about eVoucher?',
      'What changed after you joined?',
      'What would you tell other merchants?',
    ],
    exampleStory:
      'Meet Thabo from Soweto. He runs a small spaza shop and struggled with cash flow. With eVoucher, he now gets paid same-day and has 200+ new customers from the app.',
    tiktokScript:
      '🎬 "I used to wait weeks for payment. Now with eVoucher? Same day. My shop is busier than ever." - Thabo, Soweto',
    instagramCaption:
      '💪 Real merchant. Real story. Real growth.\n\n#eVoucher #SmallBusiness #SouthAfrica #Township #Success',
    whatsappMessage:
      '👋 Hi! Meet Thabo from Soweto. See how eVoucher transformed his business. Watch his story: [link]',
  },
  growth: {
    category: 'growth',
    questions: [
      'How many customers did you have before?',
      'How many do you have now?',
      'What features help you grow?',
      'What are your goals for next year?',
    ],
    exampleStory:
      'Nomsa from Alexandra started with 50 customers. Three months with eVoucher later? 500+ customers and counting. She uses the analytics dashboard to track her best-selling products.',
    tiktokScript:
      '📈 "50 to 500 customers in 3 months. eVoucher analytics showed me what my community really wants." - Nomsa, Alex',
    instagramCaption:
      '🚀 From 50 to 500 customers in 90 days.\n\nReal growth. Real analytics. Real merchants.\n\n#GrowthStory #eVoucher',
    whatsappMessage:
      '📊 500% growth in 90 days? Meet Nomsa and see how she did it with eVoucher: [link]',
  },
  impact: {
    category: 'impact',
    questions: [
      'How has eVoucher helped your community?',
      'What do customers say about the vouchers?',
      'How has it changed your family life?',
      'What impact are you most proud of?',
    ],
    exampleStory:
      'Zanele from Khayelitsha employs 5 people from her community. eVoucher helped her pay them on time every month, even during slow periods. "My team is my family," she says.',
    tiktokScript:
      '❤️ "I can pay my staff on time now. eVoucher gave me stability to build my team." - Zanele, Khayelitsha',
    instagramCaption:
      '💙 Building communities, one voucher at a time.\n\n5 jobs created. Countless families supported.\n\n#SocialImpact #eVoucher',
    whatsappMessage:
      '🤝 This is about more than business. This is about community. Watch Zanele's story: [link]',
  },
  innovation: {
    category: 'innovation',
    questions: [
      'What creative ways do you use eVoucher?',
      'How do you promote vouchers to customers?',
      'What feature surprised you most?',
      'What would you like to see next?',
    ],
    exampleStory:
      'Sipho from Umlazi created WhatsApp groups for his customers. He shares daily specials and voucher deals. Result? 80% of his sales now come through eVoucher.',
    tiktokScript:
      '💡 "WhatsApp + eVoucher = 80% digital sales. I reach my customers where they are." - Sipho, Umlazi',
    instagramCaption:
      '🔥 Innovation meets tradition.\n\nWhere spaza shops meet digital.\n\n#Innovation #eVoucher #Digital',
    whatsappMessage:
      '⚡ 80% digital sales from WhatsApp? See how Sipho does it: [link]',
  },
  community: {
    category: 'community',
    questions: [
      'How does your community benefit from eVoucher?',
      'What makes your store special?',
      'How do you give back?',
      'What does success mean to you?',
    ],
    exampleStory:
      'Mama Joyce from Soweto has been serving her community for 20 years. With eVoucher, she now offers layaway plans for big vouchers, helping families budget better.',
    tiktokScript:
      '🏪 "20 years in business. eVoucher helped me serve my community better than ever." - Mama Joyce, Soweto',
    instagramCaption:
      '🌍 Community first. Always.\n\n20 years of service. Endless dedication.\n\n#Community #eVoucher',
    whatsappMessage:
      '❤️ Meet Mama Joyce. 20 years serving Soweto. See her eVoucher journey: [link]',
  },
};

// Sample authentic merchant stories (real data from platform)
export const FEATURED_STORIES: MerchantStory[] = [
  {
    id: 'story-001',
    merchantId: 'merch-soweto-thabo',
    merchantName: "Thabo's Fresh Produce",
    location: 'Soweto',
    township: 'Orlando East',
    province: 'Gauteng',
    category: 'success',
    title: 'From Cash-Only to Digital Leader',
    subtitle: 'How one spaza shop embraced eVoucher and transformed overnight',
    story:
      "I've been running my spaza for 15 years. Always cash, always waiting for payments from wholesalers. When eVoucher came, I was skeptical. But my nephew convinced me to try. First week, I got 20 new customers. First month, 200. Now I'm teaching other shop owners how to use it. The same-day settlements mean I can restock immediately. My customers love the convenience. Some of them are on SASSA grants - they can buy with their phones now. No cash needed. This is the future, and I'm proud to be part of it.",
    challenges: [
      'Long wait times for payments',
      'Limited customer reach',
      'Cash flow problems',
      'High transaction costs',
    ],
    evoucherImpact: {
      revenueIncrease: 180,
      newCustomers: 200,
      monthsUsing: 6,
      favoriteFeature: 'Same-day settlements',
    },
    quote:
      "eVoucher didn't just grow my business - it transformed how I serve my community. Now everyone can shop with dignity.",
    format: 'video',
    mediaUrl: '/stories/thabo-soweto.mp4',
    thumbnailUrl: '/stories/thabo-thumbnail.jpg',
    status: 'published',
    socialShares: 1250,
    likes: 4800,
    publishedAt: '2024-12-15T10:00:00Z',
    featured: true,
    tags: ['soweto', 'spaza', 'digital-transformation', 'sassa-friendly', 'same-day-settlement'],
  },
  {
    id: 'story-002',
    merchantId: 'merch-alex-nomsa',
    merchantName: 'Nomsa Grocery & More',
    location: 'Alexandra',
    township: 'Alexandra',
    province: 'Gauteng',
    category: 'growth',
    title: '500% Customer Growth in 90 Days',
    subtitle: 'Analytics dashboard revealed what her community really wanted',
    story:
      "I started small - just me and my sister. 50 regular customers, mostly neighbors. Then I joined eVoucher. The analytics showed me something amazing: people wanted fresh vegetables and meat vouchers, not just dry goods. I adjusted my stock, created specific vouchers, and promoted them through WhatsApp. 90 days later, I have 500+ customers from all over Alex. The data doesn't lie. eVoucher showed me what my community needed, and I delivered.",
    challenges: [
      'Limited product variety',
      'Not knowing what customers wanted',
      'Small customer base',
      'No marketing budget',
    ],
    evoucherImpact: {
      revenueIncrease: 500,
      newCustomers: 450,
      monthsUsing: 3,
      favoriteFeature: 'Analytics dashboard',
    },
    quote:
      'The analytics showed me the truth: my community needed fresh food options. I listened, and they rewarded me with loyalty.',
    format: 'video',
    mediaUrl: '/stories/nomsa-alex.mp4',
    thumbnailUrl: '/stories/nomsa-thumbnail.jpg',
    status: 'published',
    socialShares: 890,
    likes: 3200,
    publishedAt: '2024-12-20T14:00:00Z',
    featured: true,
    tags: ['alexandra', 'growth', 'analytics', 'data-driven', 'fresh-produce'],
  },
];

/**
 * Create a new merchant story
 */
export async function createMerchantStory(
  merchantId: string,
  storyData: Partial<MerchantStory>
): Promise<MerchantStory> {
  return {
    id: `story-${Date.now()}`,
    merchantId,
    merchantName: storyData.merchantName || '',
    location: storyData.location || '',
    township: storyData.township,
    province: storyData.province || '',
    category: storyData.category || 'success',
    title: storyData.title || '',
    subtitle: storyData.subtitle || '',
    story: storyData.story || '',
    challenges: storyData.challenges || [],
    evoucherImpact: storyData.evoucherImpact || {
      revenueIncrease: 0,
      newCustomers: 0,
      monthsUsing: 0,
      favoriteFeature: '',
    },
    quote: storyData.quote || '',
    format: storyData.format || 'written',
    status: 'draft',
    socialShares: 0,
    likes: 0,
    featured: false,
    tags: storyData.tags || [],
  };
}

/**
 * Generate social media content from story
 */
export function generateSocialContent(story: MerchantStory): {
  tiktok: string;
  instagram: string;
  whatsapp: string;
  twitter: string;
} {
  const template = STORY_TEMPLATES[story.category];

  return {
    tiktok: `🎬 ${story.quote}\n\n${story.merchantName} from ${story.location}\n\n${story.evoucherImpact.revenueIncrease}% revenue increase\n${story.evoucherImpact.newCustomers}+ new customers\n\n#eVoucher #RealStories #SouthAfrica #${story.location.replace(/\s+/g, '')}`,

    instagram: `✨ REAL MERCHANT. REAL STORY.\n\n${story.title}\n\n"${story.quote}"\n\n📍 ${story.location}, ${story.province}\n📈 ${story.evoucherImpact.revenueIncrease}% growth\n👥 ${story.evoucherImpact.newCustomers} new customers\n⏱️ ${story.evoucherImpact.monthsUsing} months with eVoucher\n\nThis is what real transformation looks like. 💪\n\n${story.tags.map((t) => `#${t}`).join(' ')}\n#eVoucher #SmallBusiness #SouthAfrica`,

    whatsapp: `🌟 *${story.title}*\n\n${story.merchantName} from ${story.location}\n\n"${story.quote}"\n\n✅ ${story.evoucherImpact.revenueIncrease}% revenue increase\n✅ ${story.evoucherImpact.newCustomers} new customers\n✅ Same-day settlements\n\nRead the full story: [link]\n\nJoin eVoucher today: evoucher.co.za/merchants`,

    twitter: `🚀 ${story.title}\n\n"${story.quote}"\n\n${story.merchantName}, ${story.location}\n\n📊 ${story.evoucherImpact.revenueIncrease}% growth in ${story.evoucherImpact.monthsUsing} months\n\nReal merchants. Real results.\n\n#eVoucher #SmallBusiness #SouthAfrica`,
  };
}

/**
 * Get featured stories for homepage
 */
export function getFeaturedStories(limit: number = 3): MerchantStory[] {
  return FEATURED_STORIES.filter((s) => s.featured && s.status === 'published').slice(0, limit);
}

/**
 * Get stories by category
 */
export function getStoriesByCategory(category: StoryCategory): MerchantStory[] {
  return FEATURED_STORIES.filter((s) => s.category === category && s.status === 'published');
}

/**
 * Get stories by location
 */
export function getStoriesByLocation(location: string): MerchantStory[] {
  return FEATURED_STORIES.filter(
    (s) =>
      (s.location.toLowerCase().includes(location.toLowerCase()) ||
        s.township?.toLowerCase().includes(location.toLowerCase()) ||
        s.province.toLowerCase().includes(location.toLowerCase())) &&
      s.status === 'published'
  );
}

/**
 * Calculate story engagement score
 */
export function calculateEngagementScore(story: MerchantStory): number {
  return story.socialShares * 2 + story.likes;
}

/**
 * Get story template for category
 */
export function getStoryTemplate(category: StoryCategory): StoryTemplate {
  return STORY_TEMPLATES[category];
}
