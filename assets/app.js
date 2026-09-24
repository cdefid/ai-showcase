(() => {
  "use strict";

  // Facets shown in the filter rail. `get` returns the values a project has for that facet.
  const FACETS = [
    { key: "ep", label: "Episode", get: (p) => [String(p.episode)], format: (v) => `Episode ${v}` },
    { key: "category", label: "Category", get: (p) => [p.category] },
    { key: "tag", label: "Tags", get: (p) => p.tags || [] },
    { key: "tool", label: "Built with", get: (p) => p.builtWith || [] },
    { key: "avail", label: "Availability", get: (p) => p.availability || [] },
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const timecode = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const mm = h ? String(m).padStart(2, "0") : String(m);
    return (h ? `${h}:` : "") + `${mm}:${String(s).padStart(2, "0")}`;
  };
  const ytLink = (id, sec = 0) => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}${sec ? `&t=${sec}s` : ""}`;
  const formatDate = (d) => {
    if (!d) return "";
    const [y, m, day] = d.split("-").map(Number);
    const date = new Date(Date.UTC(y, (m || 1) - 1, day || 1));
    const opts = { year: "numeric", month: "long", timeZone: "UTC" };
    if (day) opts.day = "numeric";
    return date.toLocaleDateString("en-GB", opts);
  };

  const playIcon =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4 2.5v11a.5.5 0 0 0 .76.43l9-5.5a.5.5 0 0 0 0-.86l-9-5.5A.5.5 0 0 0 4 2.5Z"/></svg>';

  let data;
  let catColor = {};
  const FACET_PREVIEW = 8;
  const state = { q: "", sel: {}, episode: null, open: new Set(), expanded: new Set() };

  // ---------- URL state ----------
  function readURL() {
    const params = new URLSearchParams(location.search);
    state.q = params.get("q") || "";
    FACETS.forEach((f) => (state.sel[f.key] = new Set(params.getAll(f.key))));
    const ep = Number(params.get("episode"));
    state.episode = data.episodes.some((e) => e.number === ep) ? ep : Math.max(...data.episodes.map((e) => e.number));
  }
  function writeURL() {
    const params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    FACETS.forEach((f) => state.sel[f.key].forEach((v) => params.append(f.key, v)));
    const latest = Math.max(...data.episodes.map((e) => e.number));
    if (state.episode !== latest) params.set("episode", state.episode);
    const qs = params.toString();
    history.replaceState(null, "", `${location.pathname}${qs ? "?" + qs : ""}${location.hash}`);
  }

  // ---------- Episode ----------
  function renderEpisodeTabs() {
    const nav = $("#episode-tabs");
    const eps = [...data.episodes].sort((a, b) => b.number - a.number);
    nav.hidden = eps.length < 2;
    nav.innerHTML = eps
      .map((e) => `<button type="button" data-ep="${e.number}" aria-pressed="${e.number === state.episode}">Episode ${e.number}</button>`)
      .join("");
  }

  function renderEpisode() {
    const ep = data.episodes.find((e) => e.number === state.episode);
    const byId = Object.fromEntries(data.projects.map((p) => [p.id, p]));
    const chapters = [...ep.chapters].sort((a, b) => a.start - b.start);
    const total = ep.durationSeconds || chapters[chapters.length - 1].start + 600;

    const segs = chapters.map((c, i) => {
      const end = i + 1 < chapters.length ? chapters[i + 1].start : total;
      const p = c.project && byId[c.project];
      const color = p ? catColor[p.category] : null;
      return { ...c, len: Math.max(end - c.start, 1), color, maker: p?.maker };
    });

    const meta = [formatDate(ep.date), ep.language, ep.hosts?.length ? `Hosted by ${ep.hosts.join(" and ")}` : ""]
      .filter(Boolean)
      .join(", ");

    $("#episode").innerHTML = `
      <div class="ep-head">
        <div>
          <h2 id="episode-title">Episode ${ep.number}: ${esc(ep.title)}</h2>
          <p class="ep-meta">${esc(meta)}</p>
        </div>
        <a class="btn" href="${ytLink(ep.youtubeId)}" target="_blank" rel="noopener">${playIcon}Watch the recording</a>
      </div>
      <p class="ep-summary">${esc(ep.summary)}</p>
      <div class="runsheet">
        <p class="runsheet-title">Run sheet</p>
        <div class="track" role="list">
          ${segs
            .map(
              (s) => `<a role="listitem" class="seg${s.color ? "" : " rest"}" style="--w:${s.len};${s.color ? `--seg:${s.color}` : ""}"
                  href="${ytLink(ep.youtubeId, s.start)}" target="_blank" rel="noopener"
                  title="${esc(`${timecode(s.start)}  ${s.label}${s.maker ? ` by ${s.maker}` : ""}`)}"
                  aria-label="${esc(`Watch ${s.label} from ${timecode(s.start)}`)}"><span>${esc(s.label)}</span></a>`
            )
            .join("")}
        </div>
        <div class="scale" aria-hidden="true"><span>0:00</span><span>${timecode(total)}</span></div>
        <ol class="chapters">
          ${segs
            .map(
              (s) => `<li><a href="${ytLink(ep.youtubeId, s.start)}" target="_blank" rel="noopener">
                  <span class="ch-time">${timecode(s.start)}</span>
                  <span class="ch-dot" style="${s.color ? `--seg:${s.color}` : ""}"></span>
                  <span><span class="ch-label">${esc(s.label)}</span>${s.maker ? `<br><small>${esc(s.maker)}</small>` : ""}</span>
                </a></li>`
            )
            .join("")}
        </ol>
        ${
          ep.takeaways?.length
            ? `<details class="takeaways"><summary>What the panel learned about vibe coding</summary>
                 <ul>${ep.takeaways.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></details>`
            : ""
        }
      </div>`;
  }

  // ---------- Filtering ----------
  const haystack = (p) =>
    [p.name, p.tagline, p.maker, p.summary, p.category, ...(p.tags || []), ...(p.builtWith || []), ...(p.stack || [])]
      .join(" ")
      .toLowerCase();

  // A project passes when it matches the search and, for every facet with a selection,
  // has at least one selected value (OR within a facet, AND across facets).
  function matches(p, skipKey) {
    if (state.q && !haystack(p).includes(state.q.toLowerCase())) return false;
    return FACETS.every((f) => {
      if (f.key === skipKey) return true;
      const sel = state.sel[f.key];
      return !sel.size || f.get(p).some((v) => sel.has(v));
    });
  }

  function renderFacets() {
    $("#facets").innerHTML = FACETS.map((f) => {
      const all = new Map();
      data.projects.forEach((p) => f.get(p).forEach((v) => all.set(v, 0)));
      data.projects.filter((p) => matches(p, f.key)).forEach((p) => f.get(p).forEach((v) => all.set(v, all.get(v) + 1)));
      if (all.size < 2 && !state.sel[f.key].size) return "";
      const values = [...all.keys()].sort((a, b) =>
        f.key === "ep" ? Number(b) - Number(a) : all.get(b) - all.get(a) || a.localeCompare(b)
      );
      const expanded = state.expanded.has(f.key);
      const hiddenCount = values.length - FACET_PREVIEW;
      return `<fieldset class="facet"><legend>${f.label}</legend><div class="chips">
        ${values
          .map((v, i) => {
            const on = state.sel[f.key].has(v);
            const n = all.get(v);
            const sw = f.key === "category" ? `<i class="sw" style="--seg:${catColor[v]}"></i>` : "";
            if (!expanded && hiddenCount > 1 && i >= FACET_PREVIEW && !on) return "";
            return `<button type="button" class="chip" data-facet="${f.key}" data-value="${esc(v)}" aria-pressed="${on}" ${
              !n && !on ? "disabled" : ""
            }>${sw}${esc(f.format ? f.format(v) : v)} <span class="n">${n}</span></button>`;
          })
          .join("")}
      </div>${
        hiddenCount > 1
          ? `<button type="button" class="facet-more" data-expand="${f.key}" aria-expanded="${expanded}">${
              expanded ? "Show fewer" : `Show all ${values.length}`
            }</button>`
          : ""
      }</fieldset>`;
    }).join("");

    const active = FACETS.reduce((n, f) => n + state.sel[f.key].size, 0) + (state.q ? 1 : 0);
    $("#active-count").textContent = active ? `(${active})` : "";
    $("#clear").hidden = !active;
  }

  function projectHTML(p) {
    const ep = data.episodes.find((e) => e.number === p.episode);
    const open = state.open.has(p.id);
    const L = p.links || {};
    const list = (arr) => `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    const sec = (title, body, span) => (body ? `<section class="${span ? "span" : ""}"><h3>${title}</h3>${body}</section>` : "");

    return `<li class="project" id="${esc(p.id)}">
      <div class="p-top">
        <div>
          <p class="p-cat" style="--seg:${catColor[p.category]}"><i></i>${esc(p.category)}</p>
          <h3 class="p-name">${L.site ? `<a href="${esc(L.site)}" target="_blank" rel="noopener">${esc(p.name)}</a>` : esc(p.name)}</h3>
          <p class="p-maker">by ${esc(p.maker)}</p>
        </div>
        <p class="p-ep">Episode ${p.episode}${
          ep && p.timestamp != null
            ? `<br><a href="${ytLink(ep.youtubeId, p.timestamp)}" target="_blank" rel="noopener">Demo at ${timecode(p.timestamp)}</a>`
            : ""
        }</p>
      </div>
      <p class="p-tagline">${esc(p.tagline)}</p>
      <div class="tags">
        ${(p.tags || []).map((t) => `<button type="button" class="tag" data-facet="tag" data-value="${esc(t)}" title="Filter by ${esc(t)}">${esc(t)}</button>`).join("")}
      </div>
      ${
        p.builtWith?.length
          ? `<p class="built">Built with ${p.builtWith
              .map((t) => `<button type="button" class="tool" data-facet="tool" data-value="${esc(t)}" title="Show projects built with ${esc(t)}">${esc(t)}</button>`)
              .join(", ")}</p>`
          : ""
      }
      <div class="p-actions">
        <button type="button" class="more" data-toggle="${esc(p.id)}" aria-expanded="${open}" aria-controls="d-${esc(p.id)}">${open ? "Hide details" : "Show details"}</button>
        ${L.site ? `<a href="${esc(L.site)}" target="_blank" rel="noopener">Open the site</a>` : ""}
        ${L.repo ? `<a href="${esc(L.repo)}" target="_blank" rel="noopener">Source code</a>` : ""}
      </div>
      <div class="details" id="d-${esc(p.id)}" ${open ? "" : "hidden"}>
        ${sec("What it is", `<p>${esc(p.summary)}</p>`)}
        ${sec("Why it exists", p.problem && `<p>${esc(p.problem)}</p>`)}
        ${sec("What it does", p.features?.length && list(p.features), true)}
        ${sec("How it was built", p.howItWasBuilt && `<p>${esc(p.howItWasBuilt)}</p>`)}
        ${sec("Privacy and data", p.privacy && `<p>${esc(p.privacy)}</p>`)}
        ${sec("Stack", p.stack?.length && `<div class="stack">${p.stack.map((s) => `<span>${esc(s)}</span>`).join("")}</div>`, true)}
        ${sec("Lessons from building it", p.lessons?.length && list(p.lessons))}
        ${sec("What's next", p.roadmap?.length && list(p.roadmap))}
      </div>
    </li>`;
  }

  function renderList() {
    const shown = data.projects
      .filter((p) => matches(p))
      .sort((a, b) => b.episode - a.episode || (a.timestamp ?? 0) - (b.timestamp ?? 0));
    $("#list").innerHTML = shown.map(projectHTML).join("");
    $("#empty").hidden = shown.length > 0;
    const total = data.projects.length;
    $("#count").textContent =
      shown.length === total ? `${total} project${total === 1 ? "" : "s"}` : `${shown.length} of ${total} projects`;
  }

  function update() {
    renderFacets();
    renderList();
    writeURL();
  }

  function clearAll() {
    state.q = "";
    $("#q").value = "";
    FACETS.forEach((f) => state.sel[f.key].clear());
    update();
  }

  function toggleFacet(key, value, forceOn) {
    const s = state.sel[key];
    if (forceOn || !s.has(value)) s.add(value);
    else s.delete(value);
    update();
  }

  // ---------- Events ----------
  function bind() {
    $("#q").addEventListener("input", (e) => {
      state.q = e.target.value.trim();
      update();
    });
    $("#clear").addEventListener("click", clearAll);
    $("#empty-clear").addEventListener("click", clearAll);

    $("#facets").addEventListener("click", (e) => {
      const x = e.target.closest("[data-expand]");
      if (x) {
        const k = x.dataset.expand;
        state.expanded.has(k) ? state.expanded.delete(k) : state.expanded.add(k);
        renderFacets();
        $(`[data-expand="${k}"]`)?.focus();
        return;
      }
      const b = e.target.closest(".chip");
      if (b) toggleFacet(b.dataset.facet, b.dataset.value);
    });

    $("#list").addEventListener("click", (e) => {
      const tag = e.target.closest(".tag, .tool");
      if (tag) {
        toggleFacet(tag.dataset.facet, tag.dataset.value, true);
        $("#projects").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        return;
      }
      const t = e.target.closest("[data-toggle]");
      if (t) {
        const id = t.dataset.toggle;
        const open = !state.open.has(id);
        open ? state.open.add(id) : state.open.delete(id);
        t.setAttribute("aria-expanded", open);
        t.textContent = open ? "Hide details" : "Show details";
        $(`#d-${CSS.escape(id)}`).hidden = !open;
      }
    });

    $("#episode-tabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-ep]");
      if (!b) return;
      state.episode = Number(b.dataset.ep);
      renderEpisodeTabs();
      renderEpisode();
      writeURL();
    });

    const rail = $(".rail");
    $("#rail-toggle").addEventListener("click", (e) => {
      const open = rail.classList.toggle("open");
      e.currentTarget.setAttribute("aria-expanded", open);
    });

    window.addEventListener("hashchange", openFromHash);
  }

  // A link like index.html#fishymeter opens that project's details.
  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const p = data.projects.find((x) => x.id === id);
    if (!p) return;
    state.open.add(id);
    if (!matches(p)) clearAll();
    else renderList();
    document.getElementById(id)?.scrollIntoView();
  }

  // ---------- Boot ----------
  fetch("data/showcase.json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((json) => {
      data = json;
      $("#lede").textContent = data.community.description;
      [...new Set(data.projects.map((p) => p.category))].forEach((c, i) => (catColor[c] = `var(--cat-${(i % 6) + 1})`));
      readURL();
      $("#q").value = state.q;
      renderEpisodeTabs();
      renderEpisode();
      update();
      bind();
      openFromHash();
    })
    .catch((err) => {
      $("#list").innerHTML = `<li class="empty"><p>The project list didn't load (${esc(err.message)}). If you opened this file directly, serve the folder over HTTP instead, for example with <code>python3 -m http.server</code>.</p></li>`;
    });
})();
