(function () {
  const STORAGE_KEY = "husco5000-guide-v1";
  const stages = [
    "overview", "prep", "disassembly", "seals",
    "reassembly", "testing", "troubleshoot", "parts", "torques"
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function currentStage() {
    const hash = (location.hash || "#overview").replace("#", "");
    return stages.includes(hash) ? hash : "overview";
  }

  function showStage(id) {
    if (!stages.includes(id)) id = "overview";
    $$(".stage").forEach((el) => el.classList.toggle("active", el.id === id));
    $$(".stage-nav a").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
    const heading = $("#" + id + " h2");
    if (heading && document.activeElement && document.activeElement.classList.contains("nav-link")) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    const headerH = $(".site-header")?.offsetHeight || 0;
    const navH = $(".stage-nav-wrap")?.offsetHeight || 0;
    window.scrollTo({ top: 0 });
    // keep sticky nav from covering nothing at top
    void headerH; void navH;
  }

  function applyChecks(state) {
    $$("input[type='checkbox'][data-id]").forEach((box) => {
      box.checked = !!state[box.dataset.id];
      box.closest(".step")?.classList.toggle("done", box.checked);
    });
  }

  function stageProgress() {
    const counts = {};
    stages.forEach((id) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      const boxes = $$("input[type='checkbox'][data-id]", sec);
      const done = boxes.filter((b) => b.checked).length;
      counts[id] = { done, total: boxes.length };
    });
    return counts;
  }

  function renderProgress() {
    const counts = stageProgress();
    let done = 0, total = 0;
    Object.entries(counts).forEach(([id, c]) => {
      done += c.done;
      total += c.total;
      const link = $('.stage-nav a[href="#' + id + '"]');
      if (link) {
        link.classList.toggle("done", c.total > 0 && c.done === c.total);
        const meter = link.querySelector(".meter");
        if (meter && c.total) meter.textContent = c.done + "/" + c.total;
      }
    });
    const label = $("#progress-label");
    if (label) label.textContent = total ? done + " / " + total + " steps" : "";
    const bar = $("#progress-fill");
    if (bar) bar.style.width = total ? (100 * done) / total + "%" : "0%";
  }

  function bindChecks() {
    document.addEventListener("change", (e) => {
      const box = e.target;
      if (!(box instanceof HTMLInputElement) || box.type !== "checkbox" || !box.dataset.id) return;
      const state = loadState();
      if (box.checked) state[box.dataset.id] = true;
      else delete state[box.dataset.id];
      saveState(state);
      box.closest(".step")?.classList.toggle("done", box.checked);
      renderProgress();
    });
  }

  function bindReset() {
    const btn = $("#reset-progress");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (!confirm("Clear all checked steps on this device?")) return;
      localStorage.removeItem(STORAGE_KEY);
      applyChecks({});
      renderProgress();
    });
  }

  function bindTabs() {
    $$(".tabs").forEach((tablist) => {
      const buttons = $$("button[role='tab']", tablist);
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const target = btn.getAttribute("aria-controls");
          buttons.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
          const parent = tablist.parentElement;
          $$(".tab-panel", parent).forEach((p) => {
            p.hidden = p.id !== target;
          });
        });
      });
    });
  }

  function bindSearch() {
    const input = $("#trouble-search");
    if (!input) return;
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      $$("#trouble-table tbody tr").forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.hidden = q && !text.includes(q);
      });
    });
  }

  function bindNav() {
    window.addEventListener("hashchange", () => showStage(currentStage()));
    $$(".stage-nav a").forEach((a) => a.classList.add("nav-link"));
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      const pill = $("#offline-pill");
      if (pill) {
        pill.classList.add("show");
        pill.textContent = "Works offline after this visit";
        setTimeout(() => pill.classList.remove("show"), 5000);
      }
      return reg;
    }).catch(() => {});
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Prefer inlined official-manual crops when figures.js loaded (also helps a text-only deploy).
    if (window.HUSCO_FIGURES) {
      document.querySelectorAll('img[src^="figures/"]').forEach((img) => {
        const name = img.getAttribute("src").split("/").pop();
        if (window.HUSCO_FIGURES[name]) img.src = window.HUSCO_FIGURES[name];
      });
    }

    applyChecks(loadState());
    bindChecks();
    bindReset();
    bindTabs();
    bindSearch();
    bindNav();
    showStage(currentStage());
    renderProgress();
    registerSW();
  });
})();
