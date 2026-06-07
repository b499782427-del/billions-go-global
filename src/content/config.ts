import { defineCollection, z } from 'astro:content';

const categories = [
  'ai-writing',
  'ai-voice',
  'ai-video',
  'ai-automation',
  'ai-agent',
  'ai-coding',
  'ai-design',
  'ai-marketing',
] as const;

export const categoryMap: Record<string, { name: string; icon: string; description: string }> = {
  'ai-writing':     { name: 'AI Writing',     icon: '✍️', description: 'AI writing assistants & content generators' },
  'ai-voice':       { name: 'AI Voice',       icon: '🎤', description: 'Text-to-speech, voice cloning & audio AI tools' },
  'ai-video':       { name: 'AI Video',       icon: '🎬', description: 'AI video generation & editing platforms' },
  'ai-automation':  { name: 'AI Automation',  icon: '⚡', description: 'Workflow automation & no-code AI agents' },
  'ai-agent':       { name: 'AI Agent',       icon: '🤖', description: 'Autonomous AI agents & digital assistants' },
  'ai-coding':      { name: 'AI Coding',      icon: '💻', description: 'AI-powered code assistants & IDEs' },
  'ai-design':      { name: 'AI Design',      icon: '🎨', description: 'AI graphic design, UI & image generation' },
  'ai-marketing':   { name: 'AI Marketing',   icon: '📊', description: 'AI marketing, SEO & analytics platforms' },
};

export const ratingLabels: Record<string, string> = {
  features:  'Features',
  pricing:   'Pricing',
  usability: 'Usability',
  fit:       'Best For',
};

const toolsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    category: z.enum(categories),
    date: z.date(),
    updated: z.date().optional(),
    website: z.string().url().optional(),
    affiliate_url: z.string().url().optional(),
    affiliate_text: z.string().default('Try Now'),
    coupon: z.string().optional(),
    rating_features: z.number().min(0).max(5).default(0),
    rating_pricing: z.number().min(0).max(5).default(0),
    rating_usability: z.number().min(0).max(5).default(0),
    rating_fit: z.number().min(0).max(5).default(0),
    image: z.string().optional(),
  }),
});

export const collections = {
  tools: toolsCollection,
};
