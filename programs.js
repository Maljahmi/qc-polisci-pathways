(function(){
  // Every program in one list: search and filters, grouped by the month of each program's next deadline.
  // The address can set filters (?degree=phd&year=jr&type=visit) and open one program (#gp-...).
  var Q = window.QCPath, PROGRAMS = window.PROGRAMS || [];
  var MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var TYPES = [["summer-research","Summer research or institute"],["summer-internship","Summer internship"],["fall-internship","Fall internship"],
               ["spring-internship","Spring internship"],["fellowship","Fellowship or scholarship"],["campus","At QC and CUNY"],
               ["visit","PhD visit or prep program"],["pipeline","Pre-law program"],["course","Course or training"],["after","After college"],["journalism","Journalism"]];
  var TYPE = {}; TYPES.forEach(function(t){ TYPE[t[0]] = t[1]; });
  var YEAR = {fr:"freshmen", so:"sophomores", jr:"juniors", sr:"seniors"};
  var DEG = {phd:"PhD", predoc:"Predoc", mpp:"MPP", mpa:"MPA", ma:"MA", jd:"Law school"};
  var esc = Q.esc;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function nextOf(md){ if (!md) return Infinity; var d = new Date(today.getFullYear(), +md.slice(0, 2) - 1, +md.slice(3)); if (d < today) d.setFullYear(d.getFullYear() + 1); return d.getTime(); }
  function key(p){ return Q.dated(p) ? Q.parse(p.due).getTime() : nextOf(p.dueMD); }

  var root = document.querySelector(".programs"), listEl = root.querySelector(".p-list"), countEl = root.querySelector(".p-count");
  var typeSel = root.querySelector('[data-f="type"]');
  typeSel.innerHTML += TYPES.map(function(t){ return '<option value="' + t[0] + '">' + esc(t[1]) + "</option>"; }).join("");
  function f(n){ return root.querySelector('[data-f="' + n + '"]'); }
  function val(n){ var el = f(n); return el.type === "checkbox" ? el.checked : el.value; }

  // search words must start a word, so "cia" finds the CIA and not "social"
  var HAY = {};
  function hay(p){ return HAY[p.id] || (HAY[p.id] = (Q.name(p) + " " + p.name.replace(/<[^>]+>/g, " ") + " " + p.meta + " " + p.body.replace(/<[^>]+>/g, " ") + " " +
    p.types.map(function(t){ return TYPE[t]; }).join(" ") + " " + p.facts.map(function(x){ return x[0] + " " + x[1].replace(/<[^>]+>/g, " "); }).join(" ")).toLowerCase()); }

  function yearsLabel(ys){
    var ug = ["fr","so","jr","sr"].filter(function(y){ return ys.indexOf(y) >= 0; });
    var w = ug.length === 4 ? ["all years"] : ug.map(function(y){ return YEAR[y]; });
    if (ys.indexOf("grad") >= 0) w.push(ug.length ? "recent graduates" : "graduates");
    var s = w.length > 1 ? w.slice(0, -1).join(", ") + " and " + w[w.length - 1] : (w[0] || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function degLabel(ds){
    var g = ["phd","predoc","mpp","mpa","ma"].filter(function(d){ return ds.indexOf(d) >= 0; });
    var out = g.length === 5 ? ["any graduate degree"] : g.map(function(d){ return DEG[d]; });
    if (ds.indexOf("jd") >= 0) out.push("law school");
    return out.join(", ");
  }
  function row(p){
    var dated = Q.dated(p), n = dated ? Q.left(p.due) : null, d = dated ? Q.parse(p.due) : null;
    var when = dated ? '<b>' + Q.MON[d.getMonth()] + " " + d.getDate() + "</b><span" + (n <= 14 ? ' class="soon"' : "") + ">" + esc(Q.inDays(n)) + "</span>"
                     : "<b>" + esc(p.whenB || "Open") + "</b><span>" + esc(p.whenS || "") + "</span>";
    var summary = (p.paid === true ? "Paid · " : "") + p.types.map(function(t){ return TYPE[t]; }).join(", ") + " · For " + yearsLabel(p.years).toLowerCase() + " · " + degLabel(p.degrees);
    var facts = (p.opens ? "<dt>Opens</dt><dd>" + esc(p.opens) + "</dd>" : "") + p.facts.map(function(x){ return "<dt>" + x[0] + "</dt><dd>" + x[1] + "</dd>"; }).join("");
    return '<li class="prog" id="' + esc(p.id) + '"><div class="p-when">' + when + "</div>" +
      '<div class="p-what"><h3>' + p.name + '</h3><p class="p-sum">' + esc(summary) + "</p>" +
      (p.meta ? '<p class="p-meta">' + esc(p.meta) + "</p>" : "") +
      '<details><summary>Details</summary>' + (p.body ? "<p>" + p.body + "</p>" : "") + (p.warn ? '<p class="p-warn">' + p.warn + "</p>" : "") +
      (facts ? "<dl>" + facts + "</dl>" : "") + "</details></div></li>";
  }

  var shown = 40;
  function render(){
    var q = String(val("q") || "").toLowerCase().split(/\s+/).filter(Boolean).map(function(w){ return new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); });
    var deg = val("degree"), yr = val("year"), ty = val("type"), paid = val("paid"), open = val("open");
    var list = PROGRAMS.filter(function(p){
      if (q.length && !q.every(function(w){ return w.test(hay(p)); })) return false;
      if (deg === "grad" ? !p.degrees.some(function(d){ return d !== "jd"; }) : deg && p.degrees.indexOf(deg) < 0) return false;
      if (yr && p.years.indexOf(yr) < 0) return false;
      if (ty && p.types.indexOf(ty) < 0) return false;
      if (paid && p.paid !== true) return false;
      if (open && !p.allOpen) return false;
      return true;
    }).sort(function(a, b){ return key(a) - key(b) || Q.name(a).localeCompare(Q.name(b)); });
    var groups = [], last = null;
    list.slice(0, shown).forEach(function(p){
      var k = key(p), label = k === Infinity ? "No date posted yet" : MONTH[new Date(k).getMonth()] + " " + new Date(k).getFullYear();
      if (label !== last){ groups.push({label: label, items: []}); last = label; }
      groups[groups.length - 1].items.push(p);
    });
    listEl.innerHTML = list.length ? groups.map(function(g){
      return '<section class="month"><h2>' + esc(g.label) + '</h2><ol class="progs">' + g.items.map(row).join("") + "</ol></section>";
    }).join("") + (list.length > shown ? '<button type="button" class="btn btn-ink p-more">Show all ' + list.length + " programs</button>" : "")
      : '<p class="p-empty">No programs match. <button type="button" class="p-reset">Clear the filters</button></p>';
    var filtered = val("q") || deg || yr || ty || paid || open;
    listEl.querySelectorAll('.month > h2, .prog').forEach(function(el, i){ el.setAttribute('data-reveal', ''); });
    if (window.QCReveal) window.QCReveal(listEl);
    countEl.innerHTML = list.length + (list.length === 1 ? " program" : " programs") + ", soonest deadline first" +
      (filtered ? ' · <button type="button" class="p-reset">Clear filters</button>' : "");
  }
  root.addEventListener("input", function(e){ if (e.target.matches("[data-f]")){ shown = 40; render(); } });
  root.addEventListener("change", function(e){ if (e.target.matches("[data-f]")){ shown = 40; render(); } });
  root.addEventListener("click", function(e){
    if (e.target.closest(".p-more")){ shown = Infinity; render(); }
    if (e.target.closest(".p-reset")){ ["q","degree","year","type"].forEach(function(n){ f(n).value = ""; }); f("paid").checked = false; f("open").checked = false; shown = 40; render(); }
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
