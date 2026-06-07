// Utility functions — NO imports from astro:content (Vite limitation)

export function getAllCategorySlugs() {
  return [
    'ai-writing',
    'ai-voice',
    'ai-video',
    'ai-automation',
    'ai-agent',
    'ai-coding',
    'ai-design',
    'ai-marketing',
  ];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function calcReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
