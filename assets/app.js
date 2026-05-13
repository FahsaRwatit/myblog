// ═══════════════════════════════════════════════════════════
// 静态博客引擎 — 从 GitHub 仓库直接读 .md 文件
// ═══════════════════════════════════════════════════════════

// Configure marked to use Prism for syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (Prism.languages[lang]) {
      return Prism.highlight(code, Prism.languages[lang], lang);
    }
    return code;
  },
  breaks: false,
  gfm: true
});

// ─── STATE ───
let config = null;
let posts = [];
let currentCatFilter = 'all';

// ─── INIT ───
async function init() {
  showLoading(true);
  try {
    // 1. 加载配置
    config = await loadConfig();
    applyConfig();

    // 2. 加载文章索引
    posts = await loadPostsIndex();

    // 3. 渲染分类导航 + 路由
    renderCategoryNav();
    setupRouter();
    handleRoute();
  } catch (err) {
    console.error('Init failed:', err);
    document.getElementById('homeView').innerHTML =
      `<div class="empty-state" style="padding:60px 0;">
        <p style="color:var(--accent);margin-bottom:8px;">⚠ 加载失败</p>
        <p>${err.message}</p>
        <p style="margin-top:12px;font-size:11px;">请确认 config.json 和 posts/index.json 存在</p>
      </div>`;
    document.getElementById('homeView').classList.add('active');
  } finally {
    showLoading(false);
  }
}

function showLoading(on) {
  document.getElementById('loadingState').classList.toggle('active', on);
  if (on) document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
}

// ─── CONFIG ───
async function loadConfig() {
  const res = await fetch('config.json?t=' + Date.now());
  if (!res.ok) throw new Error('找不到 config.json');
  return await res.json();
}

function applyConfig() {
  document.title = config.site.title;
  document.getElementById('siteTitle').textContent = config.site.title;
  document.getElementById('siteTagline').textContent = config.site.tagline;
  document.querySelector('.logo').textContent = config.site.logo || 'blog.dev';

  // social links
  const footer = document.getElementById('sidebarFooter');
  footer.innerHTML = (config.social || []).map(s =>
    `<a href="${s.url}" target="_blank" rel="noopener">${s.icon || '◆'} ${s.label}</a>`
  ).join('');
}

// ─── POSTS INDEX ───
async function loadPostsIndex() {
  const res = await fetch('posts/index.json?t=' + Date.now());
  if (!res.ok) throw new Error('找不到 posts/index.json');
  const list = await res.json();
  return list.sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function loadPostContent(slug) {
  const res = await fetch(`posts/${slug}.md?t=` + Date.now());
  if (!res.ok) throw new Error('文章不存在');
  const raw = await res.text();
  return parseMarkdown(raw);
}

// 解析 frontmatter (---  yaml  ---)
function parseMarkdown(raw) {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!fmMatch) return { meta: {}, content: raw };
  try {
    const meta = jsyaml.load(fmMatch[1]) || {};
    return { meta, content: fmMatch[2] };
  } catch (e) {
    return { meta: {}, content: fmMatch[2] };
  }
}

// ─── CATEGORIES ───
function getAllCategories() {
  const cats = new Set();
  posts.forEach(p => { if (p.category) cats.add(p.category); });
  return Array.from(cats);
}

function renderCategoryNav() {
  const nav = document.getElementById('catNav');
  const cats = getAllCategories();
  if (!cats.length) { nav.innerHTML = ''; return; }

  nav.innerHTML = `<div class="nav-label">分类</div>` + cats.map(cat => {
    const count = posts.filter(p => p.category === cat).length;
    return `<a class="nav-item" href="#/category/${encodeURIComponent(cat)}" data-route="category-${cat}">
      <span class="nav-icon">▸</span> ${cat}
      <span class="nav-count">${count}</span>
    </a>`;
  }).join('');
}

// ─── ROUTER ───
function setupRouter() {
  window.addEventListener('hashchange', handleRoute);
}

function handleRoute() {
  const hash = location.hash.slice(1) || '/';

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  if (hash === '/' || hash === '') {
    showView('home');
    setActive('home');
    renderHome();
    setTopbar('最新文章');
  } else if (hash === '/about') {
    showView('about');
    setActive('about');
    renderAbout();
    setTopbar('关于我');
  } else if (hash === '/archive') {
    showView('archive');
    setActive('archive');
    currentCatFilter = 'all';
    renderArchive();
    setTopbar('所有文章');
  } else if (hash.startsWith('/category/')) {
    const cat = decodeURIComponent(hash.slice(10));
    showView('archive');
    setActive('category-' + cat);
    currentCatFilter = cat;
    renderArchive();
    setTopbar('分类 · ' + cat);
  } else if (hash.startsWith('/post/')) {
    const slug = decodeURIComponent(hash.slice(6));
    renderArticle(slug);
    setTopbar('文章详情');
  } else {
    showView('notFound');
    setTopbar('页面未找到');
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showView(id) {
  document.getElementById(id + 'View').classList.add('active');
}

function setActive(route) {
  const el = document.querySelector(`.nav-item[data-route="${route}"]`);
  if (el) el.classList.add('active');
}

function setTopbar(txt) {
  document.getElementById('topbarTitle').textContent = txt;
}

// ─── HOME ───
function renderHome() {
  if (!posts.length) {
    document.getElementById('featuredPost').innerHTML = '';
    document.getElementById('postGrid').innerHTML =
      '<div class="empty-state">还没有文章。在 posts/ 目录添加 .md 文件即可。</div>';
    return;
  }

  const featured = posts[0];
  const rest = posts.slice(1);

  document.getElementById('featuredPost').innerHTML = `
    <a class="featured-post" href="#/post/${encodeURIComponent(featured.slug)}">
      <div class="post-badge">✦ 最新发布</div>
      <div class="post-title-lg">${escapeHtml(featured.title)}</div>
      <div class="post-excerpt">${escapeHtml(featured.excerpt || '')}</div>
      <div class="post-meta">
        ${featured.category ? `<span class="post-tag">${escapeHtml(featured.category)}</span>` : ''}
        <span>${featured.date}</span>
        ${featured.readTime ? `<span>${featured.readTime}</span>` : ''}
      </div>
    </a>`;

  document.getElementById('postGrid').innerHTML = rest.map(p => `
    <a class="post-card" href="#/post/${encodeURIComponent(p.slug)}">
      ${p.category ? `<div class="post-card-cat">${escapeHtml(p.category)}</div>` : ''}
      <div class="post-card-title">${escapeHtml(p.title)}</div>
      <div class="post-card-excerpt">${escapeHtml(p.excerpt || '')}</div>
      <div class="post-card-meta">
        <span>${p.date}</span>
        ${p.readTime ? `<span>${p.readTime}</span>` : ''}
      </div>
    </a>`).join('');
}

// ─── ARCHIVE ───
function renderArchive() {
  // category filter bar
  const cats = getAllCategories();
  const bar = document.getElementById('catFilterBar');
  bar.innerHTML = `<button class="cat-filter ${currentCatFilter === 'all' ? 'active' : ''}" onclick="setCatFilter('all')">全部</button>` +
    cats.map(c => `<button class="cat-filter ${currentCatFilter === c ? 'active' : ''}" onclick="setCatFilter('${escapeAttr(c)}')">${escapeHtml(c)}</button>`).join('');
  filterPosts();
}

function setCatFilter(cat) {
  currentCatFilter = cat;
  renderArchive();
}

function filterPosts() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const filtered = posts.filter(p => {
    const matchCat = currentCatFilter === 'all' || p.category === currentCatFilter;
    const matchQ = !q || p.title.toLowerCase().includes(q) ||
                   (p.excerpt || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const el = document.getElementById('archiveList');
  if (!filtered.length) {
    el.innerHTML = '<div class="empty-state">没有找到相关文章</div>';
    return;
  }

  el.innerHTML = filtered.map(p => `
    <a class="post-card" href="#/post/${encodeURIComponent(p.slug)}" style="margin-bottom:12px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:20px;">
      ${p.category ? `<div class="post-card-cat" style="white-space:nowrap">${escapeHtml(p.category)}</div>` : '<div></div>'}
      <div>
        <div class="post-card-title" style="font-size:16px">${escapeHtml(p.title)}</div>
        <div class="post-card-excerpt" style="font-size:13px;margin-bottom:0">${escapeHtml(p.excerpt || '')}</div>
      </div>
      <div class="post-card-meta" style="white-space:nowrap;flex-direction:column;text-align:right">
        <span>${p.date}</span>
        ${p.readTime ? `<span>${p.readTime}</span>` : ''}
      </div>
    </a>`).join('');
}

// ─── ARTICLE ───
async function renderArticle(slug) {
  const meta = posts.find(p => p.slug === slug);
  if (!meta) { showView('notFound'); return; }

  showLoading(true);
  try {
    const { content } = await loadPostContent(slug);
    document.getElementById('articleCat').textContent = meta.category || '';
    document.getElementById('articleTitle').textContent = meta.title;
    document.getElementById('articleMeta').innerHTML = `
      <span>${meta.date}</span>
      ${meta.readTime ? `<span>·</span><span>${meta.readTime}</span>` : ''}`;
    document.getElementById('articleBody').innerHTML = marked.parse(content);
    showView('article');
    // re-highlight after DOM update
    if (window.Prism) Prism.highlightAllUnder(document.getElementById('articleBody'));
  } catch (err) {
    document.getElementById('articleBody').innerHTML = `<p class="text-muted">⚠ ${err.message}</p>`;
    document.getElementById('articleTitle').textContent = '文章加载失败';
    showView('article');
  } finally {
    showLoading(false);
  }
}

// ─── ABOUT ───
async function renderAbout() {
  showLoading(true);
  try {
    const res = await fetch('about.md?t=' + Date.now());
    if (!res.ok) throw new Error('找不到 about.md');
    const raw = await res.text();
    const { content } = parseMarkdown(raw);
    document.getElementById('aboutBody').innerHTML = marked.parse(content);
    showView('about');
    if (window.Prism) Prism.highlightAllUnder(document.getElementById('aboutBody'));
  } catch (err) {
    document.getElementById('aboutBody').innerHTML = `<p class="text-muted">⚠ ${err.message}</p>`;
    showView('about');
  } finally {
    showLoading(false);
  }
}

// ─── HELPERS ───
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }

// ─── START ───
init();
