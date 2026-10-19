(function(){
  // Every program in one list: search and filters, grouped by the month of each program's next deadline.
  // The address can set filters (?degree=phd&year=jr&type=visit&q=housing) and open one program (#gp-...).
  var Q = window.QCPath, PROGRAMS = window.PROGRAMS || [];
  var MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var TYPES = [["summer-research","Summer research or institute"],["summer-internship","Summer internship"],["fall-internship","Fall internship"],
               ["spring-internship","Spring internship"],["fellowship","Fellowship or scholarship"],["campus","At QC and CUNY"],
               ["visit","PhD visit or prep program"],["pipeline","Pre-law pipeline program"],["course","Course or training"],["after","After college"],["journalism","Journalism"]];
  var TYPE = {}; TYPES.forEach(function(t){ TYPE[t[0]] = t[1]; });
  var YEARS = ["fr","so","jr","sr","grad"];
  var YEAR_NAME = {fr:"freshmen", so:"sophomores", jr:"juniors", sr:"seniors", grad:"recent graduates"};
  var GOAL = {"": "", grad: "Any graduate degree", phd: "PhD", predoc: "Predoc", mpp: "MPP", mpa: "MPA", ma: "MA", jd: "Law school"};
  var esc = Q.esc;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function nextOf(md){ if (!md) return Infinity; var d = new Date(today.getFullYear(), +md.slice(0, 2) - 1, +md.slice(3)); if (d < today) d.setFullYear(d.getFullYear() + 1); return d.getTime(); }
  function key(p){ return Q.dated(p) ? Q.parse(p.due).getTime() : nextOf(p.dueMD); }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  var root = document.querySelector(".programs"), listEl = root.querySelector(".p-list"), countEl = root.querySelector(".p-count"), activeEl = root.querySelector(".p-active");
  var typeSel = root.querySelector('[data-f="type"]');
  typeSel.innerHTML += TYPES.map(function(t){ return '<option value="' + t[0] + '">' + esc(t[1]) + "</option>"; }).join("");
  function f(n){ return root.querySelector('[data-f="' + n + '"]'); }
  function val(n){ var el = f(n); return el.type === "checkbox" ? el.checked : el.value; }
  // on a phone the menus fold away under "More filters" so the list starts sooner
  var more = root.querySelector(".more-f");
  if (more && window.matchMedia("(max-width: 760px)").matches) more.open = false;

  // search words must start a word, so "cia" finds the CIA and not "social"
  var HAY = {};
  function hay(p){ return HAY[p.id] || (HAY[p.id] = (Q.name(p) + " " + p.name.replace(/<[^>]+>/g, " ") + " " + p.meta + " " + p.body.replace(/<[^>]+>/g, " ") + " " +
    p.types.map(function(t){ return TYPE[t]; }).join(" ") + " " + p.facts.map(function(x){ return x[0] + " " + x[1].replace(/<[^>]+>/g, " "); }).join(" ")).toLowerCase()); }

  // "Sophomores to seniors", "All years and recent graduates": a run of years reads as a range
  function yearsLabel(ys){
    var idx = YEARS.map(function(y, i){ return ys.indexOf(y) >= 0 ? i : -1; }).filter(function(i){ return i >= 0; });
    if (!idx.length) return "";
    if (idx.length === 5) return "All years and recent graduates";
    if (idx.length === 4 && idx[3] === 3) return "All years";
    var run = idx[idx.length - 1] - idx[0] === idx.length - 1;
    if (idx.length === 1) return cap(YEAR_NAME[YEARS[idx[0]]]);
    if (run && idx.length > 2) return cap(YEAR_NAME[YEARS[idx[0]]]) + " to " + YEAR_NAME[YEARS[idx[idx.length - 1]]];
    var w = idx.map(function(i){ return YEAR_NAME[YEARS[i]]; });
    return cap(w.slice(0, -1).join(", ") + " and " + w[w.length - 1]);
  }
  // goals in plain words: policy master's for MPP and MPA
  function goalLabel(ds){
    var g = ["phd","predoc","mpp","mpa","ma"].filter(function(d){ return ds.indexOf(d) >= 0; });
    var out = [];
    if (g.length === 5) out.push("any graduate degree");
    else {
      if (ds.indexOf("phd") >= 0) out.push("PhD");
      if (ds.indexOf("predoc") >= 0) out.push("predoc");
      if (ds.indexOf("mpp") >= 0 || ds.indexOf("mpa") >= 0) out.push("policy master's");
      if (ds.indexOf("ma") >= 0) out.push("MA");
    }
    if (ds.indexOf("jd") >= 0) out.push("law school");
    return out.length ? "For " + out.join(", ") : "";
  }
  // "Internship (spring, summer, fall)" instead of three separate types
  function typeLabel(ts){
    var seasons = [["spring-internship","spring"],["summer-internship","summer"],["fall-internship","fall"]].filter(function(s){ return ts.indexOf(s[0]) >= 0; });
    var out = [];
    ts.forEach(function(t){
      if (/-internship$/.test(t)){ if (t === seasons[0][0]) out.push(seasons.length > 1 ? "Internship (" + seasons.map(function(s){ return s[1]; }).join(", ") + ")" : TYPE[t]); }
      else out.push(TYPE[t]);
    });
    return out.join(" · ");
  }
  // what a program costs the student: it pays you, it's fully funded, it's free, or it charges a fee
  function costTag(p){
    if (p.paid === true) return '<span class="tag tag-ink">Paid</span>';
    if (p.cost === "funded") return '<span class="tag tag-ink">Fully funded</span>';
    if (p.cost === "free") return '<span class="tag">Free</span>';
    if (p.cost === "fee") return '<span class="tag tag-fee">Charges a fee</span>';
    return "";
  }
  function row(p){
    var dated = Q.dated(p), n = dated ? Q.left(p.due) : null, d = dated ? Q.parse(p.due) : null;
    var urgent = dated && n <= 7, soonish = dated && n <= 14;
    var when = dated ? "<b>" + Q.MON[d.getMonth()] + " " + d.getDate() + "</b><span>" + esc(Q.inDays(n)) + "</span>"
                     : "<b>" + esc(p.whenB || "Open") + "</b><span>" + esc(p.whenS || "") + "</span>";
    var facts = (p.opens ? "<dt>Opens</dt><dd>" + esc(p.opens) + "</dd>" : "") + p.facts.map(function(x){ return "<dt>" + x[0] + "</dt><dd>" + x[1] + "</dd>"; }).join("");
    var line = [typeLabel(p.types), yearsLabel(p.years), goalLabel(p.degrees)].filter(Boolean).map(esc).join(" · ");
    return '<li class="prog" id="' + esc(p.id) + '"><div class="p-when' + (urgent ? " urgent" : soonish ? " soon" : "") + '">' + when + "</div>" +
      '<div class="p-what"><h3>' + p.name + "</h3>" +
      '<p class="p-tags">' + costTag(p) + '<span class="p-line">' + line + "</span></p>" +
      (p.meta ? '<p class="p-meta">' + esc(p.meta) + "</p>" : "") +
      "<details><summary>Who can apply, pay and details</summary>" + (p.body ? "<p>" + p.body + "</p>" : "") + (p.warn ? '<p class="p-warn">' + p.warn + "</p>" : "") +
      (facts ? "<dl>" + facts + "</dl>" : "") +
      (p.url ? '<p class="p-check"><a class="p-site" href="' + esc(p.url) + '">Official website</a>Check it for the most accurate, up-to-date information before you apply.</p>' : "") +
      "</details></div></li>";
  }

  var shown = 40, soon = 0;  // soon: only deadlines in the next N days (set by a quick filter)
  // the filters as one object, so the list and the quick-filter counts use the same test
  function current(){ return {q: val("q"), degree: val("degree"), year: val("year"), type: val("type"), paid: val("paid"), open: val("open"), soon: soon}; }
  function matcher(st){
    var q = String(st.q || "").toLowerCase().split(/\s+/).filter(Boolean).map(function(w){ return new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); });
    var deg = st.degree;
    return function(p){
      if (q.length && !q.every(function(w){ return w.test(hay(p)); })) return false;
      if (deg === "grad" ? !p.degrees.some(function(d){ return d !== "jd"; }) : deg && p.degrees.indexOf(deg) < 0) return false;
      if (st.year && p.years.indexOf(st.year) < 0) return false;
      if (st.type && p.types.indexOf(st.type) < 0) return false;
      if (st.paid && p.paid !== true && p.cost !== "funded") return false;
      if (st.open && !p.allOpen) return false;
      if (st.soon && !(Q.dated(p) && Q.left(p.due) <= st.soon)) return false;
      return true;
    };
  }
  var PRESETS = [].map.call(root.querySelectorAll("[data-preset]"), function(b){ return {el: b, st: JSON.parse(b.getAttribute("data-preset"))}; });
  function same(a, b){ return ["q","degree","year","type"].every(function(n){ return String(a[n] || "") === String(b[n] || ""); }) && !!a.paid === !!b.paid && !!a.open === !!b.open && (a.soon || 0) === (b.soon || 0); }
  function apply(st){
    ["q","degree","year","type"].forEach(function(n){ f(n).value = st[n] || ""; });
    f("paid").checked = !!st.paid; f("open").checked = !!st.open; soon = st.soon || 0; shown = 40; render();
  }
  PRESETS.forEach(function(x){ var n = PROGRAMS.filter(matcher(x.st)).length; x.el.insertAdjacentHTML("beforeend", ' <span class="n">' + n + "</span>"); });

  // the filters that are on, each one a button that turns it off
  function chips(st){
    var c = [];
    if (st.q) c.push(["q", "“" + st.q + "”"]);
    if (st.soon) c.push(["soon", "Closing in " + st.soon + " days"]);
    if (st.degree) c.push(["degree", GOAL[st.degree] || st.degree]);
    if (st.year) c.push(["year", cap(YEAR_NAME[st.year] || st.year)]);
    if (st.type) c.push(["type", TYPE[st.type] || st.type]);
    if (st.paid) c.push(["paid", "Paid or fully funded"]);
    if (st.open) c.push(["open", "Open to DACA, undocumented or international students"]);
    return c;
  }
  function render(){
    var st = current();
    var list = PROGRAMS.filter(matcher(st)).sort(function(a, b){ return key(a) - key(b) || Q.name(a).localeCompare(Q.name(b)); });
    var groups = [], last = null;
    list.forEach(function(p){
      var k = key(p), label = k === Infinity ? "No date posted yet" : MONTH[new Date(k).getMonth()] + " " + new Date(k).getFullYear();
      if (label !== last){ groups.push({label: label, items: []}); last = label; }
      groups[groups.length - 1].items.push(p);
    });
    // show the first `shown` programs, keeping each month's full count in its heading
    var left = shown;
    listEl.innerHTML = list.length ? groups.map(function(g){
      if (left <= 0) return "";
      var items = g.items.slice(0, left); left -= items.length;
      return '<section class="month"><div class="m-head"><h2>' + esc(g.label) + '</h2><span class="m-n">' + g.items.length + (g.items.length === 1 ? " program" : " programs") + '</span></div><ol class="progs">' + items.map(row).join("") + "</ol></section>";
    }).join("") + (list.length > shown ? '<button type="button" class="btn btn-ink p-more">Show all ' + list.length + " programs</button>" : "")
      : '<div class="p-empty"><p>No programs match all of these filters.</p><p>Turn one off above, or <button type="button" class="p-reset">clear them all</button>.</p></div>';
    listEl.querySelectorAll(".month .m-head, .prog").forEach(function(el){ el.setAttribute("data-reveal", ""); });
    if (window.QCReveal) window.QCReveal(listEl);
    // a quick filter shows as pressed while the filters match it exactly
    PRESETS.forEach(function(x){ x.el.setAttribute("aria-pressed", same(st, x.st) ? "true" : "false"); });
    var on = chips(st);
    countEl.innerHTML = "<b>" + list.length + (list.length === 1 ? " program" : " programs") + "</b>" + (on.length ? "" : " in all") + ", soonest deadline first";
    activeEl.innerHTML = on.length ? '<span class="p-active-h">Filtered by</span>' + on.map(function(c){
      return '<button type="button" data-clear="' + c[0] + '" aria-label="Remove filter: ' + esc(c[1]) + '">' + esc(c[1]) + ' <span aria-hidden="true">×</span></button>';
    }).join("") + (on.length > 1 ? '<button type="button" class="p-reset link">Clear all</button>' : "") : "";
  }
  root.addEventListener("input", function(e){ if (e.target.matches("[data-f]")){ shown = 40; render(); } });
  root.addEventListener("change", function(e){ if (e.target.matches("[data-f]")){ shown = 40; render(); } });
  root.addEventListener("click", function(e){
    if (e.target.closest(".p-more")){ shown = Infinity; render(); }
    var pre = e.target.closest("[data-preset]");
    if (pre) apply(pre.getAttribute("aria-pressed") === "true" ? {} : JSON.parse(pre.getAttribute("data-preset")));
    var clr = e.target.closest("[data-clear]");
    if (clr){
      var n = clr.getAttribute("data-clear");
      if (n === "soon") soon = 0; else if (n === "paid" || n === "open") f(n).checked = false; else f(n).value = "";
      shown = 40; render();
    }
    if (e.target.closest(".p-reset")) apply({});
  });

  // filters from the address
  var params = new URLSearchParams(location.search);
  ["degree","year","type","q"].forEach(function(n){ var v = params.get(n); if (v && f(n)) f(n).value = v; });
  // a program in the hash: show everything, open it, scroll to it
  var target = location.hash.slice(1);
  if (target && window.ALIASES && window.ALIASES[target]) target = window.ALIASES[target];
  if (target && PROGRAMS.some(function(p){ return p.id === target; })) shown = Infinity;
  render();
  if (target){
    var el = document.getElementById(target);
    if (!el && PROGRAMS.some(function(p){ return p.id === target; })){ ["q","degree","year","type"].forEach(function(n){ f(n).value = ""; }); render(); el = document.getElementById(target); }
    if (el){ el.classList.add("target"); el.querySelector("details").open = true; setTimeout(function(){ el.scrollIntoView(); }, 0); }
  }
})();
