(function () {
  const STORAGE_KEY = "husco5000-guide-v1";
  const stages = [
    "overview", "prep", "disassembly", "seals",
    "reassembly", "testing", "troubleshoot", "parts", "torques"
  ];
  const STAGE_LABELS = {
    overview: "Overview",
    prep: "Prep",
    disassembly: "Disassembly",
    seals: "Seals",
    reassembly: "Reassembly",
    testing: "Testing",
    troubleshoot: "Troubleshoot",
    parts: "Parts",
    torques: "Torques"
  };
  const MORE_STAGES = ["overview", "troubleshoot", "parts", "torques"];

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

  function navLinks() {
    return $$(".stage-nav a, .bottom-nav a, .more-sheet a");
  }

  function closeMore() {
    const sheet = $("#more-sheet");
    const backdrop = $("#more-backdrop");
    const toggle = $("#more-toggle");
    if (sheet) sheet.hidden = true;
    if (backdrop) backdrop.hidden = true;
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function openMore() {
    const sheet = $("#more-sheet");
    const backdrop = $("#more-backdrop");
    const toggle = $("#more-toggle");
    if (sheet) sheet.hidden = false;
    if (backdrop) backdrop.hidden = false;
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }

  function toggleMore() {
    const sheet = $("#more-sheet");
    if (!sheet || sheet.hidden) openMore();
    else closeMore();
  }

  function updatePager(id) {
    const i = stages.indexOf(id);
    $$(".stage-pager").forEach((pager) => {
      const prev = pager.querySelector(".pager-prev");
      const next = pager.querySelector(".pager-next");
      if (prev) {
        if (i > 0) {
          prev.classList.remove("pager-disabled");
          prev.setAttribute("href", "#" + stages[i - 1]);
          prev.textContent = "← " + STAGE_LABELS[stages[i - 1]];
        } else {
          prev.classList.add("pager-disabled");
          prev.removeAttribute("href");
          prev.textContent = "← Start";
        }
      }
      if (next) {
        if (i < stages.length - 1) {
          next.classList.remove("pager-disabled");
          next.setAttribute("href", "#" + stages[i + 1]);
          next.textContent = STAGE_LABELS[stages[i + 1]] + " →";
        } else {
          next.classList.add("pager-disabled");
          next.removeAttribute("href");
          next.textContent = "End";
        }
      }
    });
  }

  function showStage(id) {
    if (!stages.includes(id)) id = "overview";
    $$(".stage").forEach((el) => el.classList.toggle("active", el.id === id));
    navLinks().forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
    const moreToggle = $("#more-toggle");
    if (moreToggle) moreToggle.classList.toggle("active", MORE_STAGES.includes(id));
    const heading = $("#" + id + " h2");
    if (heading && document.activeElement && document.activeElement.classList.contains("nav-link")) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0 });
    const activePill = $(".stage-nav a.active");
    if (activePill && activePill.scrollIntoView) {
      activePill.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
    updatePager(id);
    closeMore();
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
      $$('a[href="#' + id + '"]').forEach((link) => {
        link.classList.toggle("done", c.total > 0 && c.done === c.total);
        const meter = link.querySelector(".meter");
        if (meter && c.total) meter.textContent = c.done + "/" + c.total;
      });
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
    navLinks().forEach((a) => a.classList.add("nav-link"));
    const toggle = $("#more-toggle");
    if (toggle) toggle.addEventListener("click", toggleMore);
    const backdrop = $("#more-backdrop");
    if (backdrop) backdrop.addEventListener("click", closeMore);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMore();
    });
  }

  function injectPagers() {
    $$(".stage").forEach((sec) => {
      if (sec.querySelector(".stage-pager")) return;
      const nav = document.createElement("nav");
      nav.className = "stage-pager no-print";
      nav.setAttribute("aria-label", "Previous and next stage");
      nav.innerHTML = '<a class="pager-prev"></a><a class="pager-next"></a>';
      sec.appendChild(nav);
    });
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

    injectPagers();
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
