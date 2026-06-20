const data = window.EBOOK_DATA;
const pageCount = data.pageCount;

const book = document.getElementById("book");
const leftPage = document.getElementById("leftPage");
const rightPage = document.getElementById("rightPage");
const tocPanel = document.getElementById("tocPanel");
const tocList = document.getElementById("tocList");
const pageIndicator = document.getElementById("pageIndicator");
const progressBar = document.getElementById("progressBar");
const zoomRange = document.getElementById("zoomRange");
const installBtn = document.getElementById("installBtn");
const installGuide = document.getElementById("installGuide");
const closeInstallGuideBtn = document.getElementById("closeInstallGuideBtn");

let currentPage = 1;
let isAnimating = false;
let touchStartX = 0;
let deferredInstallPrompt = null;

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

installBtn.hidden = isStandaloneApp();

function pageSrc(page) {
  return `./pages/page-${String(page).padStart(3, "0")}.webp`;
}

function isNarrow() {
  return window.matchMedia("(max-width: 860px)").matches;
}

function spreadFor(page) {
  if (page <= 1 || page >= pageCount || isNarrow()) return [page, null];
  const left = page % 2 === 0 ? page : page - 1;
  return [Math.max(2, left), Math.min(pageCount, left + 1)];
}

function normalizeTarget(page) {
  const bounded = Math.max(1, Math.min(pageCount, page));
  if (bounded <= 1 || bounded >= pageCount || isNarrow()) return bounded;
  return bounded % 2 === 0 ? bounded : bounded - 1;
}

function render() {
  const [left, right] = spreadFor(currentPage);
  leftPage.src = pageSrc(left);
  leftPage.alt = `第 ${left} 页`;

  if (right) {
    rightPage.src = pageSrc(right);
    rightPage.alt = `第 ${right} 页`;
    book.classList.remove("single");
    pageIndicator.textContent = `${left}-${right} / ${pageCount}`;
  } else {
    rightPage.removeAttribute("src");
    rightPage.alt = "";
    book.classList.add("single");
    pageIndicator.textContent = `${left} / ${pageCount}`;
  }

  progressBar.style.width = `${(left / pageCount) * 100}%`;
}

function imageReady(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });
}

async function prepareSpread(page) {
  const [left, right] = spreadFor(page);
  const images = [imageReady(pageSrc(left))];
  if (right) images.push(imageReady(pageSrc(right)));
  await Promise.all(images);
}

function playTurn(direction) {
  const cls = direction === "back" ? "turn-back" : "turn-forward";
  book.classList.remove("turn-back", "turn-forward");
  void book.offsetWidth;
  book.classList.add(cls);
  window.setTimeout(() => {
    book.classList.remove(cls);
    isAnimating = false;
  }, 430);
}

async function goTo(page, direction = "forward", force = false) {
  const target = normalizeTarget(page);
  if ((target === currentPage && !force) || isAnimating) return;
  isAnimating = true;
  await prepareSpread(target);
  currentPage = target;
  render();
  preloadAround(currentPage);
  playTurn(direction);
}

function jumpToPhysicalPage(page) {
  const target = normalizeTarget(page);
  const direction = target < currentPage ? "back" : "forward";
  goTo(target, direction, true);
}

function next() {
  const step = isNarrow() || currentPage <= 1 ? 1 : 2;
  goTo(currentPage + step, "forward");
}

function prev() {
  const step = isNarrow() || currentPage <= 2 ? 1 : 2;
  goTo(currentPage - step, "back");
}

function preload(page) {
  if (page < 1 || page > pageCount) return;
  const img = new Image();
  img.src = pageSrc(page);
}

function preloadAround(page) {
  for (let offset = -4; offset <= 6; offset += 1) {
    preload(page + offset);
  }
}

function buildToc() {
  const groups = new Map();
  data.entries.forEach((entry) => {
    if (!groups.has(entry.department)) groups.set(entry.department, []);
    groups.get(entry.department).push(entry);
  });

  groups.forEach((items, department) => {
    const heading = document.createElement("div");
    heading.className = "toc-dept";
    heading.textContent = department;
    tocList.appendChild(heading);

    items.forEach((entry) => {
      const item = document.createElement("button");
      item.className = "toc-item";
      item.type = "button";
      item.innerHTML = `
        <span class="toc-page">${String(entry.articlePage).padStart(2, "0")}</span>
        <span>
          <span class="toc-title">${entry.title}</span>
          <span class="toc-meta">${entry.name}</span>
        </span>
      `;
      item.addEventListener("click", () => {
        tocPanel.classList.remove("open");
        jumpToPhysicalPage(entry.physicalPage);
      });
      tocList.appendChild(item);
    });
  });
}

document.getElementById("nextBtn").addEventListener("click", next);
document.getElementById("prevBtn").addEventListener("click", prev);
document.getElementById("firstBtn").addEventListener("click", () => goTo(1, "back"));
document.getElementById("lastBtn").addEventListener("click", () => goTo(pageCount, "forward"));
document.getElementById("tocBtn").addEventListener("click", () => tocPanel.classList.toggle("open"));
document.getElementById("closeTocBtn").addEventListener("click", () => tocPanel.classList.remove("open"));

document.getElementById("fullscreenBtn").addEventListener("click", async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen?.();
  } else {
    await document.exitFullscreen?.();
  }
});

zoomRange.addEventListener("input", () => {
  book.style.setProperty("--zoom", Number(zoomRange.value) / 100);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "PageDown") next();
  if (event.key === "ArrowLeft" || event.key === "PageUp") prev();
  if (event.key === "Home") goTo(1, "back");
  if (event.key === "End") goTo(pageCount, "forward");
  if (event.key === "Escape") tocPanel.classList.remove("open");
});

book.addEventListener("click", (event) => {
  const rect = book.getBoundingClientRect();
  const x = event.clientX - rect.left;
  if (x > rect.width / 2) next();
  else prev();
});

book.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

book.addEventListener("touchend", (event) => {
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) < 38) return;
  if (delta < 0) next();
  else prev();
}, { passive: true });

window.addEventListener("resize", () => {
  currentPage = normalizeTarget(currentPage);
  render();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
    return;
  }
  installGuide.hidden = false;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((registration) => registration.update())
      .catch((error) => {
        console.warn("Service worker registration failed", error);
      });
  });
}

closeInstallGuideBtn.addEventListener("click", () => {
  installGuide.hidden = true;
});

installGuide.addEventListener("click", (event) => {
  if (event.target === installGuide) installGuide.hidden = true;
});

buildToc();
render();
preloadAround(1);
