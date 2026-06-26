/* main.js - Complete Zed Tuition JavaScript */
// ============================================================
// 0. LOADING & OFFLINE/ONLINE HANDLING
// ============================================================
const loadingOverlay = document.getElementById('loadingOverlay');
const offlineNotice = document.getElementById('offlineNotice');

// Flag to track if content has been loaded
let contentLoaded = false;

// Function to hide loading spinner
function hideLoading() {
  loadingOverlay.classList.add('hidden');
  setTimeout(() => {
    loadingOverlay.style.display = 'none';
  }, 500);
}

// Function to show offline notice
function showOffline() {
  offlineNotice.classList.add('show');
  document.body.classList.add('offline-mode');
  // Hide trending & discover sections
  const trending = document.getElementById('trending');
  const discover = document.getElementById('discover');
  if (trending) trending.style.display = 'none';
  if (discover) discover.style.display = 'none';
  // Show a message in their place
  const container = document.querySelector('.container');
  let offlineMsg = document.getElementById('offlineMessage');
  if (!offlineMsg) {
    offlineMsg = document.createElement('div');
    offlineMsg.id = 'offlineMessage';
    offlineMsg.style.cssText = 'text-align:center; padding:2rem; color:#ffffff; font-size:1.1rem; background:rgba(255,255,255,0.05); border-radius:1.5rem; margin:1rem 0;';
    offlineMsg.innerHTML = '<i class="fas fa-wifi" style="font-size:2rem; display:block; margin-bottom:1rem; color:#cc0000;"></i> You are currently offline. <br> Please connect to the internet to access trending documents and discover articles.';
    // Insert after level tabs
    const levelTabs = document.querySelector('.level-tabs');
    if (levelTabs) {
      levelTabs.after(offlineMsg);
    }
  }
}

// Function to hide offline notice and load content
function hideOfflineAndLoad() {
  offlineNotice.classList.remove('show');
  document.body.classList.remove('offline-mode');
  const offlineMsg = document.getElementById('offlineMessage');
  if (offlineMsg) offlineMsg.remove();
  const trending = document.getElementById('trending');
  const discover = document.getElementById('discover');
  if (trending) trending.style.display = '';
  if (discover) discover.style.display = '';
  // Load content if not already loaded
  if (!contentLoaded) {
    loadFullContent();
  }
}

// Function to load all dynamic content
function loadFullContent() {
  if (contentLoaded) return;
  contentLoaded = true;
  renderTrending();
  renderDiscover();
  // Also load download list if needed
  if (document.getElementById('downloadedList')) {
    renderDownloadedList();
  }
  hideLoading();
}

// Check online status on load
function checkOnlineStatus() {
  if (navigator.onLine) {
    // Online: load full content
    hideOfflineAndLoad();
  } else {
    // Offline: show offline UI
    showOffline();
    hideLoading();
  }
}

// Listen for online/offline events
window.addEventListener('online', () => {
  // When coming online, reload content
  hideOfflineAndLoad();
  // Also refresh download list if open
  if (document.getElementById('downloadedList') && downloadOverlay && downloadOverlay.classList.contains('open')) {
    renderDownloadedList();
  }
});

window.addEventListener('offline', () => {
  showOffline();
});

// ============================================================
// 1. SIDEBAR LOGIC
// ============================================================
const hamburger = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlayBlur');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const backToTopLink = document.getElementById('backToTopLink');

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

if (hamburger) hamburger.addEventListener('click', openSidebar);
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
if (overlay) overlay.addEventListener('click', closeSidebar);

if (backToTopLink) {
  backToTopLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeSidebar();
  });
}

document.querySelectorAll('.sidebar nav a').forEach(link => {
  link.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) setTimeout(closeSidebar, 150);
  });
});

// ============================================================
// 2. THEME TOGGLE (Dark/Light)
// ============================================================
const themeToggleBtn = document.getElementById('themeToggle');
let currentTheme = localStorage.getItem('theme') || 'dark';

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> <span>Light</span>';
  } else {
    document.body.classList.remove('light-mode');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> <span>Dark</span>';
  }
  localStorage.setItem('theme', theme);
}
applyTheme(currentTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const newTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
    applyTheme(newTheme);
  });
}

// ============================================================
// 3. SEARCH → searchresult.html
// ============================================================
const searchInput = document.getElementById('globalSearchInput');
const searchBtn = document.getElementById('globalSearchBtn');

function performSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  window.location.href = `searchresult.html?q=${encodeURIComponent(query)}`;
}

if (searchBtn) searchBtn.addEventListener('click', performSearch);
if (searchInput) {
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') performSearch();
  });
}

// ============================================================
// 4. BOTTOM BAR: HOME / DOWNLOAD (full-page overlay)
// ============================================================
const bottomHome = document.getElementById('bottomHome');
const bottomDownload = document.getElementById('bottomDownload');
const downloadOverlay = document.getElementById('downloadOverlay');
const closeDownloadOverlay = document.getElementById('closeDownloadOverlay');

function openDownloadOverlay() {
  if (!downloadOverlay) return;
  downloadOverlay.classList.add('open');
  if (bottomDownload) bottomDownload.classList.add('active');
  if (bottomHome) bottomHome.classList.remove('active');
  renderDownloadedList();
}

function closeDownloadOverlayFn() {
  if (!downloadOverlay) return;
  downloadOverlay.classList.remove('open');
  if (bottomHome) bottomHome.classList.add('active');
  if (bottomDownload) bottomDownload.classList.remove('active');
}

if (bottomHome) {
  bottomHome.addEventListener('click', () => {
    if (downloadOverlay && downloadOverlay.classList.contains('open')) closeDownloadOverlayFn();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

if (bottomDownload) {
  bottomDownload.addEventListener('click', () => {
    if (downloadOverlay && downloadOverlay.classList.contains('open')) {
      closeDownloadOverlayFn();
    } else {
      openDownloadOverlay();
    }
  });
}

if (closeDownloadOverlay) {
  closeDownloadOverlay.addEventListener('click', closeDownloadOverlayFn);
}

// Close overlay on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && downloadOverlay && downloadOverlay.classList.contains('open')) {
    closeDownloadOverlayFn();
  }
});

// ============================================================
// 5. INDEXEDDB – DOWNLOAD MANAGER (permanent storage)
// ============================================================
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ZedTuitionDownloads', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getDB() {
  if (!db) db = await openDB();
  return db;
}

async function saveDownloadedFile(fileData) {
  const db = await getDB();
  const tx = db.transaction('files', 'readwrite');
  const store = tx.objectStore('files');
  store.put(fileData);
  return tx.complete;
}

async function getDownloadedFiles() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteDownloadedFile(id) {
  const db = await getDB();
  const tx = db.transaction('files', 'readwrite');
  const store = tx.objectStore('files');
  store.delete(id);
  return tx.complete;
}

async function renderDownloadedList() {
  const container = document.getElementById('downloadedList');
  if (!container) return;
  try {
    const files = await getDownloadedFiles();
    if (files.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:1rem;">No downloaded documents yet.</p>';
      return;
    }
    container.innerHTML = files.map(file => `
      <div class="download-item" data-id="${file.id}">
        <div class="info">
          <div class="title">${escapeHtml(file.title)}</div>
          <div class="meta">${file.size ? (file.size / 1024).toFixed(1) + ' KB' : ''} • ${new Date(file.date).toLocaleDateString()}</div>
        </div>
        <div class="actions">
          <button onclick="viewDownloadedFile('${file.id}')"><i class="fas fa-eye"></i> View</button>
          <button onclick="deleteDownloadedFile('${file.id}'); renderDownloadedList();" style="background:#ff4444;"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<p>Error loading downloads.</p>';
  }
}

async function viewDownloadedFile(id) {
  const db = await getDB();
  const tx = db.transaction('files', 'readonly');
  const store = tx.objectStore('files');
  const request = store.get(id);
  request.onsuccess = () => {
    const file = request.result;
    if (file && file.blob) {
      const url = URL.createObjectURL(file.blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      alert('File not found.');
    }
  };
}

// Expose functions globally for inline onclick handlers
window.viewDownloadedFile = viewDownloadedFile;
window.deleteDownloadedFile = deleteDownloadedFile;
window.renderDownloadedList = renderDownloadedList;

// ============================================================
// 6. DOWNLOADING LOGIC (active downloads with progress)
// ============================================================
let activeDownloads = {};

async function startDownload(doc) {
  const downloadId = doc.id + '_' + Date.now();
  const downloadData = {
    id: downloadId,
    title: doc.title,
    progress: 0,
    status: 'downloading',
    size: 0,
    docId: doc.id
  };
  activeDownloads[downloadId] = downloadData;
  renderDownloadingList();

  try {
    const url = `https://drive.google.com/uc?export=download&id=${doc.id}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total) {
        const progress = Math.round((received / total) * 100);
        activeDownloads[downloadId].progress = progress;
        renderDownloadingList();
      }
    }

    const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
    const fileData = {
      id: doc.id,
      title: doc.title,
      blob: blob,
      size: blob.size,
      date: new Date().toISOString()
    };
    await saveDownloadedFile(fileData);
    delete activeDownloads[downloadId];
    renderDownloadingList();
    renderDownloadedList();
    alert(`Download of "${doc.title}" completed!`);
  } catch (err) {
    console.error(err);
    activeDownloads[downloadId].status = 'error';
    renderDownloadingList();
    alert(`Failed to download "${doc.title}".`);
  }
}

function renderDownloadingList() {
  const container = document.getElementById('downloadingList');
  if (!container) return;
  const items = Object.values(activeDownloads);
  if (items.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:1rem;">No active downloads.</p>';
    return;
  }
  container.innerHTML = items.map(item => `
    <div class="download-item">
      <div class="info">
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="meta">${item.status === 'error' ? '❌ Error' : `⬇️ ${item.progress}%`}</div>
        <div class="progress-bar"><div class="fill" style="width:${item.progress}%;"></div></div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// 7. TRENDING DOCUMENTS (with viewer navigation & download)
// ============================================================
const trendingScroll = document.getElementById('trendingScroll');

const allDocs = [
  { title: 'Progress in Maths Grade 10', id: '1blK7UXeLCWPuNiUzben75qLe3ms1eiAB', level: 'Senior' },
  { title: 'Maths Study Guide 10-12', id: '1YX_DNXRSAuqqhlc49EYFzm675BdKZZV1', level: 'Senior' },
  { title: 'Amplified English 10-12', id: '1j18dymh-AuJtBKN8ltPFfBO9y-SRsUXu', level: 'Senior' },
  { title: 'Biology Zase Notes', id: '1InRLQECwgRzj6pnIhYsfF-ANpsTRyo6C', level: 'Senior' },
  { title: 'Physics Q&A', id: '1I_ZYCO1DwDZL5Sqx6xWIwyo6fQMjnIMO', level: 'Senior' },
  { title: 'English Form 1-2 Notes', id: '17ItMq9lm6OhUdJ7i8XSGpxCmcPfyBsHD', level: 'Junior' },
  { title: 'Fast-learn Maths Junior', id: '1lB2ZePnvnqdPgd4rjX75CdQBR9XX5_nF', level: 'Junior' },
  { title: 'Science Form 1-2', id: '15Ykhm38JQoOxzIRiUpPRJTSpJck9Ktd6', level: 'Junior' },
  { title: 'Literature Form 1', id: '1IoT_TJUwzB_m66ffor7jO5-nCwqpU6Tp', level: 'Junior' },
  { title: 'Maths Grade 5-7', id: '1lB2ZePnvnqdPgd4rjX75CdQBR9XX5_nF', level: 'Primary' },
  { title: 'English Grade 5-7', id: '17ItMq9lm6OhUdJ7i8XSGpxCmcPfyBsHD', level: 'Primary' },
  { title: 'Science Primary 5-7', id: '15Ykhm38JQoOxzIRiUpPRJTSpJck9Ktd6', level: 'Primary' },
];

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderTrending() {
  if (!trendingScroll) return;
  const shuffled = shuffleArray([...allDocs]);
  const selected = shuffled.slice(0, 6);
  trendingScroll.innerHTML = '';
  selected.forEach(doc => {
    const item = document.createElement('div');
    item.className = 'trending-item';
    item.innerHTML = `
      <img src="https://drive.google.com/thumbnail?id=${doc.id}&sz=w200" alt="${doc.title}" onerror="this.src='https://placehold.co/200x110/1a1d2b/D100FF?text=Doc'">
      <div class="trending-title">${doc.title}</div>
      <span class="trending-badge">${doc.level}</span>
      <div class="download-icon" title="Download"><i class="fas fa-download"></i></div>
    `;
    // Click card → open document viewer (viewer.html)
    item.addEventListener('click', (e) => {
      if (e.target.closest('.download-icon')) return;
      window.location.href = `viewer.html?doc=${doc.id}`;
    });
    // Download button
    const downloadBtn = item.querySelector('.download-icon');
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Download "${doc.title}"?`)) {
        startDownload(doc);
        if (!downloadOverlay.classList.contains('open')) openDownloadOverlay();
        // Switch to downloading tab
        document.querySelectorAll('.download-tab').forEach(t => t.classList.remove('active'));
        const downloadingTab = document.querySelector('.download-tab[data-tab="downloading"]');
        if (downloadingTab) downloadingTab.classList.add('active');
        document.querySelectorAll('.download-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById('panel-downloading');
        if (panel) panel.classList.add('active');
      }
    });
    trendingScroll.appendChild(item);
  });
}

// ============================================================
// 8. TRENDING AUTO-SCROLL & DRAG
// ============================================================
let scrollInterval;
let isHovering = false;

function startAutoScroll() {
  if (scrollInterval) clearInterval(scrollInterval);
  scrollInterval = setInterval(() => {
    if (!isHovering && trendingScroll && trendingScroll.children.length > 0) {
      const maxScroll = trendingScroll.scrollWidth - trendingScroll.clientWidth;
      if (trendingScroll.scrollLeft >= maxScroll - 2) {
        trendingScroll.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        trendingScroll.scrollBy({ left: 180, behavior: 'smooth' });
      }
    }
  }, 3000);
}

function stopAutoScroll() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
}

if (trendingScroll) {
  trendingScroll.addEventListener('mouseenter', () => { isHovering = true; });
  trendingScroll.addEventListener('mouseleave', () => { isHovering = false; });
  trendingScroll.addEventListener('touchstart', () => { isHovering = true; });
  trendingScroll.addEventListener('touchend', () => { isHovering = false; });
  startAutoScroll();
}

// Drag to scroll (desktop + mobile)
let isDragging = false;
let startX = 0;
let scrollLeftStart = 0;

if (trendingScroll) {
  trendingScroll.addEventListener('mousedown', (e) => {
    isDragging = true;
    isHovering = true;
    startX = e.pageX - trendingScroll.offsetLeft;
    scrollLeftStart = trendingScroll.scrollLeft;
    trendingScroll.style.cursor = 'grabbing';
  });

  trendingScroll.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - trendingScroll.offsetLeft;
    const walk = (x - startX) * 1.5;
    trendingScroll.scrollLeft = scrollLeftStart - walk;
  });

  trendingScroll.addEventListener('mouseup', () => {
    isDragging = false;
    isHovering = false;
    trendingScroll.style.cursor = 'grab';
  });

  trendingScroll.addEventListener('mouseleave', () => {
    isDragging = false;
    isHovering = false;
    trendingScroll.style.cursor = 'grab';
  });

  // Touch support
  trendingScroll.addEventListener('touchstart', (e) => {
    isDragging = true;
    isHovering = true;
    startX = e.touches[0].pageX - trendingScroll.offsetLeft;
    scrollLeftStart = trendingScroll.scrollLeft;
  });

  trendingScroll.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - trendingScroll.offsetLeft;
    const walk = (x - startX) * 1.5;
    trendingScroll.scrollLeft = scrollLeftStart - walk;
  });

  trendingScroll.addEventListener('touchend', () => {
    isDragging = false;
    isHovering = false;
  });
}

// ============================================================
// 9. DISCOVER CARDS (with embedded YouTube videos)
// ============================================================
const discoverData = [
  {
    title: 'Top 10 Exam Tips for ECZ Success',
    desc: 'Master your ECZ exams with proven strategies: time management, past paper practice, and active recall techniques.',
    img: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=350&fit=crop&crop=center',
    video: 'https://www.youtube.com/embed/jj2QLF36WRE'
  },
  {
    title: 'How to Study Effectively: Science-Backed Methods',
    desc: 'Discover the best study techniques: spaced repetition, the Feynman technique, and how to create a productive study environment.',
    img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=350&fit=crop&crop=center',
    video: 'https://www.youtube.com/embed/ZfF2KPazvH4'
  },
  {
    title: 'From Failing to Flying: Student Success Stories',
    desc: 'Real stories from Zambian students who transformed their grades using simple, consistent study habits and the righttr resources.',
    img: 'https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=600&h=350&fit=crop&crop=center',
    video: 'https://www.youtube.com/embed/JGr46kYMEQQ'
  },
  {
    title: 'Time Management Secrets for Students',
    desc: 'Learn how to balance study, rest, and revision effectively. Boost productivity and reduce exam stress with these proven techniques.',
    img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=350&fit=crop&crop=center',
    video: 'https://www.youtube.com/embed/VuR6Fvs2KBM'
  },
  {
    title: 'Master Note‑Taking: Cornell & Mind Maps',
    desc: 'Improve your note‑taking skills with the Cornell method and mind mapping — key tools for retaining information and acing exams.',
    img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=350&fit=crop&crop=center',
    video: 'https://www.youtube.com/embed/-E8AOvN4wBo'
  },
  {
    title: 'Overcoming Exam Anxiety & Stress',
    desc: 'Practical techniques to stay calm during exams: breathing exercises, positive visualization, and preparation strategies that build confidence.',
    img: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&h=350&fit=crop&crop=center',
    video: 'https://www.youtube.com/embed/KlJ8r3v7iDQ'
  }
];

function renderDiscover() {
  const grid = document.getElementById('discoverGrid');
  if (!grid) return;
  grid.innerHTML = discoverData.map(card => `
    <div class="discover-card">
      <img src="${card.img}" alt="${card.title}" class="discover-img" loading="lazy">
      <div class="discover-content">
        <h3><i class="fas fa-lightbulb" style="color:#FFD93D;"></i> ${card.title}</h3>
        <p>${card.desc}</p>
        <div class="video-embed">
          <iframe src="${card.video}" frameborder="0" allowfullscreen loading="lazy"></iframe>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// 10. DOWNLOAD TABS SWITCHING
// ============================================================
document.querySelectorAll('.download-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.download-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.querySelectorAll('.download-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`panel-${target}`);
    if (panel) panel.classList.add('active');
    if (target === 'downloads') renderDownloadedList();
  });
});

// ============================================================
// 11. UTILITY: escapeHtml (prevent XSS)
// ============================================================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]) || m);
}

// ============================================================
// 12. SMOOTH SCROLL FOR INTERNAL LINKS
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ============================================================
// 13. INIT: Check online status and load content
// ============================================================
// Check online status immediately
checkOnlineStatus();

// Also handle case where user reloads while online but content wasn't loaded
window.addEventListener('load', () => {
  // If online and content not loaded, load it
  if (navigator.onLine && !contentLoaded) {
    hideOfflineAndLoad();
  }
});

console.log('✅ Zed Tuition — Fully loaded with offline/online handling, download manager, theme toggle, and more!');