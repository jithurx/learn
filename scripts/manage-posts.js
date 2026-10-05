import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const postsDir = path.join(projectRoot, 'src', 'content', 'docs', 'posts');
const publicImagesDir = path.join(projectRoot, 'public', 'images');

const PORT = 3000;

// Sub-wiki model: each folder under posts/<slug>/ is its own mini-wiki.
// - index.md            -> post landing / overview (has `number`, shows on homepage)
// - any other *.md     -> sub-wiki page (no `number`, only visible inside that post's sidebar)

function slugifyTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
}

function parseFrontmatterField(content, field) {
  // Matches `field: "value"`, `field: 'value'`, or `field: value`
  const m = content.match(new RegExp(`^${field}:\\s*"?([^"\\n]+?)"?\\s*$`, 'm'));
  return m ? m[1].trim() : null;
}

function safePageFile(file) {
  if (!file) return 'index.md';
  // Prevent path traversal; allow nested paths like `guides/setup.md`
  const normalized = path.posix.normalize(String(file).replace(/\\/g, '/'));
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) return null;
  if (!/\.mdx?$/.test(normalized)) return null;
  return normalized;
}

function walkMdFiles(dir, base = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMdFiles(full, rel));
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

function getPostPages(slug) {
  const postDir = path.join(postsDir, slug);
  const files = walkMdFiles(postDir);
  const pages = [];
  for (const file of files) {
    if (file === 'index.md' || file === 'index.mdx') continue; // overview, not a sub-page
    const full = path.join(postDir, file);
    let title = file;
    try {
      const content = fs.readFileSync(full, 'utf-8');
      title = parseFrontmatterField(content, 'title') || file;
    } catch {}
    pages.push({ file, title });
  }
  return pages.sort((a, b) => a.file.localeCompare(b.file));
}

function getAllPosts() {
  if (!fs.existsSync(postsDir)) return [];
  
  const folders = fs.readdirSync(postsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
    
  const posts = [];
  
  for (const slug of folders) {
    const indexPath = path.join(postsDir, slug, 'index.md');
    const indexMdx = path.join(postsDir, slug, 'index.mdx');
    const realIndex = fs.existsSync(indexPath) ? indexPath : fs.existsSync(indexMdx) ? indexMdx : null;
    if (realIndex) {
      const content = fs.readFileSync(realIndex, 'utf-8');
      
      const titleMatch = content.match(/^title:\s*"?(.*?)"?$/m);
      const numberMatch = content.match(/^number:\s*(\d+)/m);
      const coverMatch = content.match(/^coverImage:\s*"?(.*?)"?$/m);
      
      posts.push({
        slug,
        title: titleMatch ? titleMatch[1] : slug,
        number: numberMatch ? parseInt(numberMatch[1], 10) : 0,
        coverImage: coverMatch ? coverMatch[1] : null,
        pages: getPostPages(slug),
      });
    }
  }
  
  return posts.sort((a, b) => b.number - a.number);
}

function getNextPostNumber() {
  const posts = getAllPosts();
  return posts.length > 0 ? posts[0].number + 1 : 1;
}

const htmlDashboard = (posts) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CMS Dashboard</title>
  <style>
    :root { --bg: #282828; --fg: #ebdbb2; --card-bg: #3c3836; --border: #504945; --accent: #b8bb26; --accent-hover: #98971a; --danger: #cc241d; --danger-hover: #fb4934; }
    body { background-color: var(--bg); color: var(--fg); font-family: sans-serif; margin: 0; padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    h1 { color: var(--accent); margin: 0; }
    .sub { color: #a89984; margin: 0 0 2rem 0; font-size: 0.9rem; }
    .btn { padding: 0.75rem 1.5rem; background-color: var(--accent); color: var(--bg); border: none; border-radius: 4px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn:hover { background-color: var(--accent-hover); }
    .btn-small { padding: 0.4rem 0.8rem; font-size: 0.85rem; }
    .btn-danger { background-color: var(--danger); color: white; }
    .btn-danger:hover { background-color: var(--danger-hover); }
    .btn-ghost { background: transparent; color: var(--fg); border: 1px solid var(--border); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
    .card-img { width: 100%; height: 180px; object-fit: cover; background: #1d2021; }
    .card-content { padding: 1rem; flex-grow: 1; }
    .card-title { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
    .card-actions { padding: 1rem; border-top: 1px solid var(--border); display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap; }
    .pages { margin: 0.75rem 0 0 0; padding: 0; list-style: none; border-top: 1px solid var(--border); padding-top: 0.75rem; }
    .pages li { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.35rem 0; font-size: 0.9rem; }
    .pages code { color: #a89984; font-size: 0.8rem; display: block; }
    .newpage { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
    .newpage input { flex: 1; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--fg); }
  </style>
</head>
<body>
  <div class="header">
    <h1>Post Dashboard</h1>
    <a href="/add" class="btn">Create New Post</a>
  </div>
  <p class="sub">Each post is its own sub-wiki: <code>posts/&lt;slug&gt;/index.md</code> is the landing page, any other <code>.md</code> in that folder is a sub-wiki page.</p>
  
  <div class="grid">
    ${posts.map(post => `
      <div class="card">
        ${post.coverImage ? `<img src="${post.coverImage}" class="card-img" alt="Cover">` : '<div class="card-img"></div>'}
        <div class="card-content">
          <span style="font-size:0.8rem; color:#a89984;">#${post.number}</span>
          <h3 class="card-title">${post.title}</h3>
          <p style="margin:0; font-size:0.9rem; color:#a89984;">Slug: ${post.slug} · ${post.pages.length} sub-page(s)</p>
          <ul class="pages">
            ${(post.pages || []).map(p => `
              <li>
                <div><div>${p.title}</div><code>${p.file}</code></div>
                <div style="display:flex; gap:0.4rem;">
                  <a href="/edit?slug=${post.slug}&file=${encodeURIComponent(p.file)}" target="_blank" class="btn btn-small btn-ghost">Edit</a>
                  <button onclick="deletePage('${post.slug}', '${p.file}')" class="btn btn-small btn-danger">Del</button>
                </div>
              </li>
            `).join('')}
            ${(post.pages || []).length === 0 ? '<li style="color:#a89984;">No sub-pages yet — single-page sub-wiki.</li>' : ''}
          </ul>
          <div class="newpage">
            <input id="new-${post.slug}" placeholder="New sub-page title…">
            <button onclick="createPage('${post.slug}')" class="btn btn-small">+ Page</button>
          </div>
        </div>
        <div class="card-actions">
          <a href="/edit?slug=${post.slug}&file=index.md" target="_blank" class="btn btn-small">Edit overview</a>
          <button onclick="deletePost('${post.slug}')" class="btn btn-small btn-danger">Delete post</button>
        </div>
      </div>
    `).join('')}
    ${posts.length === 0 ? '<p>No posts found.</p>' : ''}
  </div>

  <script>
    async function createPage(slug) {
      const input = document.getElementById('new-' + slug);
      const title = (input.value || '').trim();
      if (!title) return alert('Enter a sub-page title first');
      const res = await fetch('/create-page', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.file) window.open('/edit?slug=' + slug + '&file=' + encodeURIComponent(data.file), '_blank'), window.location.reload();
      else alert('Failed to create page: ' + (data.error || res.status));
    }
    async function deletePage(slug, file) {
      if (!confirm('Delete sub-page ' + file + '?')) return;
      const res = await fetch('/delete-page', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, file })
      });
      if (res.ok) window.location.reload();
      else alert('Failed to delete page');
    }
    async function deletePost(slug) {
      if (confirm('Are you sure you want to delete this post and ALL its sub-pages? This cannot be undone.')) {
        try {
          const res = await fetch('/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug })
          });
          if (res.ok) window.location.reload();
          else alert('Failed to delete');
        } catch (err) {
          alert('Error: ' + err);
        }
      }
    }
  </script>
</body>
</html>
`;

const htmlForm = (nextNumber) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Create New Post</title>
  <style>
    :root { --bg: #282828; --fg: #ebdbb2; --input-bg: #3c3836; --border: #504945; --accent: #b8bb26; --accent-hover: #98971a; }
    body { background-color: var(--bg); color: var(--fg); font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 2rem; }
    .container { background: var(--input-bg); padding: 2rem; border-radius: 8px; border: 1px solid var(--border); width: 100%; max-width: 500px; position: relative; }
    .back { position: absolute; top: 1rem; left: 1rem; color: #a89984; text-decoration: none; font-size: 0.9rem; }
    .back:hover { color: var(--fg); }
    h1 { margin-top: 1rem; color: var(--accent); text-align: center; }
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
    input[type="text"], input[type="date"], input[type="number"], input[type="file"] { width: 100%; padding: 0.75rem; border-radius: 4px; border: 1px solid var(--border); background-color: var(--bg); color: var(--fg); font-size: 1rem; box-sizing: border-box; }
    button { width: 100%; padding: 1rem; background-color: var(--accent); color: var(--bg); border: none; border-radius: 4px; font-size: 1.1rem; font-weight: bold; cursor: pointer; }
    button:hover { background-color: var(--accent-hover); }
    button:disabled { background-color: var(--border); cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back">← Back to Dashboard</a>
    <h1>Create New Post</h1>
    <p style="color:#a89984; font-size:0.9rem;">Creates a new sub-wiki at <code>posts/&lt;slug&gt;/</code>. Add sub-pages afterwards from the dashboard.</p>
    <form id="postForm">
      <div class="form-group"><label>Post Title</label><input type="text" id="title" required></div>
      <div class="form-group"><label>Description</label><input type="text" id="description" required placeholder="A short summary of the post"></div>
      <div class="form-group"><label>Cover Image</label><input type="file" id="coverImage" accept="image/*" required></div>
      
      <div class="form-group"><label>Downloadable Attachments (PDFs, Docs, etc.) - Optional</label><input type="file" id="attachments" multiple></div>

      <div class="form-group" style="display: flex; gap: 1rem;">
        <div style="flex: 1;"><label>Post Number</label><input type="number" id="number" value="${nextNumber}" required></div>
        <div style="flex: 1;"><label>Date</label><input type="date" id="date" value="${new Date().toISOString().split('T')[0]}" required></div>
      </div>
      <button type="submit" id="submitBtn">Generate Post</button>
    </form>
  </div>
  <script>
    document.getElementById('postForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      btn.textContent = 'Generating...'; btn.disabled = true;

      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const number = document.getElementById('number').value;
      const date = document.getElementById('date').value;
      const fileInput = document.getElementById('coverImage');
      const attachmentInput = document.getElementById('attachments');
      const file = fileInput.files[0];

      if (!file) return;
      
      const attachments = [];
      if (attachmentInput.files.length > 0) {
        for (let i = 0; i < attachmentInput.files.length; i++) {
          const attFile = attachmentInput.files[i];
          const attData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ name: attFile.name, base64: e.target.result.split(',')[1] });
            reader.readAsDataURL(attFile);
          });
          attachments.push(attData);
        }
      }

      const reader = new FileReader();
      reader.onload = async function(event) {
        const payload = { title, description, number, date, fileName: file.name, imageBase64: event.target.result.split(',')[1], attachments };
        try {
          const res = await fetch('/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const data = await res.json();
          if (data.slug) window.location.href = '/edit?slug=' + data.slug + '&file=index.md';
          else { alert('Failed'); btn.textContent = 'Generate Post'; btn.disabled = false; }
        } catch (err) { alert('Error: ' + err); btn.disabled = false; }
      };
      reader.readAsDataURL(file);
    });
  </script>
</body>
</html>
`;

const htmlEditor = (slug, file, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Edit ${slug}/${file}</title>
  <link rel="stylesheet" href="https://unpkg.com/easymde/dist/easymde.min.css">
  <style>
    body { background-color: #282828; color: #ebdbb2; font-family: sans-serif; margin: 0; padding: 20px; }
    .editor-toolbar { background-color: #3c3836 !important; border-color: #504945 !important; }
    .editor-toolbar a, .editor-toolbar button { color: #ebdbb2 !important; }
    .editor-toolbar a.active, .editor-toolbar a:hover, .editor-toolbar button:hover { background: #504945 !important; border-color: #504945 !important; }
    .CodeMirror { background-color: #3c3836 !important; color: #ebdbb2 !important; border-color: #504945 !important; font-family: monospace; height: calc(100vh - 180px); }
    .CodeMirror-cursor { border-left: 1px solid #ebdbb2 !important; }
    .editor-preview { background-color: #282828 !important; color: #ebdbb2 !important; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    h1 { color: #b8bb26; margin: 0; font-size: 1.2rem; }
    .save-btn { background-color: #b8bb26; color: #282828; border: none; padding: 10px 20px; font-weight: bold; font-size: 1rem; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;}
    .save-btn:hover { background-color: #98971a; }
    .save-btn:disabled { background-color: #504945; cursor: not-allowed; }
    .upload-widget { margin-bottom: 1rem; padding: 1rem; background: #3c3836; border-radius: 4px; border: 1px dashed #504945; display: flex; gap: 1rem; align-items: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Editing: ${slug}/${file}</h1>
    <div>
      <button class="save-btn" id="saveBtn">Save Changes</button>
      <button class="save-btn" id="saveCloseBtn" style="background-color: #fabd2f; margin-left:10px;">Save & Close</button>
    </div>
  </div>
  
  <div class="upload-widget">
    <div>
      <h4 style="margin: 0 0 0.5rem 0; color: #b8bb26;">Add Attachments (PDFs, Docs, etc.)</h4>
      <input type="file" id="newAttachments" multiple style="background: transparent; border: none; color: #ebdbb2;">
    </div>
    <button id="uploadAttachmentsBtn" class="save-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin-left: auto;">Upload & Insert Links</button>
  </div>

  <textarea id="editor">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
  
  <script src="https://unpkg.com/easymde/dist/easymde.min.js"></script>
  <script>
    const easyMDE = new EasyMDE({ element: document.getElementById('editor'), spellChecker: false, status: ["lines", "words"] });
    
    async function save(close = false) {
      const btn1 = document.getElementById('saveBtn');
      const btn2 = document.getElementById('saveCloseBtn');
      btn1.disabled = true; btn2.disabled = true;
      try {
        const res = await fetch('/update-content', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: '${slug}', file: '${file}', content: easyMDE.value() })
        });
        if (res.ok) {
          if (close) {
             window.close();
             window.location.href = '/'; 
          } else {
             btn1.textContent = 'Saved!';
             setTimeout(() => { btn1.textContent = 'Save Changes'; btn1.disabled = false; btn2.disabled = false; }, 2000);
          }
        } else {
          alert('Failed to save');
          btn1.disabled = false; btn2.disabled = false;
        }
      } catch (err) { alert('Error: ' + err); btn1.disabled = false; btn2.disabled = false; }
    }

    document.getElementById('saveBtn').addEventListener('click', () => save(false));
    document.getElementById('saveCloseBtn').addEventListener('click', () => save(true));
    
    document.getElementById('uploadAttachmentsBtn').addEventListener('click', async () => {
      const files = document.getElementById('newAttachments').files;
      if (!files.length) return alert('Select files first');
      
      const btn = document.getElementById('uploadAttachmentsBtn');
      btn.textContent = 'Uploading...'; btn.disabled = true;
      
      const attachments = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({ name: file.name, base64: e.target.result.split(',')[1] });
          reader.readAsDataURL(file);
        });
        attachments.push(data);
      }
      
      try {
        const res = await fetch('/upload-attachment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: '${slug}', attachments })
        });
        if (res.ok) {
          let insertMd = '\\n\\n';
          for (const att of attachments) {
            insertMd += '- [' + att.name + '](/files/${slug}/' + att.name + ')\\n';
          }
          easyMDE.value(easyMDE.value() + insertMd);
          document.getElementById('newAttachments').value = '';
        } else alert('Upload failed');
      } catch(err) { alert('Error: ' + err); }
      btn.textContent = 'Upload & Insert Links'; btn.disabled = false;
    });
  </script>
</body>
</html>
`;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
  if (req.method === 'GET' && req.url === '/') {
    const posts = getAllPosts();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlDashboard(posts));
  } 
  else if (req.method === 'GET' && req.url.startsWith('/images/')) {
    const imagePath = path.join(projectRoot, 'public', req.url);
    if (fs.existsSync(imagePath)) {
      const ext = path.extname(imagePath).toLowerCase();
      const mimeTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(imagePath));
    } else {
      res.writeHead(404), res.end();
    }
  }
  else if (req.method === 'GET' && req.url === '/add') {
    const nextNumber = getNextPostNumber();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlForm(nextNumber));
  }
  else if (req.method === 'GET' && req.url.startsWith('/edit')) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const slug = url.searchParams.get('slug');
    const fileParam = url.searchParams.get('file') || 'index.md';
    if (!slug) { res.writeHead(400); res.end('Missing slug'); return; }
    const file = safePageFile(fileParam);
    if (!file) { res.writeHead(400); res.end('Invalid file'); return; }
    const fullPath = path.join(postsDir, slug, file);
    if (!fs.existsSync(fullPath)) { res.writeHead(404); res.end('Page not found'); return; }
    const content = fs.readFileSync(fullPath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlEditor(slug, file, content));
  }
  else if (req.method === 'POST' && req.url === '/save') {
    const { title, description, number, date, fileName, imageBase64, attachments } = await readJsonBody(req);
    const slug = slugifyTitle(title);
    const postDir = path.join(postsDir, slug);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
    
    const ext = path.extname(fileName || '') || '.png';
    const newImageName = `${slug}-cover${ext}`;
    if (!fs.existsSync(publicImagesDir)) fs.mkdirSync(publicImagesDir, { recursive: true });
    fs.writeFileSync(path.join(publicImagesDir, newImageName), Buffer.from(imageBase64, 'base64'));
    
    let downloadsMd = '';
    if (attachments && attachments.length > 0) {
      const publicFilesDir = path.join(projectRoot, 'public', 'files', slug);
      if (!fs.existsSync(publicFilesDir)) fs.mkdirSync(publicFilesDir, { recursive: true });
      downloadsMd += '\n\n## Downloads\n\n';
      for (const att of attachments) {
        const safeName = path.basename(att.name);
        const attPath = path.join(publicFilesDir, safeName);
        fs.writeFileSync(attPath, Buffer.from(att.base64, 'base64'));
        downloadsMd += '- [' + safeName + '](/files/' + slug + '/' + safeName + ')\n';
      }
    }
    
    const frontmatter = `---
number: ${number}
title: "${(title || slug).replace(/"/g, '\\"')}"
date: ${date}
description: "${(description || '').replace(/"/g, '\\"')}"
coverImage: "/images/${newImageName}"
---

## Overview

Welcome to **${title}**. This is the landing page of its sub-wiki.
Add more pages to this sub-wiki from the dashboard — they will appear
in this post's sidebar automatically.
` + downloadsMd;
    fs.writeFileSync(path.join(postDir, 'index.md'), frontmatter);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ slug }));
  }
  else if (req.method === 'POST' && req.url === '/create-page') {
    const { slug, title } = await readJsonBody(req);
    if (!slug || !title) { res.writeHead(400); res.end(JSON.stringify({ error: 'Missing slug/title' })); return; }
    const postDir = path.join(postsDir, slug);
    if (!fs.existsSync(postDir)) { res.writeHead(404); res.end(JSON.stringify({ error: 'Post not found' })); return; }
    let base = slugifyTitle(title);
    let file = `${base}.md`;
    let i = 2;
    while (fs.existsSync(path.join(postDir, file))) {
      file = `${base}-${i}.md`;
      i++;
    }
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: ""
---

## ${title}

Write the content for this sub-wiki page here.
`;
    fs.writeFileSync(path.join(postDir, file), frontmatter);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ file }));
  }
  else if (req.method === 'POST' && req.url === '/upload-attachment') {
    const { slug, attachments } = await readJsonBody(req);
    if (!slug || !attachments) { res.writeHead(400); res.end('Missing payload'); return; }
    
    const publicFilesDir = path.join(projectRoot, 'public', 'files', slug);
    if (!fs.existsSync(publicFilesDir)) fs.mkdirSync(publicFilesDir, { recursive: true });
    
    for (const att of attachments) {
      const safeName = path.basename(att.name);
      const attPath = path.join(publicFilesDir, safeName);
      fs.writeFileSync(attPath, Buffer.from(att.base64, 'base64'));
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  }
  else if (req.method === 'POST' && req.url === '/update-content') {
    const { slug, file: fileParam, content } = await readJsonBody(req);
    const file = safePageFile(fileParam || 'index.md');
    if (!slug || !file || typeof content !== 'string') { res.writeHead(400); res.end('Missing payload'); return; }
    const fullPath = path.join(postsDir, slug, file);
    // Ensure the resolved path stays inside the post folder
    if (!fullPath.startsWith(path.join(postsDir, slug) + path.sep) && fullPath !== path.join(postsDir, slug, file)) {
      res.writeHead(400); res.end('Invalid path'); return;
    }
    if (!fs.existsSync(path.dirname(fullPath))) fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  }
  else if (req.method === 'POST' && req.url === '/delete-page') {
    const { slug, file: fileParam } = await readJsonBody(req);
    const file = safePageFile(fileParam);
    if (!slug || !file) { res.writeHead(400); res.end('Missing payload'); return; }
    if (file === 'index.md' || file === 'index.mdx') { res.writeHead(400); res.end('Use Delete post for overview'); return; }
    const fullPath = path.join(postsDir, slug, file);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  }
  else if (req.method === 'POST' && req.url === '/delete') {
    const { slug } = await readJsonBody(req);
    const postDir = path.join(postsDir, slug);
    const indexPath = path.join(postDir, 'index.md');
    
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      const coverMatch = content.match(/^coverImage:\s*"?(.*?)"?$/m);
      if (coverMatch && coverMatch[1]) {
        const imagePath = path.join(projectRoot, 'public', coverMatch[1].replace(/^\//, ''));
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }
      fs.rmSync(postDir, { recursive: true, force: true });
    } else if (fs.existsSync(postDir)) {
      fs.rmSync(postDir, { recursive: true, force: true });
    }
    
    const filesDir = path.join(projectRoot, 'public', 'files', slug);
    if (fs.existsSync(filesDir)) fs.rmSync(filesDir, { recursive: true, force: true });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  }
  else {
    res.writeHead(404), res.end();
  }
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500);
    res.end('Error: ' + (err && err.message));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 CMS Dashboard running at http://localhost:${PORT}`);
  console.log('Each post is a sub-wiki: posts/<slug>/index.md + posts/<slug>/*.md');
  console.log('Press Ctrl+C to stop the server when you are done.');
  const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
  exec(`${start} http://localhost:${PORT}`, () => {});
});
