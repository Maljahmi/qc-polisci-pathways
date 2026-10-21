(function(){
  // Programs live in data.js (window.PROGRAMS). This file draws the home page's deadline board, switches
  // between the home page, the two paths and their tabs and the All opportunities page, fills each
  // opportunities list, and makes
  // every "#id" link land in the right place, including links from the old one-tab-per-degree layout.
  var PROGRAMS = window.PROGRAMS || [], ALIASES = window.ALIASES || {};
  var BY_ID = {};
  PROGRAMS.forEach(function(p){ BY_ID[p.id] = p; });

  // deadlines on the board that are not single programs live in data.js
  var EXTRA = window.EXTRA_DEADLINES || [];
  var TYPES = [
    ["summer-research", "Summer research or institute"], ["summer-internship", "Summer internship"],
    ["fall-internship", "Fall internship"], ["spring-internship", "Spring internship"],
    ["fellowship", "Fellowship or scholarship"], ["campus", "At QC and CUNY"],
    ["visit", "PhD visit or prep program"], ["pipeline", "Pre-law program"],
    ["course", "Course or training"], ["conference", "Conference or event"], ["after", "After college"],
    ["journalism", "Journalism"], ["international", "International affairs"], ["politics", "Politics and campaigns"]
  ];
  var TYPE_LABEL = {};
  TYPES.forEach(function(t){ TYPE_LABEL[t[0]] = t[1]; });
  var YEARS = [["fr", "Freshman"], ["so", "Sophomore"], ["jr", "Junior"], ["sr", "Senior"], ["grad", "After college"]];
  var YEAR_WORD = {fr:"freshmen", so:"sophomores", jr:"juniors", sr:"seniors"};
  var GRAD_DEGREES = ["phd", "predoc", "mpp", "mpa", "ma"];
  var DEGREE_NAME = {phd:"PhD", predoc:"Predoc", mpp:"MPP", mpa:"MPA", ma:"MA", jd:"Law school"};
  var ALL_DEGREES = GRAD_DEGREES.concat(["jd"]);
  // each list's degrees; "all" is the All opportunities page
  var PATH_DEGREES = {grad: GRAD_DEGREES, law: ["jd"], all: ALL_DEGREES};
  var PAGE = 10;  // rows shown before "Show all"

  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var today = new Date(); today.setHours(0,0,0,0);
  function parse(s){ var p=s.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
  function left(s){ return Math.round((parse(s) - today) / 86400000); }
  function short(s){ var d=parse(s); return MON[d.getMonth()] + " " + d.getDate(); }
  function leftText(n){ return n===0 ? "today" : n===1 ? "tomorrow" : "in " + n + " days"; }
  function esc(t){ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function textOf(h){ var d = document.createElement("div"); d.innerHTML = h; return d.textContent; }
  function store(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
  function recall(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // "Last updated" under the home page and All opportunities headings
  if (window.UPDATED){
    var MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var u = parse(window.UPDATED);
    document.querySelectorAll("[data-updated]").forEach(function(el){
      el.textContent = "Last updated " + MONTH[u.getMonth()] + " " + u.getDate() + ", " + u.getFullYear() + ". Deadlines and new programs are checked every week.";
    });
    document.querySelectorAll("[data-checked]").forEach(function(el){ el.textContent = MONTH[u.getMonth()] + " " + u.getFullYear(); });
  }

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

  // ---------- the home page's deadline board: both paths ----------
  (function(){
    var board = document.getElementById("board");
    if (!board) return;
    var seen = {}, list = [];
    PROGRAMS.forEach(function(p){
      // event dates (a fair, a visit day) are not deadlines
      if (!p.due || p.event || (p.status !== "confirmed" && p.status !== "estimate")) return;
      list.push({d:p.due, n:p.short || textOf(p.name).replace(/\s*\([^)]*\)\s*$/, ""), u:p.url, a:p.status === "estimate"});
    });
    EXTRA.forEach(function(x){ list.push(x); });
    list = list.filter(function(x){
      var k = x.d + "|" + x.n;
      if (seen[k] || left(x.d) < 0) return false;
      return (seen[k] = true);
    }).sort(function(a, b){ return (parse(a.d) - parse(b.d)) || (a.n < b.n ? -1 : 1); }).slice(0, 7);
    if (!list.length){ board.innerHTML = '<li class="board-empty">No upcoming deadlines listed.</li>'; return; }
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
      li.querySelector(".bl span").textContent = n === 1 ? "day" : "days";
      nums.push([b, n]);
      board.appendChild(li);
    });
    // the one motion moment: on first load the rows slide in and the numbers roll up
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
  })();


  // ---------- Year by year: one degree's timeline at a time ----------
  var planButtons = [].slice.call(document.querySelectorAll(".seg [data-plan]"));
  function selectPlan(id){
    if (!planButtons.some(function(b){ return b.getAttribute("data-plan") === id; })) return;
    planButtons.forEach(function(b){
      var on = b.getAttribute("data-plan") === id;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      document.getElementById(b.getAttribute("data-plan")).hidden = !on;
    });
    store("qcpp-plan", id);
  }
  planButtons.forEach(function(b){ b.addEventListener("click", function(){ selectPlan(b.getAttribute("data-plan")); }); });
  if (recall("qcpp-plan")) selectPlan(recall("qcpp-plan"));

  // ---------- opportunities lists: one per path ----------
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
  // "of" is the list's degrees; a program that fits every graduate degree reads "Graduate school"
  function degreesLabel(ds, of){
    if (of.every(function(d){ return ds.indexOf(d) >= 0; })) return "";
    var grad = GRAD_DEGREES.filter(function(d){ return ds.indexOf(d) >= 0; });
    var names = grad.length === GRAD_DEGREES.length ? ["Graduate school"] : grad.map(function(d){ return DEGREE_NAME[d]; });
    if (of.indexOf("jd") >= 0 && ds.indexOf("jd") >= 0) names.push("Law school");
    return names.join(", ");
  }
  function rowHTML(p, db){
    var chip = "";
    if (p.due){
      var n = left(p.due);
      chip = n < 0 ? "<em>closed</em>" : "<em" + (n <= 21 ? ' class="hot"' : "") + ">" + leftText(n) + "</em>";
    }
    var cls = p.status === "last" ? " last" : (p.status === "none" ? " none" : "");
    var when = '<div class="when' + cls + '"><b>' + esc(p.whenB) + "</b>" + (p.whenS ? "<span>" + esc(p.whenS) + "</span>" : "") +
      (p.tag ? '<span class="tag">' + esc(p.tag) + "</span>" : "") + chip + "</div>";
    // in the graduate and all lists, say which degrees a program prepares you for unless it fits them all
    // (journalism programs are listed under graduate school but don't lead to one degree)
    var degs = db.path !== "law" && !val(db, "degree") && p.types.indexOf("journalism") < 0 ? degreesLabel(p.degrees, db.degs) : "";
    var meta = (p.paid === true ? "Paid · " : "") + typesLabel(p.types) + " · " + yearsLabel(p.years) + (degs ? " · " + degs : "") + (p.meta ? " · " + p.meta : "");
    var facts = (p.opens ? "<dt>Opens</dt><dd>" + esc(p.opens) + "</dd>" : "") +
      p.facts.map(function(f){ return "<dt>" + f[0] + "</dt><dd>" + f[1] + "</dd>"; }).join("");
    // the description and facts stay folded until asked for, so the list reads as dates and names
    var more = (p.body ? '<p class="body">' + p.body + "</p>" : "") + (p.warn ? '<p class="warn">' + p.warn + "</p>" : "") +
      (facts ? '<dl class="facts">' + facts + "</dl>" : "");
    return '<div class="row" id="' + db.sec.id + "--" + p.id + '" data-id="' + p.id + '">' + when +
      '<div class="what"><h3>' + p.name + '</h3><p class="meta">' + meta + "</p>" +
      (more ? '<details class="more"><summary>Details' + CHEV + "</summary>" + more + "</details>" : "") + "</div></div>";
  }
  var CHEV = '<svg class="chev" aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  var DBS = [];
  function field(db, f){ return db.app.querySelector('[data-f="' + f + '"]'); }
  function val(db, f){ var el = field(db, f); if (!el) return ""; return el.type === "checkbox" ? el.checked : el.value; }
  function setVal(db, f, v){ var el = field(db, f); if (!el) return; if (el.type === "checkbox") el.checked = !!v; else el.value = v; }
  function resetDB(db){ ["degree", "type", "year", "pay", "q"].forEach(function(f){ setVal(db, f, ""); }); setVal(db, "open", false); db.showAll = false; }
  // the words a search matches: name, summary line, description and facts
  var HAY = {};
  function hay(p){
    return HAY[p.id] || (HAY[p.id] = textOf([p.name, p.short || "", p.meta, p.body, p.warn, p.whenB, p.whenS,
      p.types.map(function(t){ return TYPE_LABEL[t]; }).join(" "), p.facts.map(function(f){ return f[0] + " " + f[1]; }).join(" ")].join(" ")).toLowerCase());
  }
  function matches(db){
    var degree = val(db, "degree"), type = val(db, "type"), year = val(db, "year"), pay = val(db, "pay"), open = val(db, "open");
    // each search word must start a word somewhere, so "cia" finds the CIA but not "social"
    var words = String(val(db, "q") || "").toLowerCase().split(/\s+/).filter(Boolean).map(function(w){
      return new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    });
    return PROGRAMS.filter(function(p){
      if (words.length && !words.every(function(w){ return w.test(hay(p)); })) return false;
      if (degree ? p.degrees.indexOf(degree) < 0 : !p.degrees.some(function(d){ return db.degs.indexOf(d) >= 0; })) return false;
      if (type && p.types.indexOf(type) < 0) return false;
      if (year && p.years.indexOf(year) < 0) return false;
      if (pay === "paid" && p.paid !== true) return false;
      if (pay === "unpaid" && p.paid !== false) return false;
      if (open && !p.allOpen) return false;
      return true;
    });
  }
  function renderDB(db){
    var sort = val(db, "sort"), degree = val(db, "degree");
    var list = matches(db);
    var byName = function(a, b){ return textOf(a.name).localeCompare(textOf(b.name)); };
    list.sort(function(a, b){
      if (sort === "name") return byName(a, b);
      var ka = sort === "opens" ? opensKey(a) : dueKey(a), kb = sort === "opens" ? opensKey(b) : dueKey(b);
      if (ka === kb) return byName(a, b);
      return ka < kb ? -1 : 1;
    });
    db.sec.querySelectorAll(".db-hint").forEach(function(h){ h.hidden = h.getAttribute("data-degree") !== degree; });
    var shown = db.showAll ? list : list.slice(0, PAGE);
    db.list.innerHTML = list.length ? shown.map(function(p){ return rowHTML(p, db); }).join("")
      : '<p class="db-empty">No programs match these filters.</p>';
    db.more.hidden = shown.length >= list.length;
    db.more.textContent = "Show all " + list.length + " programs";
    var filtered = degree || val(db, "type") || val(db, "year") || val(db, "pay") || val(db, "open") || val(db, "q");
    db.count.innerHTML = (shown.length < list.length ? "Next " + shown.length + " of " : "") + list.length +
      (list.length === 1 ? " program" : " programs") + (sort === "due" || !sort ? ", soonest deadline first" : "") +
      (filtered ? ' · <button type="button" class="db-reset">Clear filters</button>' : "");
  }
  document.querySelectorAll("section.db").forEach(function(sec){
    var path = sec.getAttribute("data-path"), degs = PATH_DEGREES[path];
    var own = PROGRAMS.filter(function(p){ return p.degrees.some(function(d){ return degs.indexOf(d) >= 0; }); });
    var types = TYPES.filter(function(t){ return own.some(function(p){ return p.types.indexOf(t[0]) >= 0; }); });
    var opt = function(pair){ return '<option value="' + pair[0] + '">' + esc(pair[1]) + "</option>"; };
    var app = sec.querySelector(".db-app");
    app.innerHTML =
      '<div class="db-controls">' +
        (path === "all" ? '<label class="db-search"><span>Search</span><input type="search" data-f="q" placeholder="A name or topic, like CIA, journalism or Brooklyn" autocomplete="off"></label>' : "") +
        (path !== "law" ? '<label><span>Degree</span><select data-f="degree"><option value="">' + (path === "all" ? "Any degree" : "All graduate degrees") + "</option>" +
          degs.map(function(d){ return opt([d, DEGREE_NAME[d]]); }).join("") + "</select></label>" : "") +
        '<label><span>Type</span><select data-f="type"><option value="">All types</option>' + types.map(opt).join("") + "</select></label>" +
        '<label><span>Year</span><select data-f="year"><option value="">Any year</option>' + YEARS.map(opt).join("") + "</select></label>" +
        '<label><span>Pay</span><select data-f="pay"><option value="">Any</option><option value="paid">Paid or funded</option><option value="unpaid">Unpaid or for credit</option></select></label>' +
        '<label><span>Sort by</span><select data-f="sort"><option value="due">Next deadline</option><option value="opens">Opening date</option><option value="name">Name</option></select></label>' +
        '<label class="check"><input type="checkbox" data-f="open"> Open to DACA, undocumented or international students</label>' +
      "</div>" +
      '<p class="db-count" aria-live="polite"></p><div class="db-list"></div>' +
      '<button type="button" class="db-more" hidden></button>' +
      '<p class="db-note">Dates are this cycle\'s where posted. Otherwise they are last cycle\'s, which are usually close. Confirm on the official page.</p>';
    var db = {sec:sec, path:path, degs:degs, app:app, showAll:false, list:app.querySelector(".db-list"),
              count:app.querySelector(".db-count"), more:app.querySelector(".db-more")};
    app.addEventListener("change", function(){ db.showAll = false; renderDB(db); });
    app.addEventListener("input", function(ev){ if (ev.target.type === "search"){ db.showAll = false; renderDB(db); } });
    app.addEventListener("click", function(ev){
      if (ev.target.closest(".db-reset")){ resetDB(db); renderDB(db); }
      if (ev.target.closest(".db-more")){ db.showAll = true; renderDB(db); }
    });
    DBS.push(db);
    renderDB(db);
  });
  function dbOf(path){ return DBS.filter(function(d){ return d.path === path; })[0]; }

  // ---------- views: the home page, the two paths and their tabs ----------
  var VIEWS = ["home", "grad", "law", "opportunities"];
  var FIRST_TAB = {grad: "g-degrees", law: "l-years"};
  // links from the old layout, which had one tab and one list per degree
  var LEGACY = {"l-jd": "l-years"};
  var LEGACY_DB = {"g-phd-db": ["grad", "phd"], "g-predoc-db": ["grad", "predoc"], "g-mpp-db": ["grad", "mpp"],
                   "g-mpa-db": ["grad", "mpa"], "g-ma-db": ["grad", "ma"], "l-jd-db": ["law", ""],
                   // the lists themselves, so a link with data-type opens them filtered
                   "g-opps-db": ["grad", ""], "l-opps-db": ["law", ""], "all-db": ["all", ""]};
  var VIEW_DB = {grad: "grad", law: "law", opportunities: "all"};
  var switchLinks = document.querySelectorAll(".switch a");
  // the top bar wraps to more lines on narrow phones; sticky tabs and scroll offsets follow its height
  var bar = document.querySelector(".bar");
  function barHeight(){ if (bar) document.documentElement.style.setProperty("--bar", bar.offsetHeight + "px"); }
  barHeight();
  window.addEventListener("resize", barHeight);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(barHeight);
  var themeColor = document.querySelector('meta[name="theme-color"]');

  function panelsOf(path){ return [].slice.call(document.querySelectorAll("#" + path + " .panel")); }
  function setTab(path, id){
    var ps = panelsOf(path), p = document.getElementById(id);
    if (!p || ps.indexOf(p) < 0) p = document.getElementById(recall("qcpp-tab-" + path)) || document.getElementById(FIRST_TAB[path]);
    if (ps.indexOf(p) < 0) p = ps[0];
    ps.forEach(function(x){ x.hidden = x !== p; });
    document.querySelectorAll("#" + path + " .ptabs a").forEach(function(a){
      if (a.getAttribute("href") === "#" + p.id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    store("qcpp-tab-" + path, p.id);
    return p;
  }
  function setView(view, tabId){
    VIEWS.forEach(function(v){ document.getElementById(v).hidden = v !== view; });
    document.body.setAttribute("data-track", view);
    // browser chrome on phones matches the path color: QC red for graduate school, black for law
    if (themeColor) themeColor.content = getComputedStyle(document.body).getPropertyValue("--flat").trim() || themeColor.content;
    switchLinks.forEach(function(a){
      if (a.getAttribute("data-t") === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (FIRST_TAB[view]) setTab(view, tabId);
  }
  function viewOf(el){ var m = el.closest("main"); return m ? m.id : null; }
  // show an element: switch to its view and tab, open the folds around it, pick its timeline
  function reveal(el){
    var view = viewOf(el);
    if (!view) return;
    var panel = el.classList.contains("panel") ? el : el.closest(".panel");
    setView(view, panel && panel.id);
    for (var n = el; n && n !== document.body; n = n.parentElement){
      if (n.tagName === "DETAILS") n.open = true;
      if (n.tagName === "SECTION" && planButtons.some(function(b){ return b.getAttribute("data-plan") === n.id; })) selectPlan(n.id);
    }
  }
  function scrollTo(el){
    if (el.classList.contains("panel") || el.tagName === "MAIN"){ window.scrollTo(0, 0); return; }
    el.scrollIntoView();
  }
  // open a path's list with filters set; showAll so a linked program is never cut off
  function openDB(path, degree, type, showAll){
    var db = dbOf(path);
    resetDB(db);
    setVal(db, "degree", degree || "");
    setVal(db, "type", type || "");
    db.showAll = !!showAll;
    renderDB(db);
    reveal(db.sec);
    return db;
  }
  // a program id: open it in the current page's list if it fits there, otherwise the path it belongs to
  function goProgram(p, push){
    var cur = VIEW_DB[document.body.getAttribute("data-track")];
    var fits = function(path){ return p.degrees.some(function(d){ return PATH_DEGREES[path].indexOf(d) >= 0; }); };
    var path = cur && fits(cur) ? cur : (fits("grad") ? "grad" : "law");
    var db = openDB(path, "", "", true);
    var row = document.getElementById(db.sec.id + "--" + p.id);
    document.querySelectorAll(".row.target").forEach(function(r){ r.classList.remove("target"); });
    if (row){
      row.classList.add("target");
      var more = row.querySelector("details.more");
      if (more) more.open = true;
      row.scrollIntoView();
    }
    if (push) try { history.pushState(null, "", "#" + p.id); } catch(e){}
    return true;
  }
  function go(id, push, link){
    if (VIEWS.indexOf(id) >= 0){ setView(id); window.scrollTo(0, 0); }
    else if (LEGACY_DB[id]){
      var d = LEGACY_DB[id];
      var db = openDB(d[0], d[1], link && link.getAttribute("data-type"));
      scrollTo(db.sec);
    } else {
      var el = document.getElementById(LEGACY[id] || id);
      if (!el){
        var p = BY_ID[ALIASES[id] || id];
        return p ? goProgram(p, push) : false;
      }
      reveal(el);
      scrollTo(el);
    }
    if (push) try { history.pushState(null, "", "#" + id); } catch(e){}
    return true;
  }
  function known(id){
    return !!(id && (VIEWS.indexOf(id) >= 0 || LEGACY[id] || LEGACY_DB[id] || document.getElementById(id) || BY_ID[ALIASES[id] || id]));
  }

  document.addEventListener("click", function(ev){
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    var id = a.getAttribute("href").slice(1);
    if (!known(id)) return;
    ev.preventDefault();
    go(id, true, a);
  });
  window.addEventListener("popstate", function(){
    var h = (location.hash || "").slice(1);
    if (known(h)) go(h); else setView("home");
  });
  document.querySelectorAll(".tabs button").forEach(function(b){
    b.addEventListener("click", function(){
      var doc = b.getAttribute("data-doc");
      b.parentNode.querySelectorAll("button").forEach(function(x){ x.setAttribute("aria-selected", x===b ? "true" : "false"); });
      document.querySelectorAll("[data-paper]").forEach(function(p){ p.hidden = p.getAttribute("data-paper") !== doc; });
    });
  });

  // first load: the address decides; a bare address opens the home page
  var hash = (location.hash || "").replace("#", "");
  if (known(hash)) go(hash); else setView("home");
})();
