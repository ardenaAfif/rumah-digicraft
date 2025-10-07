import { db, collection, getDocs } from "./firebaseConfig.js";

// --- KONSTANTA UNTUK CACHING ---
const CACHE_KEY = 'rd_portfolio_cache';
const CACHE_TIMESTAMP_KEY = 'rd_portfolio_timestamp';
// Cache valid selama 1 jam (dalam milidetik)
const CACHE_DURATION = 60 * 60 * 1000; 

// Elemen DOM (tetap)
const y = document.getElementById("year");
if (y) y.textContent = new Date().getFullYear();

const grid = document.getElementById("grid");
const loadingState = document.getElementById("loadingState");
const tabs = Array.from(document.querySelectorAll(".tab"));
const modal = document.getElementById("modal");
const mTitle = document.getElementById("mTitle");
const mBadge = document.getElementById("mBadge");
const mDesc = document.getElementById("mDesc");
const mTech = document.getElementById("mTech");
const mImage = modal.querySelector(".aspect\\[4\\/3\\]");

let allPortfolioData = [];

// Helper: Menghasilkan HTML untuk chip/teknologi
function generateChipHtml(techs) {
  if (!techs || !Array.isArray(techs)) return "";
  return techs.map((t) => `<span class="chip">${t}</span>`).join("");
}

// Helper: Membuat elemen kartu portfolio (tetap)
function createCard(item) {
  const { id, title, category, desc, mockup, techs, preview } = item;
  const categoryClass =
    category === "Jasa Kelola Sosial Media"
      ? "sosmed"
      : category === "Aplikasi Android/iOS"
      ? "mobile"
      : "website";
  const mockupUrl = mockup || "Assets/default-mockup.jpg";

  const hasPreview = typeof preview === "string" && preview.trim().length > 0;
  const previewBtnHtml = hasPreview
    ? `<a class="btn btn-primary text-sm" href="${preview}" target="_blank" rel="noopener noreferrer">Preview</a>`
    : "";

  const card = document.createElement("article");
  card.classList.add("card", "group");
  card.dataset.cat = categoryClass;
  card.dataset.id = id;

  card.itemData = item;

  card.innerHTML = `
        <div class="rounded-2xl border border-brand-blue/10 bg-white shadow-smooth overflow-hidden h-full flex flex-col">
          <div class="relative aspect-[16/10] bg-brand-blue/10 p-3 grid place-items-center overflow-hidden">
            <img src="${mockupUrl}" alt="Preview ${title}"
                class="rounded-xl bg-white ring-1 ring-brand-blue/10 object-contain max-w-full max-h-full"
                transform-gpu transition-transform duration-300 ease-out
                group-hover:scale-[1.06] group-focus-within:scale-[1.06]
                motion-reduce:transition-none motion-reduce:transform-none"
                loading="lazy">
            <span class="badge absolute left-3 top-3">${category}</span>
        </div>
          <div class="p-5 flex flex-col gap-3 grow">
            <h3 class="text-lg font-bold">${title}</h3>
            <p class="text-sm text-brand-blue/80">${desc.substring(0, 100)}${
    desc.length > 100 ? "..." : ""
  }</p>
            <div class="mt-auto flex items-center gap-2 text-xs text-brand-blue/70">
                ${generateChipHtml(techs)}
            </div>
            <div class="flex items-center gap-2 pt-2">
              <button class="btn btn-ghost text-sm" data-detail="${id}">
                Detail
              </button>
              ${previewBtnHtml}
            </div>
          </div>
        </div>
    `;

  card
    .querySelector("[data-detail]")
    .addEventListener("click", () => showModal(item));

  return card;
}

// Fungsi Render Portfolio (tetap)
function renderPortfolio(dataToRender) {
  allPortfolioData = dataToRender; // Simpan data yang akan di-render ke variabel global
  grid.innerHTML = "";
  if (dataToRender.length === 0) {
    grid.innerHTML =
      '<p class="col-span-full text-center py-10 text-brand-blue/70">Belum ada proyek portfolio.</p>';
    return;
  }
  dataToRender.forEach((item) => {
    grid.appendChild(createCard(item));
  });
  setupFilter();
}

// Fungsi Filter 
function setupFilter() {
  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      const filterCat = t.dataset.filter;
      tabs.forEach((x) => x.classList.remove("tab-active"));
      t.classList.add("tab-active");

      let firestoreCategory;
      if (filterCat === "website") firestoreCategory = "Website";
      else if (filterCat === "mobile")
        firestoreCategory = "Aplikasi Android/iOS";
      else if (filterCat === "sosmed")
        firestoreCategory = "Kelola Sosial Media";

      const filteredData = allPortfolioData.filter(
        (item) => filterCat === "all" || item.category === firestoreCategory
      );

      // Render ulang hanya data yang difilter
      grid.innerHTML = "";
      if (filteredData.length === 0) {
        grid.innerHTML =
          '<p class="col-span-full text-center py-10 text-brand-blue/70">Tidak ada proyek yang cocok dengan filter ini.</p>';
      } else {
        filteredData.forEach((item) => {
            grid.appendChild(createCard(item));
        });
      }
    })
  );
}

// Fungsi Modal (tetap)
function showModal(item) {
  mTitle.textContent = item.title;
  mBadge.textContent = item.category;
  mDesc.textContent = item.desc;
  mTech.innerHTML = generateChipHtml(item.techs);
  mImage.innerHTML = `<img src="${item.mockup}" alt="Mockup ${item.title}" class="rounded-xl object-contain w-full h-full">`;
  modal.classList.remove("hidden");
}

// Penutup Modal (tetap)
modal.addEventListener("click", (e) => {
  if (
    e.target.hasAttribute("data-close") ||
    e.target.classList.contains("absolute")
  )
    modal.classList.add("hidden");
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modal.classList.add("hidden");
});

// --- FUNGSI BARU: CACHING LOGIC ---

/**
 * Memeriksa LocalStorage. Jika cache valid, muat data dari sana.
 * Setelah itu, tetap panggil Firebase untuk memeriksa update.
 */
function checkLocalStorageCache() {
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const now = Date.now();
  
  // 1. Cek validitas cache
  if (cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp) < CACHE_DURATION)) {
    try {
      const data = JSON.parse(cachedData);
      console.log("Mengambil data dari LocalStorage (Cache Valid)");
      
      if (loadingState) loadingState.remove();
      renderPortfolio(data);
      
      // Tetap panggil Firebase di background untuk mengecek update terbaru
      fetchPortfolioFromFirebase(true); 
      return true; // Berhasil load dari cache
    } catch (e) {
      console.error("Gagal parsing LocalStorage:", e);
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    }
  }
  
  // 2. Jika cache tidak valid/tidak ada, fetch langsung dari Firebase
  fetchPortfolioFromFirebase(false);
  return false;
}

/**
 * Mengambil data terbaru dari Firestore dan mengupdate cache.
 */
async function fetchPortfolioFromFirebase(isBackgroundFetch) {
  try {
    const querySnapshot = await getDocs(collection(db, "portfolio-rd"));
    const newData = [];
    let isDataChanged = false;
    
    querySnapshot.forEach((doc) => {
      newData.push({ id: doc.id, ...doc.data() });
    });

    // Cek apakah data baru berbeda dari data yang sedang ditampilkan (allPortfolioData)
    // Cek sederhana: jumlah item berbeda
    if (newData.length !== allPortfolioData.length) {
        isDataChanged = true;
    } 
    // Cek detail: jika data sedang ditampilkan, bandingkan id atau data terakhir
    else if (isBackgroundFetch && newData.length > 0) {
        // Cek JSON stringified dari kedua array (cara yang agak berat tapi efektif)
        const currentDataString = JSON.stringify(allPortfolioData.sort((a,b) => a.id.localeCompare(b.id)));
        const newDataString = JSON.stringify(newData.sort((a,b) => a.id.localeCompare(b.id)));
        if (currentDataString !== newDataString) {
            isDataChanged = true;
        }
    }


    if (!isBackgroundFetch || isDataChanged) {
        console.log(`Data portfolio ${isBackgroundFetch ? 'berubah, me-render ulang' : 'dimuat dari Firebase'}.`);
        
        if (loadingState) loadingState.remove(); 
        
        if (newData.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center py-10 text-brand-blue/70">Belum ada proyek portfolio.</p>';
            return;
        }
        
        renderPortfolio(newData);
        
        // Update LocalStorage dengan data baru dan timestamp
        localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    } else if (isBackgroundFetch) {
        console.log("Data Firebase sama dengan cache. Tidak ada perubahan.");
    }
    
  } catch (e) {
    console.error("Gagal mengambil data dari Firebase:", e);
    // Jika gagal fetch, pastikan pesan error terlihat jika belum ada data.
    if (!isBackgroundFetch && allPortfolioData.length === 0) {
        if (loadingState) loadingState.remove();
        grid.innerHTML =
        '<p class="col-span-full text-center py-10 text-red-700">Gagal memuat data portfolio. Cek koneksi atau konsol.</p>';
    }
  }
}


// Fungsi Utama Ambil Data dari Firestore
async function loadPortfolio() {
  // Tampilkan status loading hanya jika tidak ada data di cache yang akan dimuat segera.
  const cachedData = localStorage.getItem(CACHE_KEY);
  if (!cachedData && loadingState) {
    loadingState.style.display = 'block';
  } else if (loadingState) {
    loadingState.style.display = 'none';
  }
  
  // Memulai proses pengecekan LocalStorage, yang akan memanggil Firebase jika perlu.
  checkLocalStorageCache();
}

// Jalankan fungsi utama saat DOM dimuat
document.addEventListener("DOMContentLoaded", loadPortfolio);