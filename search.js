(function(){
  // Search everything: a Search button next to "Find your year" opens a box that finds guides, pages and
  // opportunities as you type. The guide index (search-index.js, written by tools/build_site.py) and data.js load
  // the first time it opens, so pages stay light.
  var btnFind = document.querySelector(".topbar > a.btn, .nav > a.btn");
  if (!btnFind || !window.HTMLDialogElement) return;

  var wrap = document.createElement("div");
  wrap.className = "top-acts";
  btnFind.parentNode.insertBefore(wrap, btnFind);
  var open = document.createElement("button");
  open.type = "button";
  open.className = "btn btn-small s-open";
  open.setAttribute("aria-haspopup", "dialog");
  open.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg><span>Search</span>';
  wrap.appendChild(open);
  wrap.appendChild(btnFind);

  var dlg = document.createElement("dialog");
  dlg.className = "s-dlg";
  dlg.setAttribute("aria-label", "Search the site");
  dlg.innerHTML = '<div class="s-head"><label class="s-label" for="s-q">Search guides and opportunities</label>' +
    '<input id="s-q" type="search" autocomplete="off" placeholder="Try: paid summer internship, LSAT, DACA">' +
    '<button type="button" class="s-close">Close</button></div><div class="s-res" aria-live="polite"></div>';
  document.body.appendChild(dlg);
  var input = dlg.querySelector("input"), res = dlg.querySelector(".s-res");
  var EXAMPLES = ["paid summer internship", "LSAT", "DACA", "housing", "Model UN", "PhD visit", "scholarship", "policy master's", "career fair", "Foreign Service"];

  var loading = null;
  function load(src){ return new Promise(function(ok, no){ var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function ready(){
    if (!loading) loading = Promise.all([window.SEARCH ? 0 : load("search-index.js"), window.PROGRAMS ? 0 : load("data.js")]);
    return loading;
  }

  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function strip(t){ return String(t || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&"); }
  // a few words students use that the site spells out
  var SAME = {ir: "international", grad: "graduate", poli: "political", sci: "science", money: "pay", gov: "government", polisci: "political"};
  var GOAL = {phd: "phd", predoc: "predoc", mpp: "public policy master's mpp", mpa: "public administration master's mpa", ma: "master's ma", jd: "law school jd"};
  function terms(q){
    return q.toLowerCase().replace(/[^a-z0-9$'’ -]/g, " ").split(/\s+/).filter(function(w){ return w.length > 1 || /\d/.test(w); })
      .map(function(w){ w = SAME[w] || w; w = w.replace(/-/g, "") || w; if (w.length > 4 && /[^s]s$/.test(w)) w = w.slice(0, -1);
        return new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); });
  }
  // every word must appear somewhere; words in the title count most
  function score(ts, title, line, text){
    var s = 0;
    for (var i = 0; i < ts.length; i++){
      var t = ts[i];
      if (t.test(title)) s += 5; else if (t.test(line)) s += 2; else if (t.test(text)) s += 1; else return 0;
    }
    return s;
  }
  // text is searched with and without hyphens, so "prelaw" finds "pre-law"
  function dh(x){ x = String(x).toLowerCase(); return x + " " + x.replace(/-/g, ""); }
  var HAY = {};
  function progHay(p){
    return HAY[p.id] || (HAY[p.id] = [strip(p.short) + " " + strip(p.name), (p.meta || ""),
      strip(p.body) + " " + p.types.join(" ").replace(/-/g, " ") + " " + p.degrees.map(function(d){ return GOAL[d] || d; }).join(" ") + " " +
      (p.paid === true ? "paid " : "") + (p.cost === "funded" ? "fully funded " : p.cost === "free" ? "free " : "") +
      p.facts.map(function(x){ return x[0] + " " + strip(x[1]); }).join(" ")].map(dh));
  }
  function when(p){ return [p.whenB, p.whenS].filter(Boolean).join(", "); }
  function due(p){ return p.due && p.status !== "last" && p.status !== "none" ? Date.parse(p.due) : Infinity; }
  var onPrograms = /programs\.html$/.test(location.pathname);

  function render(){
    var q = input.value.trim();
    if (!q){
      res.innerHTML = '<p class="s-tip">Search every guide and opportunity on the site. Try one of these:</p><p class="s-ex">' +
        EXAMPLES.map(function(x){ return '<button type="button" data-ex="' + esc(x) + '">' + esc(x) + "</button>"; }).join("") + "</p>";
      return;
    }
    var ts = terms(q);
    if (!ts.length){ res.innerHTML = ""; return; }
    var pages = (window.SEARCH || []).map(function(g){ return {g: g, s: score(ts, dh(g.t), dh(g.d), dh(g.x))}; })
      .filter(function(x){ return x.s; }).sort(function(a, b){ return b.s - a.s; });
    var opps = (window.PROGRAMS || []).map(function(p){ var h = progHay(p); return {p: p, s: score(ts, h[0], h[1], h[2])}; })
      .filter(function(x){ return x.s; }).sort(function(a, b){ return b.s - a.s || due(a.p) - due(b.p); });
    var html = "";
    if (pages.length) html += '<h2 class="s-h">Guides and pages</h2><ul>' + pages.slice(0, 6).map(function(x){
      return '<li><a href="' + esc(x.g.u) + '"><b>' + esc(x.g.t) + "</b><span>" + esc(x.g.d) + "</span></a></li>"; }).join("") + "</ul>";
    if (opps.length) html += '<h2 class="s-h">Opportunities</h2><ul>' + opps.slice(0, 6).map(function(x){
      return '<li><a href="programs.html' + (onPrograms ? "?s=1" : "") + "#" + esc(x.p.id) + '"><b>' + esc(String(x.p.short || x.p.name).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim()) + "</b><span>" + esc(when(x.p)) + "</span></a></li>"; }).join("") + "</ul>" +
      (opps.length > 6 ? '<p class="s-all"><a href="programs.html?q=' + encodeURIComponent(q) + '">See all ' + opps.length + " opportunities for “" + esc(q) + "”</a></p>" : "");
    res.innerHTML = html || '<p class="s-tip">Nothing found for “' + esc(q) + '”. Try fewer words, or browse <a href="guides.html">Guides</a> and <a href="programs.html">Opportunities</a>.</p>';
  }

  function show(){
    if (!dlg.open) dlg.showModal();
    input.focus();
    if (!window.SEARCH || !window.PROGRAMS){ res.innerHTML = '<p class="s-tip">Loading…</p>'; }
    ready().then(render, function(){ res.innerHTML = '<p class="s-tip">Search couldn\'t load. Check your connection and try again.</p>'; loading = null; });
  }
  open.addEventListener("click", show);
  dlg.querySelector(".s-close").addEventListener("click", function(){ dlg.close(); });
  dlg.addEventListener("click", function(e){
    if (e.target === dlg) dlg.close();  // a click on the backdrop
    var ex = e.target.closest("[data-ex]");
    if (ex){ input.value = ex.getAttribute("data-ex"); render(); input.focus(); }
  });
  input.addEventListener("input", function(){ if (window.SEARCH && window.PROGRAMS) render(); });
  // "/" opens search from anywhere on the page
  document.addEventListener("keydown", function(e){
    var t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey){ e.preventDefault(); show(); }
  });
})();
