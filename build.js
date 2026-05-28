const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src");
const PUBLIC = path.join(__dirname, "public");
const TEMPLATE = fs.readFileSync(path.join(SRC, "template.html"), "utf-8");
const POSTS_DIR = path.join(SRC, "posts");
const PAGES_DIR = path.join(SRC, "pages");

// ===== 简易 Markdown 转 HTML =====
function mdToHtml(md) {
  let html = md;

  // 代码块 (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // 标题
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // 粗体 / 斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // 引用块
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // 水平线
  html = html.replace(/^---$/gm, "<hr>");

  // 无序列表
  html = html.replace(/^[\*\-] (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // 有序列表
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  // 避免重复包装
  html = html.replace(/<ul>\s*<ul>/g, "<ul>");
  html = html.replace(/<\/ul>\s*<\/ul>/g, "</ul>");

  // 段落（连续的非空行，且不以标签开头）
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, "<p>$1</p>");

  // 清理多余空行
  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/\n{3,}/g, "\n\n");

  return html.trim();
}

// ===== 读取 Markdown 文件的 frontmatter =====
function parseFrontmatter(filepath) {
  const raw = fs.readFileSync(filepath, "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { body: raw, meta: {} };

  const metaStr = match[1];
  const body = match[2];
  const meta = {};

  metaStr.split("\n").forEach((line) => {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) meta[m[1].trim()] = m[2].trim();
  });

  return { meta, body };
}

// ===== 日期格式化 =====
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ===== 清理路径 =====
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ===== 获取所有文章 =====
function getAllPosts() {
  const posts = [];
  const categories = fs.readdirSync(POSTS_DIR);

  for (const cat of categories) {
    const catDir = path.join(POSTS_DIR, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;

    const files = fs.readdirSync(catDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const { meta, body } = parseFrontmatter(path.join(catDir, file));
      const slug = file.replace(/\.md$/, "");
      posts.push({
        title: meta.title || slug,
        date: meta.date || "2026-01-01",
        category: cat,
        categoryLabel:
          cat === "shopify-deals"
            ? "Shopify Deals"
            : cat === "hosting-coupons"
              ? "Hosting Coupons"
              : "Design Hacks",
        description: meta.description || "",
        slug: slug,
        path: `/${cat}/${slug}/`,
        body: body,
      });
    }
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

// ===== 替换模板变量 =====
function renderPage(vars) {
  let html = TEMPLATE;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return html;
}

// ===== 拷贝 assets =====
function copyAssets() {
  const srcAssets = path.join(SRC, "assets");
  const dstAssets = path.join(PUBLIC, "assets");
  fs.mkdirSync(dstAssets, { recursive: true });
  fs.cpSync(srcAssets, dstAssets, { recursive: true });
}

// ===== 构建 =====
function build() {
  // 清空 public
  if (fs.existsSync(PUBLIC)) {
    fs.rmSync(PUBLIC, { recursive: true });
  }
  fs.mkdirSync(PUBLIC, { recursive: true });

  const allPosts = getAllPosts();
  const allCategories = ["shopify-deals", "hosting-coupons", "design-hacks"];
  const categories = [...new Set([...allCategories, ...allPosts.map((p) => p.category)])];

  // ----- 拷贝静态资源 -----
  copyAssets();

  // ----- 首页 -----
  const postCards = allPosts
    .map(
      (p) => `
    <article class="post-card">
      <div class="post-category">
        <a href="/${p.category}/">${p.categoryLabel}</a>
      </div>
      <h2><a href="${p.path}">${p.title}</a></h2>
      <div class="post-meta">${formatDate(p.date)}</div>
      <div class="post-excerpt">${p.description}</div>
    </article>`
    )
    .join("\n");

  const homeHtml = renderPage({
    title: "SaaS Deals, Honest Reviews & Smart Hacks",
    description:
      "Honest reviews of SaaS tools, hosting coupons, and design hacks to help you save money and work smarter.",
    path: "/",
    ogType: "website",
    content: `
    <section class="hero">
      <h1>SaaS Savvy Hub</h1>
      <p>Honest SaaS reviews, verified hosting coupons, and practical design hacks — helping you save money and work smarter.</p>
    </section>
    <nav class="category-nav">
      <a href="/" class="active">All Posts</a>
      ${categories
        .map((cat) => {
          const label =
            cat === "shopify-deals"
              ? "Shopify Deals"
              : cat === "hosting-coupons"
                ? "Hosting Coupons"
                : "Design Hacks";
          return `<a href="/${cat}/">${label}</a>`;
        })
        .join("\n")}
    </nav>
    <div class="post-list">${postCards}</div>`,
  });

  fs.writeFileSync(path.join(PUBLIC, "index.html"), homeHtml);

  // ----- 分类页 -----
  for (const cat of categories) {
    const catPosts = allPosts.filter((p) => p.category === cat);
    const catLabel =
      cat === "shopify-deals"
        ? "Shopify Deals"
        : cat === "hosting-coupons"
          ? "Hosting Coupons"
          : "Design Hacks";

    const catCards = catPosts
      .map(
        (p) => `
    <article class="post-card">
      <h2><a href="${p.path}">${p.title}</a></h2>
      <div class="post-meta">${formatDate(p.date)}</div>
      <div class="post-excerpt">${p.description}</div>
    </article>`
      )
      .join("\n");

    const catDir = path.join(PUBLIC, cat);
    fs.mkdirSync(catDir, { recursive: true });

    const catHtml = renderPage({
      title: catLabel,
      description: `All ${catLabel} articles on SaaS Savvy Hub.`,
      path: `/${cat}/`,
      ogType: "website",
      content: `
      <h1 class="page-title">${catLabel}</h1>
      <nav class="category-nav">
        <a href="/">All Posts</a>
        ${categories
          .map((c) => {
            const label =
              c === "shopify-deals"
                ? "Shopify Deals"
                : c === "hosting-coupons"
                  ? "Hosting Coupons"
                  : "Design Hacks";
            const active = c === cat ? ' class="active"' : "";
            return `<a href="/${c}/"${active}>${label}</a>`;
          })
          .join("\n")}
      </nav>
      <div class="post-list">${catCards || "<p>No posts yet — check back soon!</p>"}</div>`,
    });

    fs.writeFileSync(path.join(catDir, "index.html"), catHtml);
  }

  // ----- 文章详情页 -----
  for (const post of allPosts) {
    const postDir = path.join(PUBLIC, post.category, post.slug);
    fs.mkdirSync(postDir, { recursive: true });

    const postHtml = renderPage({
      title: post.title,
      description: post.description,
      path: post.path,
      ogType: "article",
      content: `
      <article>
        <header class="post-header">
          <div class="post-category">
            <a href="/${post.category}/">${post.categoryLabel}</a>
          </div>
          <h1>${post.title}</h1>
          <div class="post-meta">${formatDate(post.date)}</div>
        </header>
        <div class="post-content">${mdToHtml(post.body)}</div>
      </article>
      <p style="margin-top:2rem"><a href="/">&larr; Back to all posts</a></p>`,
    });

    fs.writeFileSync(path.join(postDir, "index.html"), postHtml);
  }

  // ----- 静态页面（About / Privacy / Contact）-----
  const pageFiles = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith(".md"));
  for (const file of pageFiles) {
    const slug = file.replace(/\.md$/, "");
    const { meta, body } = parseFrontmatter(path.join(PAGES_DIR, file));
    const pageDir = path.join(PUBLIC, slug);
    fs.mkdirSync(pageDir, { recursive: true });

    const pageHtml = renderPage({
      title: meta.title || slug,
      description: meta.description || "",
      path: `/${slug}/`,
      ogType: "website",
      content: `
      <h1 class="page-title">${meta.title || slug}</h1>
      <div class="post-content">${mdToHtml(body)}</div>`,
    });

    fs.writeFileSync(path.join(pageDir, "index.html"), pageHtml);
  }

  console.log(`[OK] Build complete! ${allPosts.length} posts, ${pageFiles.length} pages.`);
  console.log(`[OK] Output: ${PUBLIC}`);
}

build();
