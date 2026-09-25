(function(){
  // Programs live in data.js (window.PROGRAMS). This file draws the deadline board, the degree
  // tabs and each tab's opportunities list, and makes every "#id" link land in the right place.
  var PROGRAMS = window.PROGRAMS || [], ALIASES = window.ALIASES || {};
  var BY_ID = {};
  PROGRAMS.forEach(function(p){ BY_ID[p.id] = p; });

  // deadlines on the board that are not single programs
  var LSAT = "https://www.lsac.org/lsat/lsat-dates-deadlines-score-release-dates";
  var EXTRA = [
    {d:"2026-10-01", n:"Register for the November LSAT", t:"law", u:LSAT},
    {d:"2026-11-25", n:"Columbia political science PhD", t:"grad", g:"phd", u:"https://www.gsas.columbia.edu/content/political-science-phd"},
    {d:"2026-12-01", n:"Most PhD deadlines (Dec 1–17)", t:"grad", g:"phd", u:"https://gsas.harvard.edu/program/government"},
    {d:"2026-12-01", n:"Register for the January LSAT", t:"law", u:LSAT},
    {d:"2026-12-29", n:"Register for the February LSAT", t:"law", u:LSAT},
    {d:"2027-02-01", n:"Manhattan DA summer internship", t:"law", u:"https://manhattanda.org/careers/internship-opportunities/college-internship/"},
    {d:"2027-02-15", n:"SDNY U.S. Attorney summer internship", t:"law", u:"https://www.justice.gov/usao-sdny/undergraduate-internships"},
    {d:"2027-02-25", n:"Register for the April LSAT", t:"law", u:LSAT},
    {d:"2027-04-29", n:"Register for the June LSAT", t:"law", u:LSAT}
  ];
  var TYPES = [
    ["summer-research", "Summer research or institute"], ["summer-internship", "Summer internship"],
    ["fall-internship", "Fall internship"], ["spring-internship", "Spring internship"],
    ["fellowship", "Fellowship or scholarship"], ["campus", "At QC and CUNY"],
    ["visit", "PhD visit or prep program"], ["pipeline", "Pre-law program"],
    ["course", "Course or training"], ["after", "After college"]
  ];
  var TYPE_LABEL = {};
  TYPES.forEach(function(t){ TYPE_LABEL[t[0]] = t[1]; });
  var YEARS = [["fr", "Freshman"], ["so", "Sophomore"], ["jr", "Junior"], ["sr", "Senior"], ["grad", "After college"]];
  var YEAR_WORD = {fr:"freshmen", so:"sophomores", jr:"juniors", sr:"seniors"};

  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var today = new Date(); today.setHours(0,0,0,0);
  function parse(s){ var p=s.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
  function left(s){ return Math.round((parse(s) - today) / 86400000); }
  function short(s){ var d=parse(s); return MON[d.getMonth()] + " " + d.getDate(); }
  function leftText(n){ return n===0 ? "today" : n===1 ? "tomorrow" : "in " + n + " days"; }
  function esc(t){ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function textOf(h){ var d = document.createElement("div"); d.innerHTML = h; return d.textContent; }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // countdown chips on the few rows still written in the page, and on the LSAT table
  document.querySelectorAll(".when[data-due]").forEach(function(el){
    var n = left(el.getAttribute("data-due"));
    var em = document.createElement("em");
    if (n < 0){ em.textContent = "closed"; }
    else { em.textContent = leftText(n); if (n <= 21) em.className = "hot"; }
    el.appendChild(em);
  });
  document.querySelectorAll("[data-left]").forEach(function(el){
    var n = left(el.getAttribute("data-left"));
    el.textContent = n < 0 ? "closed" : n + " days";
  });

  // ---------- departures board ----------
  var board = document.getElementById("board");
  var GRAD_DEGREES = ["phd", "mpp", "mpa", "ma"];
  function boardList(track, degree){
    var degs = degree ? [degree] : (track === "law" ? ["jd"] : GRAD_DEGREES);
    var list = [];
    PROGRAMS.forEach(function(p){
      // event dates (a fair, a visit day) are not deadlines
      if (!p.due || p.event || (p.status !== "confirmed" && p.status !== "estimate")) return;
      if (!p.degrees.some(function(d){ return degs.indexOf(d) >= 0; })) return;
      list.push({d:p.due, n:p.short || textOf(p.name).replace(/\s*\([^)]*\)\s*$/, ""), u:p.url, a:p.status === "estimate"});
    });
    EXTRA.forEach(function(x){ if (x.t === track && (!degree || !x.g || x.g === degree)) list.push(x); });
    return list.filter(function(x){ return left(x.d) >= 0; })
      .sort(function(a, b){ return (parse(a.d) - parse(b.d)) || (a.n < b.n ? -1 : 1); }).slice(0, 7);
  }
  var boardKey = "", boardDrawn = false;
  function renderBoard(track, degree){
    var key = track + "|" + (degree || "");
    if (key === boardKey) return;
    boardKey = key;
    board.innerHTML = "";
    var list = boardList(track, degree);
    if (!list.length){ board.innerHTML = '<li style="padding:12px 0;color:var(--on-deep-2)">No upcoming deadlines listed. See the opportunities below.</li>'; return; }
    var nums = [];
    list.forEach(function(x, i){
      var n = left(x.d);
      var li = document.createElement("li");
      li.style.setProperty("--i", i);
      if (n <= 21) li.className = "hot";
      li.innerHTML = '<a target="_blank" rel="noopener"><span class="bd"></span><span class="bn"></span><span class="bl"><b></b><span>days</span></span></a>';
      li.querySelector("a").href = x.u;
      li.querySelector(".bd").textContent = (x.a ? "~" : "") + short(x.d);
      li.querySelector(".bn").textContent = x.n;
      var b = li.querySelector(".bl b"); b.textContent = n;
      nums.push([b, n]);
      board.appendChild(li);
    });
    // the one motion moment: on first load the rows slide in and the numbers roll up
    if (boardDrawn) return;
    boardDrawn = true;
    setTimeout(function(){ board.classList.add("settled"); }, 1400);
    if (reduce) return;
    var t0 = null, dur = 900;
    function tick(t){
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      nums.forEach(function(x){ x[0].textContent = Math.round(x[1] * e); });
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var HEAD = {
    grad: {e:"PhD · MPA · MPP · MA", h:"Your route from Queens College Political Science to a funded PhD or policy master's."},
    law:  {e:"JD · Pre-law", h:"Your route from Queens College Political Science to law school, mostly for free."}
  };

  // schedule: label cells with their year so the phone layout reads year by year
  document.querySelectorAll(".sched").forEach(function(s){
    var ys = [].slice.call(s.querySelectorAll(".yh")).map(function(h){
      var sm = h.querySelector("small");
      return h.childNodes[0].textContent.trim() + (sm ? " (" + sm.textContent.toLowerCase() + ")" : "");
    });
    var seasons = ["Fall","Spring","Summer"];
    [].slice.call(s.querySelectorAll("[data-s]")).forEach(function(c, i){
      var y = i % ys.length;
      c.setAttribute("data-y", ys[y]);
      c.style.setProperty("--o", y * 3 + seasons.indexOf(c.getAttribute("data-s")));
    });
  });

  // ---------- opportunities lists ----------
  function nextOf(md){
    if (!md) return Infinity;
    var y = today.getFullYear(), d = new Date(y, +md.slice(0, 2) - 1, +md.slice(3));
    if (d < today) d = new Date(y + 1, +md.slice(0, 2) - 1, +md.slice(3));
    return d.getTime();
  }
  function dueKey(p){
    if (p.due && left(p.due) >= 0) return parse(p.due).getTime();
    return nextOf(p.dueMD);
  }
  function opensKey(p){
    if (/^(Open now|Anytime|Rolling|Year-round)/.test(p.opens)) return today.getTime();
    return nextOf(p.opensMD);
  }
  function yearsLabel(ys){
    var ug = ["fr", "so", "jr", "sr"].filter(function(y){ return ys.indexOf(y) >= 0; });
    var words = ug.length === 4 ? ["all years"] : ug.map(function(y){ return YEAR_WORD[y]; });
    if (ys.indexOf("grad") >= 0) words.push(ug.length ? "recent grads" : "after college");
    var s = words.length > 1 ? words.slice(0, -1).join(", ") + " and " + words[words.length - 1] : (words[0] || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  // "fall-internship", "spring-internship" -> "Fall and spring internships"
  function typesLabel(ts){
    var seasons = ["fall", "spring", "summer"].filter(function(x){ return ts.indexOf(x + "-internship") >= 0; });
    var parts = [];
    if (seasons.length) parts.push((seasons.length > 1 ? seasons.slice(0, -1).join(", ") + " and " + seasons[seasons.length - 1] : seasons[0]) + (seasons.length > 1 ? " internships" : " internship"));
    ts.forEach(function(t){
      if (/-internship$/.test(t)) return;
      var l = TYPE_LABEL[t];
      parts.push(/^PhD/.test(l) ? l : l.charAt(0).toLowerCase() + l.slice(1));
    });
    var s = parts.join(", ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function rowHTML(p, sid){
    var chip = "";
    if (p.due){
      var n = left(p.due);
      chip = n < 0 ? "<em>closed</em>" : "<em" + (n <= 21 ? ' class="hot"' : "") + ">" + leftText(n) + "</em>";
    }
    var cls = p.status === "last" ? " last" : (p.status === "none" ? " none" : "");
    var when = '<div class="when' + cls + '"><b>' + esc(p.whenB) + "</b>" + (p.whenS ? "<span>" + esc(p.whenS) + "</span>" : "") +
      (p.tag ? '<span class="tag">' + esc(p.tag) + "</span>" : "") + chip + "</div>";
    var meta = typesLabel(p.types) + " · " + yearsLabel(p.years) + (p.meta ? " · " + p.meta : "");
    var facts = (p.opens ? "<dt>Opens</dt><dd>" + esc(p.opens) + "</dd>" : "") +
      p.facts.map(function(f){ return "<dt>" + f[0] + "</dt><dd>" + f[1] + "</dd>"; }).join("");
    return '<div class="row" id="' + sid + "--" + p.id + '" data-id="' + p.id + '">' + when +
      '<div class="what"><h3>' + p.name + '</h3><p class="meta">' + meta + "</p>" +
      (p.body ? '<p class="body">' + p.body + "</p>" : "") + (p.warn ? '<p class="warn">' + p.warn + "</p>" : "") + "</div>" +
      (facts ? '<dl class="facts">' + facts + "</dl>" : "") + "</div>";
  }

  var DBS = [];
  function field(db, f){ return db.app.querySelector('[data-f="' + f + '"]'); }
  function val(db, f){ var el = field(db, f); return el.type === "checkbox" ? el.checked : el.value; }
  function setVal(db, f, v){ var el = field(db, f); if (el.type === "checkbox") el.checked = !!v; else el.value = v; }
  function resetDB(db){ ["type", "year", "pay"].forEach(function(f){ setVal(db, f, ""); }); setVal(db, "open", false); setVal(db, "all", false); }
  function renderDB(db){
    var type = val(db, "type"), year = val(db, "year"), pay = val(db, "pay"), open = val(db, "open"), all = val(db, "all"), sort = val(db, "sort");
    var list = PROGRAMS.filter(function(p){
      if (!all && p.degrees.indexOf(db.deg) < 0) return false;
      if (type && p.types.indexOf(type) < 0) return false;
      if (year && p.years.indexOf(year) < 0) return false;
      if (pay === "paid" && p.paid !== true) return false;
      if (pay === "unpaid" && p.paid !== false) return false;
      if (open && !p.allOpen) return false;
      return true;
    });
    var byName = function(a, b){ return textOf(a.name).localeCompare(textOf(b.name)); };
    list.sort(function(a, b){
      if (sort === "name") return byName(a, b);
      var ka = sort === "opens" ? opensKey(a) : dueKey(a), kb = sort === "opens" ? opensKey(b) : dueKey(b);
      if (ka === kb) return byName(a, b);
      return ka < kb ? -1 : 1;
    });
    db.list.innerHTML = list.length ? list.map(function(p){ return rowHTML(p, db.sec.id); }).join("")
      : '<p class="db-empty">No programs match these filters.</p>';
    var filtered = type || year || pay || open || all;
    db.count.innerHTML = list.length + (list.length === 1 ? " program" : " programs") +
      (filtered ? ' · <button type="button" class="db-reset">Clear filters</button>' : "");
  }
  document.querySelectorAll("section.db").forEach(function(sec){
    var deg = sec.getAttribute("data-degree");
    var own = PROGRAMS.filter(function(p){ return p.degrees.indexOf(deg) >= 0; });
    var types = TYPES.filter(function(t){ return own.some(function(p){ return p.types.indexOf(t[0]) >= 0; }); });
    var opt = function(pair){ return '<option value="' + pair[0] + '">' + esc(pair[1]) + "</option>"; };
    var app = sec.querySelector(".db-app");
    app.innerHTML =
      '<div class="db-controls">' +
        '<label><span>Type</span><select data-f="type"><option value="">All types</option>' + types.map(opt).join("") + "</select></label>" +
        '<label><span>Year</span><select data-f="year"><option value="">Any year</option>' + YEARS.map(opt).join("") + "</select></label>" +
        '<label><span>Pay</span><select data-f="pay"><option value="">Any</option><option value="paid">Paid or funded</option><option value="unpaid">Unpaid or for credit</option></select></label>' +
        '<label><span>Sort by</span><select data-f="sort"><option value="due">Next deadline</option><option value="opens">Opening date</option><option value="name">Name</option></select></label>' +
        '<label class="check"><input type="checkbox" data-f="open"> Open to DACA, undocumented or international students</label>' +
        '<label class="check"><input type="checkbox" data-f="all"> Include programs for other degrees</label>' +
      "</div>" +
      '<p class="db-note">Dates are this cycle\'s where posted. Otherwise they are last cycle\'s, which are usually close. Confirm on the official page.</p>' +
      '<p class="db-count" aria-live="polite"></p><div class="db-list"></div>';
    var db = {sec:sec, deg:deg, app:app, list:app.querySelector(".db-list"), count:app.querySelector(".db-count")};
    app.addEventListener("change", function(){ renderDB(db); });
    app.addEventListener("click", function(ev){
      if (ev.target.closest(".db-reset")){ resetDB(db); renderDB(db); }
    });
    DBS.push(db);
    renderDB(db);
  });

  // ---------- tabs ----------
  function panelsOf(track){ return [].slice.call(document.querySelectorAll("#" + track + " > .panel")); }
  var toc = document.getElementById("toc");
  var observer = null;
  function buildToc(track, panel){
    toc.innerHTML = "";
    var links = {};
    panelsOf(track).forEach(function(p){
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + p.id; a.className = "yr";
      a.textContent = p.getAttribute("data-label");
      li.appendChild(a);
      if (p === panel){
        a.classList.add("on"); a.setAttribute("aria-current", "true");
        var ol = document.createElement("ol");
        p.querySelectorAll("section[id]").forEach(function(s){
          var li2 = document.createElement("li"), a2 = document.createElement("a");
          a2.href = "#" + s.id;
          var i = document.createElement("i"); i.textContent = s.querySelector(".no").textContent;
          a2.appendChild(i); a2.appendChild(document.createTextNode(s.querySelector("h2").textContent));
          li2.appendChild(a2); ol.appendChild(li2); links[s.id] = a2;
        });
        li.appendChild(ol);
      }
      toc.appendChild(li);
    });
    if (window.innerWidth <= 1000){
      var on = toc.querySelector("a.yr.on");
      if (on) try { toc.scrollLeft = on.parentNode.offsetLeft - 16; } catch(_){}
    }
    if (observer) observer.disconnect();
    if ("IntersectionObserver" in window){
      observer = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (!e.isIntersecting) return;
          Object.keys(links).forEach(function(k){ links[k].classList.remove("on"); });
          if (links[e.target.id]) links[e.target.id].classList.add("on");
        });
      }, {rootMargin:"-30% 0px -60% 0px"});
      panel.querySelectorAll("section[id]").forEach(function(s){ observer.observe(s); });
    }
  }

  function setPanel(track, id){
    var ps = panelsOf(track);
    var p = document.getElementById(id);
    if (!p || ps.indexOf(p) < 0) p = ps[0];
    ps.forEach(function(x){ x.hidden = x !== p; });
    document.querySelectorAll("#" + track + " .degrees a").forEach(function(a){
      var on = a.getAttribute("href") === "#" + p.id;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    buildToc(track, p);
    renderBoard(track, p.getAttribute("data-degree"));
    try { localStorage.setItem("qcpp-tab-" + track, p.id); } catch(e){}
    return p;
  }

  var buttons = document.querySelectorAll(".switch button");
  var themeColor = document.querySelector('meta[name="theme-color"]');
  function setTrack(track, keep, panelId){
    document.body.setAttribute("data-track", track);
    // browser chrome on phones matches the path color: QC red for grad, black for law
    if (themeColor) themeColor.content = getComputedStyle(document.body).getPropertyValue("--flat").trim() || themeColor.content;
    document.getElementById("grad").hidden = track !== "grad";
    document.getElementById("law").hidden = track !== "law";
    buttons.forEach(function(b){ b.setAttribute("aria-pressed", b.getAttribute("data-t")===track ? "true" : "false"); });
    document.getElementById("eyebrow").textContent = HEAD[track].e;
    document.getElementById("headline").textContent = HEAD[track].h;
    var stored = null;
    try { stored = localStorage.getItem("qcpp-tab-" + track); } catch(e){}
    setPanel(track, panelId || stored);
    try { localStorage.setItem("qcpp-track", track); } catch(e){}
    try { if (!keep) history.replaceState(null, "", "#" + track); } catch(e){}
  }
  function showPanelOf(el){
    var main = el.closest("main");
    if (!main) return;
    var panel = el.classList.contains("panel") ? el : el.closest(".panel");
    if (document.body.getAttribute("data-track") !== main.id) setTrack(main.id, true, panel && panel.id);
    else if (panel) setPanel(main.id, panel.id);
  }

  // a program id: open it in the list for the degree you're on if it fits, otherwise the first degree it fits
  function goProgram(p, push){
    var visible = function(db){ return !db.sec.closest(".panel").hidden && !db.sec.closest("main").hidden; };
    var fits = function(db){ return p.degrees.indexOf(db.deg) >= 0; };
    var target = DBS.filter(function(db){ return visible(db) && fits(db); })[0];
    if (!target){
      var track = document.body.getAttribute("data-track");
      target = DBS.filter(function(db){ return fits(db) && db.sec.closest("main").id === track; })[0] || DBS.filter(fits)[0];
    }
    if (!target) return false;
    showPanelOf(target.sec);
    resetDB(target); renderDB(target);
    var row = document.getElementById(target.sec.id + "--" + p.id);
    document.querySelectorAll(".row.target").forEach(function(r){ r.classList.remove("target"); });
    if (row){ row.classList.add("target"); row.scrollIntoView(); }
    if (push) try { history.pushState(null, "", "#" + p.id); } catch(e){}
    return true;
  }
  function go(id, push){
    var el = document.getElementById(id);
    if (!el){
      var p = BY_ID[ALIASES[id] || id];
      return p ? goProgram(p, push) : false;
    }
    showPanelOf(el);
    if (el.classList.contains("panel")){
      var top = el.closest("main").getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo(0, Math.max(0, top));
    } else {
      el.scrollIntoView();
    }
    if (push) try { history.pushState(null, "", "#" + id); } catch(e){}
    return true;
  }
  function known(id){ return !!(id && (document.getElementById(id) || BY_ID[ALIASES[id] || id])); }

  buttons.forEach(function(b){
    b.addEventListener("click", function(){ setTrack(b.getAttribute("data-t")); window.scrollTo(0,0); });
  });
  document.addEventListener("click", function(ev){
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    var id = a.getAttribute("href").slice(1);
    if (!known(id)) return;
    ev.preventDefault();
    go(id, true);
    // links like "see summer internships" open a list with its type filter set
    var type = a.getAttribute("data-type");
    var db = type && DBS.filter(function(d){ return d.sec.id === id; })[0];
    if (db){ resetDB(db); setVal(db, "type", type); renderDB(db); }
  });
  window.addEventListener("popstate", function(){
    var h = (location.hash || "").slice(1);
    if (h === "grad" || h === "law") setTrack(h, true);
    else if (known(h)) go(h);
  });
  document.querySelectorAll(".tabs button").forEach(function(b){
    b.addEventListener("click", function(){
      var doc = b.getAttribute("data-doc");
      b.parentNode.querySelectorAll("button").forEach(function(x){ x.setAttribute("aria-selected", x===b ? "true" : "false"); });
      document.querySelectorAll("[data-paper]").forEach(function(p){ p.hidden = p.getAttribute("data-paper") !== doc; });
    });
  });

  var hash = (location.hash || "").replace("#","");
  var start = "grad";
  if (hash === "law" || hash === "grad") start = hash;
  else if (known(hash)){
    var el = document.getElementById(hash), prog = BY_ID[ALIASES[hash] || hash];
    if (el && el.closest("main")) start = el.closest("main").id;
    else if (prog) start = prog.degrees.some(function(d){ return GRAD_DEGREES.indexOf(d) >= 0; }) ? "grad" : "law";
  } else { try { var st = localStorage.getItem("qcpp-track"); if (st === "law" || st === "grad") start = st; } catch(e){} }
  setTrack(start, true);
  if (hash !== "grad" && hash !== "law" && known(hash)) go(hash);
})();
