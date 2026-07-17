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

function getAllPosts() {
  if (!fs.existsSync(postsDir)) return [];
  
  const folders = fs.readdirSync(postsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
    
  const posts = [];
  
  for (const slug of folders) {
    const indexPath = path.join(postsDir, slug, 'index.md');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      const titleMatch = content.match(/^title:\s*"?(.*?)"?$/m);
      const numberMatch = content.match(/^number:\s*(\d+)/m);
      const coverMatch = content.match(/^coverImage:\s*"?(.*?)"?$/m);
      
      posts.push({
        slug,
        title: titleMatch ? titleMatch[1] : slug,
        number: numberMatch ? parseInt(numberMatch[1], 10) : 0,
        coverImage: coverMatch ? coverMatch[1] : null
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
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    h1 { color: var(--accent); margin: 0; }
    .btn { padding: 0.75rem 1.5rem; background-color: var(--accent); color: var(--bg); border: none; border-radius: 4px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn:hover { background-color: var(--accent-hover); }
    .btn-danger { background-color: var(--danger); color: white; }
    .btn-danger:hover { background-color: var(--danger-hover); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
    .card-img { width: 100%; height: 180px; object-fit: cover; background: #1d2021; }
    .card-content { padding: 1rem; flex-grow: 1; }
    .card-title { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
    .card-actions { padding: 1rem; border-top: 1px solid var(--border); display: flex; gap: 0.5rem; justify-content: flex-end; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Post Dashboard</h1>
    <a href="/add" class="btn">Create New Post</a>
  </div>
  
  <div class="grid">
    ${posts.map(post => `
      <div class="card">
        ${post.coverImage ? `<img src="${post.coverImage}" class="card-img" alt="Cover">` : '<div class="card-img"></div>'}
        <div class="card-content">
          <span style="font-size:0.8rem; color:#a89984;">#${post.number}</span>
          <h3 class="card-title">${post.title}</h3>
          <p style="margin:0; font-size:0.9rem; color:#a89984;">Slug: ${post.slug}</p>
        </div>
        <div class="card-actions">
          <a href="/edit?slug=${post.slug}" target="_blank" class="btn" style="padding: 0.5rem 1rem;">Edit</a>
          <button onclick="deletePost('${post.slug}')" class="btn btn-danger" style="padding: 0.5rem 1rem;">Delete</button>
        </div>
      </div>
    `).join('')}
    ${posts.length === 0 ? '<p>No posts found.</p>' : ''}
  </div>

  <script>
    async function deletePost(slug) {
      if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
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
          if (data.slug) window.location.href = '/edit?slug=' + data.slug;
          else { alert('Failed'); btn.textContent = 'Generate Post'; btn.disabled = false; }
        } catch (err) { alert('Error: ' + err); btn.disabled = false; }
      };
      reader.readAsDataURL(file);
    });
  </script>
</body>
</html>
`;

const htmlEditor = (slug, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Edit Post - ${slug}</title>
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
    h1 { color: #b8bb26; margin: 0; }
    .save-btn { background-color: #b8bb26; color: #282828; border: none; padding: 10px 20px; font-weight: bold; font-size: 1rem; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;}
    .save-btn:hover { background-color: #98971a; }
    .save-btn:disabled { background-color: #504945; cursor: not-allowed; }
    .upload-widget { margin-bottom: 1rem; padding: 1rem; background: #3c3836; border-radius: 4px; border: 1px dashed #504945; display: flex; gap: 1rem; align-items: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Editing: ${slug}</h1>
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
          body: JSON.stringify({ slug: '${slug}', content: easyMDE.value() })
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

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const posts = getAllPosts();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlDashboard(posts));
  } 
  else if (req.method === 'GET' && req.url.startsWith('/images/')) {
    const imagePath = path.join(projectRoot, 'public', req.url);
    if (fs.existsSync(imagePath)) {
      const ext = path.extname(imagePath).toLowerCase();
      const mimeTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
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
    if (!slug) return res.writeHead(400), res.end('Missing slug');
    const indexPath = path.join(postsDir, slug, 'index.md');
    if (!fs.existsSync(indexPath)) return res.writeHead(404), res.end('Post not found');
    const content = fs.readFileSync(indexPath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlEditor(slug, content));
  }
  else if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { title, description, number, date, fileName, imageBase64, attachments } = JSON.parse(body);
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const postDir = path.join(postsDir, slug);
        if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
        
        const ext = path.extname(fileName) || '.png';
        const newImageName = `${slug}-cover${ext}`;
        if (!fs.existsSync(publicImagesDir)) fs.mkdirSync(publicImagesDir, { recursive: true });
        fs.writeFileSync(path.join(publicImagesDir, newImageName), Buffer.from(imageBase64, 'base64'));
        
        let downloadsMd = '';
        if (attachments && attachments.length > 0) {
          const publicFilesDir = path.join(projectRoot, 'public', 'files', slug);
          if (!fs.existsSync(publicFilesDir)) fs.mkdirSync(publicFilesDir, { recursive: true });
          downloadsMd += '\\n\\n## Downloads\\n\\n';
          for (const att of attachments) {
            const attPath = path.join(publicFilesDir, att.name);
            fs.writeFileSync(attPath, Buffer.from(att.base64, 'base64'));
            downloadsMd += '- [' + att.name + '](/files/${slug}/' + att.name + ')\\n';
          }
        }
        
        const frontmatter = `---
number: ${number}
title: "${title}"
date: ${date}
description: "${description}"
coverImage: "/images/${newImageName}"
---

## Overview

Welcome to **${title}**. 
` + downloadsMd;
        fs.writeFileSync(path.join(postDir, 'index.md'), frontmatter);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ slug }));
      } catch (err) {
        res.writeHead(500), res.end('Error: ' + err.message);
      }
    });
  }
  else if (req.method === 'POST' && req.url === '/upload-attachment') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { slug, attachments } = JSON.parse(body);
        if (!slug || !attachments) return res.writeHead(400), res.end('Missing payload');
        
        const publicFilesDir = path.join(projectRoot, 'public', 'files', slug);
        if (!fs.existsSync(publicFilesDir)) fs.mkdirSync(publicFilesDir, { recursive: true });
        
        for (const att of attachments) {
          const attPath = path.join(publicFilesDir, att.name);
          fs.writeFileSync(attPath, Buffer.from(att.base64, 'base64'));
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500), res.end('Error');
      }
    });
  }
  else if (req.method === 'POST' && req.url === '/update-content') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { slug, content } = JSON.parse(body);
        fs.writeFileSync(path.join(postsDir, slug, 'index.md'), content);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500), res.end('Error');
      }
    });
  }
  else if (req.method === 'POST' && req.url === '/delete') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { slug } = JSON.parse(body);
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
        }
        
        const filesDir = path.join(projectRoot, 'public', 'files', slug);
        if (fs.existsSync(filesDir)) fs.rmSync(filesDir, { recursive: true, force: true });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error(err);
        res.writeHead(500), res.end('Error');
      }
    });
  }
  else {
    res.writeHead(404), res.end();
  }
});

server.listen(PORT, () => {
  console.log(`🚀 CMS Dashboard running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop the server when you are done.');
  const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
  exec(`${start} http://localhost:${PORT}`, () => {});
});
