const apiKey = "DEMO_KEY";
let page = 1;
const pageSize = 12;
const CACHE_EXPIRY = 24 * 60 * 60 * 800; // 24h

function setCache(key, data) {
  const cacheObj = {
    timestamp: Date.now(),
    data
  };
  localStorage.setItem(key, JSON.stringify(cacheObj));
}

function getCache(key) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    if ((Date.now() - parsed.timestamp) < CACHE_EXPIRY) return parsed.data;
    localStorage.removeItem(key);
    return null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function clearOldCache() {
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      if (!parsed.timestamp || (now - parsed.timestamp) > CACHE_EXPIRY) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

function showContentWhenReady() {
  document.body.classList.add("loaded");
}

async function fetchAPOD() {
  const cacheKey = "apodData";
  const cached = getCache(cacheKey);
  if (cached) {
    displayAPOD(cached);
    return;
  }

  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.media_type === "image") {
      setCache(cacheKey, data);
      displayAPOD(data);
    } else {
      document.querySelector("main").innerHTML =
        "<p>Today's APOD is not an image.</p>";
      showContentWhenReady();
    }
  } catch (err) {
    console.error("Error fetching APOD:", err);
    document.querySelector("main").innerHTML =
      "<p>Failed to load NASA data. Try again later.</p>";
    showContentWhenReady();
  }
}

function displayAPOD(data) {
  const img = document.getElementById("apod");
  img.src = data.url;
  img.alt = data.title;
  document.getElementById("apod-title").textContent = data.title;
  document.getElementById("apod-date").textContent = data.date;
  document.getElementById("apod-desc").textContent = data.explanation;
  showContentWhenReady();
}

function addPaginationControls() {
  let pagination = document.querySelector(".pagination");
  if (!pagination) {
    pagination = document.createElement("div");
    pagination.className = "pagination";
    document.querySelector("main").appendChild(pagination);
  }
  pagination.innerHTML = `
    <button id="prevPage" ${page === 1 ? "disabled" : ""}>⬅ Prev</button>
    <span>Page ${page}</span>
    <button id="nextPage">Next ➡</button>
  `;
  document.getElementById("prevPage").onclick = prevPage;
  document.getElementById("nextPage").onclick = nextPage;
}

function nextPage() {
  page++;
  fetchGallery();
}
function prevPage() {
  if (page > 1) {
    page--;
    fetchGallery();
  }
}

async function fetchGallery() {
  const cacheKey = `gallery-page-${page}`;
  const cached = getCache(cacheKey);
  if (cached) {
    displayGallery(cached);
    return;
  }

  const url = `https://images-api.nasa.gov/search?q=galaxy&media_type=image&page=${page}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = data.collection.items.slice(0, pageSize);
    setCache(cacheKey, items);
    displayGallery(items);
  } catch (err) {
    console.error("Error fetching gallery:", err);
    document.getElementById("gallery").innerHTML = "<p>Error loading gallery.</p>";
    showContentWhenReady();
  }
}

function displayGallery(items) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";
  if (items.length === 0) {
    gallery.innerHTML = "<p>No images found.</p>";
    showContentWhenReady();
    return;
  }
  items.forEach((item) => {
    if (!item.links || !item.data) return;
    const imgSrc = item.links[0].href;
    const title = item.data[0].title;
    const desc = item.data[0].description || "No description available.";
    const date = item.data[0].date_created || "Unknown date";
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.innerHTML = `<img src="${imgSrc}" alt="${title}"><h3>${title}</h3>`;
    div.onclick = () => openModal(imgSrc, title, desc, date);
    gallery.appendChild(div);
  });
  addPaginationControls();
  showContentWhenReady();
}

function openModal(src, title, desc, date) {
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const modalCaption = document.getElementById("modal-caption");
  modal.style.display = "block";
  modalImg.src = src;
  modalCaption.innerHTML = `<h2>${title}</h2><p>${desc}</p><small>${date}</small>`;
}
function closeModal() {
  document.getElementById("modal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  clearOldCache();
  if (document.getElementById("apod")) fetchAPOD();
  if (document.getElementById("gallery")) fetchGallery();
  const closeBtn = document.querySelector(".close");
  if (closeBtn) closeBtn.onclick = closeModal;
  if (!document.getElementById("apod") && !document.getElementById("gallery")) {
    showContentWhenReady();
  }
});
