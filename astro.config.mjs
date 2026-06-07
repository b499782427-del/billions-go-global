import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://saassavvyhub.com',
  outDir: 'public',
  publicDir: 'static',
  build: {
    inlineStylesheets: 'always',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
