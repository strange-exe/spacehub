const apiKey = "DEMO_KEY";

/* ========== Loader Control ========== */
function showContentWhenReady(){
  document.body.classList.add("loaded");
}

/* ========== APOD (Home) ========== */
async function fetchAPOD(){
  const cached = localStorage.getItem("apodData");
  if(cached){
    displayAPOD(JSON.parse(cached));
    return;
  }

  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if(data.media_type === "image"){
      localStorage.setItem("apodData", JSON.stringify(data));
      displayAPOD(data);
    }
  } catch(err){
    console.error("Error fetching APOD:", err);
    showContentWhenReady(); // show page even on error
  }
}

function displayAPOD(data){
  document.getElementById("apod").src = data.url;
  document.getElementById("apod").alt = data.title;
  document.getElementById("apod-title").textContent = data.title;
  document.getElementById("apod-date").textContent = data.date;
  document.getElementById("apod-desc").textContent = data.explanation;
  showContentWhenReady();
}

/* ========== NASA Image Library (Gallery) ========== */
async function fetchGallery(){
  const cached = localStorage.getItem("galleryData");
  if(cached){
    displayGallery(JSON.parse(cached));
    return;
  }

  const url = `https://images-api.nasa.gov/search?q=galaxy&media_type=image`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const items = data.collection.items.slice(0, 12); // limit 12 images
    localStorage.setItem("galleryData", JSON.stringify(items));
    displayGallery(items);
  } catch(err){
    console.error("Error fetching gallery:", err);
  }
}

function displayGallery(items){
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = ""; // clear previous
  items.forEach(item=>{
    const imgSrc = item.links[0].href;
    const title = item.data[0].title;
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.innerHTML = `<img src="${imgSrc}" alt="${title}"><h3>${title}</h3>`;
    div.onclick = ()=>openModal(imgSrc, title);
    gallery.appendChild(div);
  });
  showContentWhenReady();
}

/* ========== Modal Viewer ========== */
function openModal(src, caption){
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const modalCaption = document.getElementById("modal-caption");
  modal.style.display = "block";
  modalImg.src = src;
  modalCaption.textContent = caption;
}
function closeModal(){
  document.getElementById("modal").style.display = "none";
}

/* ========== DOMContentLoaded ========== */
document.addEventListener("DOMContentLoaded", ()=>{
  if(document.getElementById("apod")) fetchAPOD();
  if(document.getElementById("gallery")) fetchGallery();

  const closeBtn = document.querySelector(".close");
  if(closeBtn) closeBtn.onclick = closeModal;

  // About & Contact pages (no fetch)
  if(!document.getElementById("apod") && !document.getElementById("gallery")){
    showContentWhenReady();
  }
});
