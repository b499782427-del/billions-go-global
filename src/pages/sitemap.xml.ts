import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getAllCategorySlugs } from '../lib/utils';

export const GET: APIRoute = async () => {
  const tools = await getCollection('tools');
  const categorySlugs = getAllCategorySlugs();

  const staticPages = [
    { url: '/', lastmod: new Date().toISOString().split('T')[0], priority: '1.0' },
    { url: '/about/', lastmod: '2026-06-01', priority: '0.5' },
    { url: '/privacy/', lastmod: '2026-06-01', priority: '0.3' },
    { url: '/terms/', lastmod: '2026-06-01', priority: '0.3' },
    { url: '/affiliate-disclosure/', lastmod: '2026-06-01', priority: '0.3' },
  ];

  const categoryPages = categorySlugs.map(slug => ({
    url: `/categories/${slug}/`,
    lastmod: new Date().toISOString().split('T')[0],
    priority: '0.8',
  }));

  const toolPages = tools.map(t => ({
    url: `/tools/${t.slug}/`,
    lastmod: (t.data.updated ?? t.data.date).toISOString().split('T')[0],
    priority: '0.9',
  }));

  const allPages = [...staticPages, ...categoryPages, ...toolPages];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allPages.map(p =>
      `  <url>\n    <loc>https://saassavvyhub.com${p.url}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>`
    ),
    '</urlset>',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
