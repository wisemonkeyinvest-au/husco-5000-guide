(function () {
  const STORAGE_KEY = "husco5000-guide-v1";
  const DB_NAME = "husco5000-notes";
  const DB_STORE = "entries";
  const stages = [
    "overview", "prep", "disassembly", "seals",
    "reassembly", "testing", "troubleshoot", "parts", "torques", "photos"
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
    torques: "Torques",
    photos: "My photos"
  };
  const MORE_STAGES = ["overview", "troubleshoot", "parts", "torques", "photos"];
  const urlCache = new Map();

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

  function hashParts() {
    const raw = (location.hash || "#overview").replace(/^#/, "");
    const [id, step] = raw.split("/");
    return { id: stages.includes(id) ? id : "overview", step: step || "" };
  }
  function currentStage() {
    return hashParts().id;
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
    if (id === "photos") renderAlbum();
    const jump = hashParts().step;
    if (jump) {
      requestAnimationFrame(() => {
        const el = document.querySelector('.step-block[data-step-id="' + jump + '"]');
        if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }
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
      if (e.key !== "Escape") return;
      if ($("#lightbox") && !$("#lightbox").hidden) {
        closeLightbox();
        return;
      }
      closeMore();
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

  /* ---------- IndexedDB photo notes ---------- */

  let dbPromise = null;
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          const store = db.createObjectStore(DB_STORE, { keyPath: "key" });
          store.createIndex("stage", "stage", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function entryKey(stage, stepId) {
    return stage + ":" + stepId;
  }

  function emptyEntry(stage, stepId) {
    return { key: entryKey(stage, stepId), stage: stage, stepId: stepId, note: "", photos: [] };
  }

  function idbGet(key) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const req = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }));
  }

  function idbPut(entry) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const req = db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE).put(entry);
      req.onsuccess = () => resolve(entry);
      req.onerror = () => reject(req.error);
    }));
  }

  function idbDelete(key) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const req = db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }));
  }

  function idbAll() {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const req = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    }));
  }

  function idbClear() {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const req = db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }));
  }

  function photoUrl(photo) {
    if (!urlCache.has(photo.id)) urlCache.set(photo.id, URL.createObjectURL(photo.blob));
    return urlCache.get(photo.id);
  }

  function forgetPhotoUrl(id) {
    const url = urlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      urlCache.delete(id);
    }
  }

  function itemCount(entry) {
    if (!entry) return 0;
    return (entry.photos ? entry.photos.length : 0) + (entry.note && entry.note.trim() ? 1 : 0);
  }

  function shrinkImage(file) {
    const MAX = 1280;
    const QUALITY = 0.75;
    return (window.createImageBitmap
      ? createImageBitmap(file)
      : new Promise((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
          img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
          img.src = url;
        })
    ).then((bmp) => {
      let w = bmp.width;
      let h = bmp.height;
      const long = Math.max(w, h) || 1;
      if (long > MAX) {
        const s = MAX / long;
        w = Math.max(1, Math.round(w * s));
        h = Math.max(1, Math.round(h * s));
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bmp, 0, 0, w, h);
      if (bmp.close) bmp.close();
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) reject(new Error("Could not compress image"));
          else resolve({ blob: blob, width: w, height: h });
        }, "image/jpeg", QUALITY);
      });
    });
  }

  function stepTitle(stepId) {
    const block = document.querySelector('.step-block[data-step-id="' + stepId + '"]');
    const h = block && block.querySelector("h3");
    return h ? h.textContent.replace(/\s+/g, " ").trim() : stepId;
  }

  function wrapSteps() {
    $$("label.step").forEach((label) => {
      const box = label.querySelector("input[data-id]");
      if (!box || label.closest(".step-block")) return;
      const stage = label.closest(".stage")?.id;
      if (!stage) return;
      const wrap = document.createElement("div");
      wrap.className = "step-block";
      wrap.dataset.stepId = box.dataset.id;
      wrap.dataset.stage = stage;
      label.parentNode.insertBefore(wrap, label);
      wrap.appendChild(label);
      const notes = document.createElement("div");
      notes.className = "step-notes";
      wrap.appendChild(notes);
    });
  }

  function renderStepNotes(wrap, entry, open) {
    const stage = wrap.dataset.stage;
    const stepId = wrap.dataset.stepId;
    const host = wrap.querySelector(".step-notes");
    if (!host) return;
    const count = itemCount(entry);
    const preview = entry && entry.note && entry.note.trim() ? entry.note.trim() : "";
    const wasOpen = open != null ? open : !!(host.querySelector(".note-panel") && !host.querySelector(".note-panel").hidden);
    host.innerHTML = "";

    const bar = document.createElement("div");
    bar.className = "note-bar no-print";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "note-toggle" + (count ? " has-items" : "");
    toggle.innerHTML = '<span>Add photo / note</span><span class="note-badge">' + count + "</span>";
    toggle.setAttribute("aria-expanded", wasOpen ? "true" : "false");
    bar.appendChild(toggle);
    if (preview && !wasOpen) {
      const p = document.createElement("p");
      p.className = "note-preview";
      p.textContent = preview.length > 90 ? preview.slice(0, 87) + "…" : preview;
      bar.appendChild(p);
    }
    host.appendChild(bar);

    const panel = document.createElement("div");
    panel.className = "note-panel no-print";
    panel.hidden = !wasOpen;
    panel.innerHTML =
      '<div class="note-actions">' +
        '<button type="button" class="btn btn-pdf js-take">Take photo</button>' +
        '<button type="button" class="btn btn-ghost js-pick">Choose photo</button>' +
        '<input type="file" accept="image/*" capture="environment" class="js-file-cam" hidden>' +
        '<input type="file" accept="image/*" class="js-file-pick" hidden>' +
      "</div>" +
      '<label class="note-privacy" for="note-' + stepId + '">Short note</label>' +
      '<textarea id="note-' + stepId + '" maxlength="800" placeholder="e.g. counterbore nicked on B end, or torque reading"></textarea>' +
      '<p class="note-status" aria-live="polite"></p>' +
      '<p class="note-privacy">Photos stay on this phone only. Nothing is uploaded.</p>';
    host.appendChild(panel);

    const thumbs = document.createElement("div");
    thumbs.className = "thumbs";
    (entry && entry.photos ? entry.photos : []).forEach((photo) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "thumb";
      const img = document.createElement("img");
      img.className = "thumb";
      img.alt = "Photo for " + stepTitle(stepId);
      img.src = photoUrl(photo);
      btn.appendChild(img);
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(stage, stepId, photo.id);
      });
      thumbs.appendChild(btn);
    });
    if (thumbs.childNodes.length) host.appendChild(thumbs);

    if (preview) {
      const printNote = document.createElement("p");
      printNote.className = "note-preview print-only";
      printNote.textContent = preview;
      host.appendChild(printNote);
    }

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
    });

    const cam = panel.querySelector(".js-file-cam");
    const pick = panel.querySelector(".js-file-pick");
    panel.querySelector(".js-take").addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); cam.click(); });
    panel.querySelector(".js-pick").addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); pick.click(); });
    const onFile = (input) => {
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        input.value = "";
        if (file) addPhoto(stage, stepId, file, wrap, panel);
      });
    };
    onFile(cam);
    onFile(pick);

    const ta = panel.querySelector("textarea");
    ta.value = entry && entry.note ? entry.note : "";
    let t = null;
    const saveNote = () => {
      persistNote(stage, stepId, ta.value, wrap, panel, true);
    };
    ta.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(saveNote, 400);
    });
    ta.addEventListener("blur", saveNote);
  }

  function setStatus(panel, text, isError) {
    const el = panel && panel.querySelector(".note-status");
    if (!el) return;
    el.textContent = text || "";
    el.style.color = isError ? "var(--danger)" : "var(--ok)";
  }

  function addPhoto(stage, stepId, file, wrap, panel) {
    if (!file.type || !file.type.startsWith("image/")) {
      setStatus(panel, "That file isn’t an image.", true);
      return;
    }
    setStatus(panel, "Adding photo…");
    shrinkImage(file).then((out) => {
      const photo = {
        id: "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
        blob: out.blob,
        width: out.width,
        height: out.height,
        added: new Date().toISOString()
      };
      return idbGet(entryKey(stage, stepId)).then((existing) => {
        const entry = existing || emptyEntry(stage, stepId);
        entry.photos = (entry.photos || []).concat([photo]);
        return idbPut(entry);
      });
    }).then((entry) => {
      setStatus(panel, "Saved on this phone.");
      renderStepNotes(wrap, entry, true);
      updateNoteCounts();
      if (currentStage() === "photos") renderAlbum();
    }).catch((err) => {
      setStatus(panel, "Couldn’t add that photo.", true);
      console.warn(err);
    });
  }

  function persistNote(stage, stepId, text, wrap, panel, keepOpen) {
    return idbGet(entryKey(stage, stepId)).then((existing) => {
      const entry = existing || emptyEntry(stage, stepId);
      const next = (text || "").replace(/^\s+|\s+$/g, "");
      if (entry.note === (text || "") || (entry.note || "") === next && next === (text || "").trim()) {
        // still write trimmed if changed
      }
      if (entry.note === (text || "")) return entry;
      entry.note = text || "";
      if (!entry.note.trim() && !(entry.photos && entry.photos.length)) {
        return idbDelete(entry.key).then(() => emptyEntry(stage, stepId));
      }
      return idbPut(entry);
    }).then((entry) => {
      setStatus(panel, "Note saved on this phone.");
      // Don't rebuild the panel on every keystroke — only update badge/counts
      const toggle = wrap.querySelector(".note-toggle");
      const count = itemCount(entry);
      if (toggle) {
        toggle.classList.toggle("has-items", count > 0);
        const badge = toggle.querySelector(".note-badge");
        if (badge) badge.textContent = String(count);
      }
      updateNoteCounts();
      return entry;
    }).catch((err) => {
      setStatus(panel, "Couldn’t save the note.", true);
      console.warn(err);
    });
  }

  function refreshAllStepNotes() {
    return idbAll().then((rows) => {
      const map = {};
      rows.forEach((row) => { map[row.key] = row; });
      $$(".step-block").forEach((wrap) => {
        const key = entryKey(wrap.dataset.stage, wrap.dataset.stepId);
        renderStepNotes(wrap, map[key] || null, false);
      });
      updateNoteCounts(rows);
    }).catch((err) => console.warn(err));
  }

  function updateNoteCounts(rows) {
    const apply = (list) => {
      const byStage = {};
      list.forEach((row) => {
        const n = itemCount(row);
        if (!n) return;
        byStage[row.stage] = (byStage[row.stage] || 0) + n;
      });
      const total = Object.keys(byStage).reduce((s, k) => s + byStage[k], 0);
      $$(".stage-nav a, .bottom-nav a, .more-sheet a").forEach((link) => {
        const href = link.getAttribute("href") || "";
        const id = href.replace(/^#/, "");
        let n = 0;
        if (id === "photos") n = total;
        else n = byStage[id] || 0;
        let badge = link.querySelector(":scope > .note-count, .nav-text > .note-count");
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "note-count";
          const text = link.querySelector(".nav-text") || link;
          text.appendChild(badge);
        }
        if (n) {
          badge.hidden = false;
          badge.textContent = String(n);
        } else {
          badge.hidden = true;
          badge.textContent = "";
        }
      });
    };
    if (rows) apply(rows);
    else idbAll().then(apply).catch(() => {});
  }

  let lightboxContext = null;

  function openLightbox(stage, stepId, photoId) {
    idbGet(entryKey(stage, stepId)).then((entry) => {
      const photo = entry && (entry.photos || []).find((p) => p.id === photoId);
      if (!photo) return;
      lightboxContext = { stage: stage, stepId: stepId, photoId: photoId };
      const box = $("#lightbox");
      const img = $("#lightbox-img");
      const cap = $("#lightbox-cap");
      img.src = photoUrl(photo);
      img.alt = "Photo for " + stepTitle(stepId);
      cap.textContent = STAGE_LABELS[stage] + " — " + stepTitle(stepId);
      box.hidden = false;
    });
  }

  function closeLightbox() {
    const box = $("#lightbox");
    const img = $("#lightbox-img");
    if (img) img.removeAttribute("src");
    if (box) box.hidden = true;
    lightboxContext = null;
  }

  function deleteLightboxPhoto() {
    const ctx = lightboxContext;
    if (!ctx) return;
    if (!confirm("Delete this photo from this phone?")) return;
    idbGet(entryKey(ctx.stage, ctx.stepId)).then((entry) => {
      if (!entry) return;
      entry.photos = (entry.photos || []).filter((p) => p.id !== ctx.photoId);
      forgetPhotoUrl(ctx.photoId);
      const wrap = document.querySelector('.step-block[data-step-id="' + ctx.stepId + '"]');
      if (!entry.photos.length && !(entry.note && entry.note.trim())) {
        return idbDelete(entry.key).then(() => {
          if (wrap) renderStepNotes(wrap, null, true);
        });
      }
      return idbPut(entry).then((saved) => {
        if (wrap) renderStepNotes(wrap, saved, true);
      });
    }).then(() => {
      closeLightbox();
      updateNoteCounts();
      if (currentStage() === "photos") renderAlbum();
    });
  }

  function renderAlbum() {
    const list = $("#album-list");
    const stat = $("#album-stat");
    if (!list) return;
    idbAll().then((rows) => {
      const useful = rows.filter((r) => itemCount(r) > 0);
      const photos = useful.reduce((n, r) => n + (r.photos ? r.photos.length : 0), 0);
      const notes = useful.reduce((n, r) => n + (r.note && r.note.trim() ? 1 : 0), 0);
      if (stat) {
        stat.textContent = useful.length
          ? photos + " photo" + (photos === 1 ? "" : "s") + ", " + notes + " note" + (notes === 1 ? "" : "s")
          : "No photos or notes yet.";
      }
      list.innerHTML = "";
      if (!useful.length) {
        const p = document.createElement("p");
        p.className = "album-empty";
        p.textContent = "Attach a photo or note to any checklist step and it will show up here.";
        list.appendChild(p);
        return;
      }
      const order = stages.filter((id) => id !== "photos");
      order.forEach((stage) => {
        const groupRows = useful.filter((r) => r.stage === stage);
        if (!groupRows.length) return;
        const group = document.createElement("div");
        group.className = "album-group";
        const h = document.createElement("h3");
        h.textContent = STAGE_LABELS[stage] || stage;
        group.appendChild(h);
        groupRows.forEach((row) => {
          const item = document.createElement("div");
          item.className = "album-item";
          const title = document.createElement("h4");
          title.textContent = stepTitle(row.stepId);
          item.appendChild(title);
          if (row.note && row.note.trim()) {
            const note = document.createElement("p");
            note.className = "note-preview";
            note.textContent = row.note.trim();
            item.appendChild(note);
          }
          if (row.photos && row.photos.length) {
            const thumbs = document.createElement("div");
            thumbs.className = "thumbs";
            row.photos.forEach((photo) => {
              const btn = document.createElement("button");
              btn.type = "button";
              btn.className = "thumb";
              const img = document.createElement("img");
              img.className = "thumb";
              img.alt = "Photo for " + stepTitle(row.stepId);
              img.src = photoUrl(photo);
              btn.appendChild(img);
              btn.addEventListener("click", () => openLightbox(row.stage, row.stepId, photo.id));
              thumbs.appendChild(btn);
            });
            item.appendChild(thumbs);
          }
          const link = document.createElement("a");
          link.className = "album-link";
          link.href = "#" + row.stage + "/" + row.stepId;
          link.textContent = "Go to this step";
          item.appendChild(link);
          group.appendChild(item);
        });
        list.appendChild(group);
      });
    }).catch((err) => {
      list.textContent = "Couldn’t load photos from this phone.";
      console.warn(err);
    });
  }

  function bindPhotoUi() {
    const closeBtn = $("#lightbox-close");
    const box = $("#lightbox");
    const del = $("#lightbox-delete");
    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    if (box) box.addEventListener("click", (e) => {
      if (e.target === box) closeLightbox();
    });
    if (del) del.addEventListener("click", deleteLightboxPhoto);
    const clear = $("#clear-photos");
    if (clear) clear.addEventListener("click", () => {
      if (!confirm("Delete all photos and notes from this phone? This cannot be undone.")) return;
      idbClear().then(() => {
        urlCache.forEach((url) => URL.revokeObjectURL(url));
        urlCache.clear();
        $$(".step-block").forEach((wrap) => renderStepNotes(wrap, null, false));
        updateNoteCounts([]);
        renderAlbum();
      });
    });
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
    wrapSteps();
    applyChecks(loadState());
    bindChecks();
    bindReset();
    bindTabs();
    bindSearch();
    bindNav();
    bindPhotoUi();
    showStage(currentStage());
    renderProgress();
    refreshAllStepNotes();
    registerSW();
  });
})();
