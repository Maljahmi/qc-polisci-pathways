(function(){
  // Every program in one list: search and filters, grouped by the month of each program's next deadline.
  // The address can set filters (?degree=phd&year=jr&type=visit&q=housing) and open one program (#gp-...).
  var Q = window.QCPath, PROGRAMS = window.PROGRAMS || [];
  var MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var TYPES = [["summer-research","Summer research or institute"],["summer-internship","Summer internship"],["fall-internship","Fall internship"],
               ["spring-internship","Spring internship"],["fellowship","Fellowship or scholarship"],["campus","At QC and CUNY"],
               ["visit","PhD visit or prep program"],["pipeline","Pre-law pipeline program"],["course","Course or training"],["conference","Conference or event"],["after","After college"],["journalism","Journalism"],["international","International affairs"],["politics","Politics and campaigns"]];
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
  // each text also appears without hyphens, so "prelaw" finds "pre-law"
  function dehy(s){ return s + " " + s.replace(/-/g, ""); }
  function hay(p){ return HAY[p.id] || (HAY[p.id] = dehy((Q.name(p) + " " + p.name.replace(/<[^>]+>/g, " ") + " " + p.meta + " " + p.body.replace(/<[^>]+>/g, " ") + " " +
    p.types.map(function(t){ return TYPE[t]; }).join(" ") + " " + p.facts.map(function(x){ return x[0] + " " + x[1].replace(/<[^>]+>/g, " "); }).join(" ")).toLowerCase())); }

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
    if (p.paid === false) return '<span class="tag">Unpaid</span>';
    // pay or cost not stated on the official page (campus courses and advising don't need a label)
    if (p.types.indexOf("campus") < 0) return '<span class="tag">Pay or cost: check the website</span>';
    return "";
  }
  // who can live where: residency: "nyc" (the five boroughs) or "nys" (New York State)
  var RES = {nyc: "NYC residents only", nys: "New York State residents only", li: "Nassau and Suffolk residents only", westchester: "Westchester residents only"};
  function resTag(p){ return RES[p.residency] ? '<span class="tag tag-res">' + RES[p.residency] + "</span>" : ""; }

  // your own list and calendar: add one deadline to Google or as a file for Apple and Outlook, or save programs and
  // add all their deadlines at once. Saved programs stay in this browser only.
  var SAVED = {};
  try { JSON.parse(localStorage.getItem("qcpp-saved") || "[]").forEach(function(id){ SAVED[id] = true; }); } catch(e){}
  function store(){ try { localStorage.setItem("qcpp-saved", JSON.stringify(Object.keys(SAVED))); } catch(e){} }
  function savedCount(){ return PROGRAMS.filter(function(p){ return SAVED[p.id]; }).length; }
  var BASE = "https://maljahmi.github.io/qc-polisci-pathways/";
  function ymd(d){ return d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2); }
  function nextDay(d){ var e = new Date(d.getTime()); e.setDate(e.getDate() + 1); return e; }
  function calTitle(p){ return (p.event ? "Event: " : "Deadline: ") + Q.name(p) + (p.status === "estimate" ? " (estimated)" : ""); }
  // links keep their address in plain text: "Register for the fair (https://...)"
  function plain(t){ var d = document.createElement("div");
    d.innerHTML = String(t || "").replace(/<a [^>]*href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "$2 ($1)"); return (d.textContent || "").trim(); }
  // a calendar entry says what it is, who it's for, where and when, pay or cost and the other facts, then the links
  function calText(p){
    var who = [typeLabel(p.types), yearsLabel(p.years), goalLabel(p.degrees)].filter(Boolean).join(" · ");
    var out = [plain(p.body), who, p.meta ? "Where and when: " + plain(p.meta) : ""]
      .concat(p.facts.map(function(x){ return plain(x[0]) + ": " + plain(x[1]); }))
      .concat([p.opens ? "Opens: " + plain(p.opens) : "", p.status === "estimate" ? "This date is an estimate." : ""]).filter(Boolean);
    return out.join("\n") + "\n\nDetails: " + BASE + "programs.html#" + p.id + "\nOfficial website: " + p.url + "\nAlways confirm the date on the official website.";
  }
  function place(p){ return p.event && p.meta ? plain(p.meta).split(" · ")[0] : ""; }
  function alarms(p){
    function a(trig, text){ return ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc(text), "TRIGGER:" + trig, "END:VALARM"]; }
    return p.event ? a("-P1D", Q.name(p) + " is tomorrow") : a("-P14D", Q.name(p) + " is due in two weeks").concat(a("-P2D", Q.name(p) + " is due in two days"));
  }
  function googleLink(p){ var d = Q.parse(p.due);
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(calTitle(p)) +
      "&dates=" + ymd(d) + "/" + ymd(nextDay(d)) + "&details=" + encodeURIComponent(calText(p).slice(0, 1800)) + (place(p) ? "&location=" + encodeURIComponent(place(p)) : ""); }
  function icsEsc(t){ return String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function icsFold(l){ var out = []; while (l.length > 70){ out.push(l.slice(0, 70)); l = " " + l.slice(70); } out.push(l); return out.join("\r\n"); }
  function icsFile(list){
    var stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//QC Political Science Pathways//Deadlines//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    list.forEach(function(p){ var d = Q.parse(p.due);
      L.push("BEGIN:VEVENT", "UID:" + p.id + "-" + p.due + "@qc-polisci-pathways", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + ymd(d),
        "DTEND;VALUE=DATE:" + ymd(nextDay(d)), "SUMMARY:" + icsEsc(calTitle(p)), "DESCRIPTION:" + icsEsc(calText(p)),
        "URL:" + BASE + "programs.html#" + p.id);
      if (place(p)) L.push("LOCATION:" + icsEsc(place(p)));
      L.push.apply(L, alarms(p)); L.push("END:VEVENT"); });
    L.push("END:VCALENDAR");
    return L.map(icsFold).join("\r\n") + "\r\n";
  }
  function download(name, text){
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], {type: "text/calendar;charset=utf-8"}));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function actions(p){
    var on = !!SAVED[p.id];
    return '<div class="p-acts">' + (Q.dated(p) ? '<span class="p-acts-h">Add to calendar</span><a class="p-act" href="' + esc(googleLink(p)) + '">Google</a>' +
      '<button type="button" class="p-act" data-ics="' + esc(p.id) + '">Apple or Outlook</button>' : "") +
      '<button type="button" class="p-act p-save" data-save="' + esc(p.id) + '" aria-pressed="' + on + '">' + (on ? "Saved" : "Save to my list") + "</button></div>";
  }
  function row(p){
    var dated = Q.dated(p), n = dated ? Q.left(p.due) : null, d = dated ? Q.parse(p.due) : null;
    var urgent = dated && !p.event && n <= 7, soonish = dated && n <= 14;
    var when = dated ? "<b>" + Q.MON[d.getMonth()] + " " + d.getDate() + "</b><span>" + esc(Q.inDays(n, p.event)) + "</span>"
                     : "<b>" + esc(p.whenB || "Open") + "</b><span>" + esc(p.whenS || "") + "</span>";
    var facts = (p.opens ? "<dt>Opens</dt><dd>" + esc(p.opens) + "</dd>" : "") + p.facts.map(function(x){ return "<dt>" + x[0] + "</dt><dd>" + x[1] + "</dd>"; }).join("");
    var line = [typeLabel(p.types), yearsLabel(p.years), goalLabel(p.degrees)].filter(Boolean).map(esc).join(" · ");
    return '<li class="prog" id="' + esc(p.id) + '"><div class="p-when' + (urgent ? " urgent" : soonish ? " soon" : "") + '">' + when + "</div>" +
      '<div class="p-what"><h3>' + p.name + "</h3>" +
      '<p class="p-tags">' + costTag(p) + resTag(p) + '<span class="p-line">' + line + "</span></p>" +
      (p.meta ? '<p class="p-meta">' + esc(p.meta) + "</p>" : "") + actions(p) +
      "<details><summary>Who can apply, pay and details</summary>" + (p.body ? "<p>" + p.body + "</p>" : "") + (p.warn ? '<p class="p-warn">' + p.warn + "</p>" : "") +
      (facts ? "<dl>" + facts + "</dl>" : "") +
      (p.url ? '<p class="p-check"><a class="p-site" href="' + esc(p.url) + '">Official website</a>Check it for the most accurate, up-to-date information before you apply.</p>' : "") +
      "</details></div></li>";
  }

  var shown = 40, soon = 0, savedOnly = false;  // soon: only deadlines in the next N days; savedOnly: your saved list
  // the filters as one object, so the list and the quick-filter counts use the same test
  function current(){ return {q: val("q"), degree: val("degree"), year: val("year"), type: val("type"), paid: val("paid"), open: val("open"), outside: val("outside"), soon: soon, saved: savedOnly}; }
  function matcher(st){
    var q = String(st.q || "").toLowerCase().split(/\s+/).filter(Boolean).map(function(w){ w = w.replace(/-/g, "") || w; return new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); });
    var deg = st.degree;
    return function(p){
      if (q.length && !q.every(function(w){ return w.test(hay(p)); })) return false;
      if (deg === "grad" ? !p.degrees.some(function(d){ return d !== "jd"; }) : deg && p.degrees.indexOf(deg) < 0) return false;
      if (st.year && p.years.indexOf(st.year) < 0) return false;
      if (st.type && p.types.indexOf(st.type) < 0) return false;
      if (st.paid && p.paid !== true && p.cost !== "funded") return false;
      if (st.open && !p.allOpen) return false;
      if (st.outside && p.residency === "nyc") return false;
      if (st.soon && !(Q.dated(p) && !p.event && Q.left(p.due) <= st.soon)) return false;
      if (st.saved && !SAVED[p.id]) return false;
      return true;
    };
  }
  var PRESETS = [].map.call(root.querySelectorAll("[data-preset]"), function(b){ return {el: b, st: JSON.parse(b.getAttribute("data-preset"))}; });
  function same(a, b){ return ["q","degree","year","type"].every(function(n){ return String(a[n] || "") === String(b[n] || ""); }) && !!a.paid === !!b.paid && !!a.open === !!b.open && !!a.outside === !!b.outside && (a.soon || 0) === (b.soon || 0) && !!a.saved === !!b.saved; }
  function apply(st){
    ["q","degree","year","type"].forEach(function(n){ f(n).value = st[n] || ""; });
    f("paid").checked = !!st.paid; f("open").checked = !!st.open; f("outside").checked = !!st.outside; soon = st.soon || 0; savedOnly = !!st.saved; shown = 40; render();
  }
  PRESETS.forEach(function(x){ var n = PROGRAMS.filter(matcher(x.st)).length; x.el.insertAdjacentHTML("beforeend", ' <span class="n">' + n + "</span>"); });
  // "Your saved programs" goes first among the quick filters; its count changes as you save
  var savedBtn = document.createElement("button");
  savedBtn.type = "button"; savedBtn.setAttribute("data-preset", '{"saved": true}'); savedBtn.className = "p-saved-view";
  var presetsEl = root.querySelector(".presets");
  if (presetsEl) presetsEl.insertBefore(savedBtn, presetsEl.querySelector("[data-preset]"));
  PRESETS.unshift({el: savedBtn, st: {saved: true}});
  function savedLabel(){ savedBtn.innerHTML = 'Your saved list <span class="n">' + savedCount() + "</span>"; }
  savedLabel();

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
    if (st.outside) c.push(["outside", "Open if you live outside New York City"]);
    if (st.saved) c.push(["saved", "Your saved list"]);
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
      return '<section class="month"><div class="m-head"><h2>' + esc(g.label) + '</h2><span class="m-n">' + g.items.length + (g.items.length === 1 ? " opportunity" : " opportunities") + '</span></div><ol class="progs">' + items.map(row).join("") + "</ol></section>";
    }).join("") + (list.length > shown ? '<button type="button" class="btn btn-ink p-more">Show all ' + list.length + "</button>" : "")
      : (st.saved && !savedCount() ? '<div class="p-empty"><p>You haven\'t saved anything yet.</p><p>Tap "Save to my list" under anything you like to keep it here, then add all their deadlines to your calendar at once.</p></div>'
      : '<div class="p-empty"><p>Nothing matches all of these filters.</p><p>Turn one off above, or <button type="button" class="p-reset">clear them all</button>.</p></div>');
    listEl.querySelectorAll(".month .m-head, .prog").forEach(function(el){ el.setAttribute("data-reveal", ""); });
    if (window.QCReveal) window.QCReveal(listEl);
    // a quick filter shows as pressed while the filters match it exactly
    PRESETS.forEach(function(x){ x.el.setAttribute("aria-pressed", same(st, x.st) ? "true" : "false"); });
    var on = chips(st);
    countEl.innerHTML = "<b>" + list.length + (list.length === 1 ? " opportunity" : " opportunities") + "</b>" + (on.length ? "" : " in all") + ", soonest date first";
    activeEl.innerHTML = on.length ? '<span class="p-active-h">Filtered by</span>' + on.map(function(c){
      return '<button type="button" data-clear="' + c[0] + '" aria-label="Remove filter: ' + esc(c[1]) + '">' + esc(c[1]) + ' <span aria-hidden="true">×</span></button>';
    }).join("") + (on.length > 1 ? '<button type="button" class="p-reset link">Clear all</button>' : "") : "";
    // with the saved list showing, one button puts every saved deadline in your calendar
    var savedDated = st.saved ? list.filter(function(p){ return Q.dated(p); }) : [];
    if (savedDated.length) activeEl.insertAdjacentHTML("beforeend", '<button type="button" class="p-ics-all" data-ics-all>Add these ' + savedDated.length + (savedDated.length === 1 ? " deadline" : " deadlines") + " to your calendar</button>");
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
      if (n === "soon") soon = 0; else if (n === "saved") savedOnly = false; else if (n === "paid" || n === "open" || n === "outside") f(n).checked = false; else f(n).value = "";
      shown = 40; render();
    }
    if (e.target.closest(".p-reset")) apply({});
    var one = e.target.closest("[data-ics]");
    if (one){ var p1 = PROGRAMS.filter(function(p){ return p.id === one.getAttribute("data-ics"); })[0]; if (p1) download(p1.id + ".ics", icsFile([p1])); }
    if (e.target.closest("[data-ics-all]")) download("my-saved-deadlines.ics", icsFile(PROGRAMS.filter(function(p){ return SAVED[p.id] && Q.dated(p); })));
    var sv = e.target.closest("[data-save]");
    if (sv){
      var id = sv.getAttribute("data-save");
      if (SAVED[id]) delete SAVED[id]; else SAVED[id] = true;
      store(); savedLabel();
      if (savedOnly) render();
      else { sv.setAttribute("aria-pressed", SAVED[id] ? "true" : "false"); sv.textContent = SAVED[id] ? "Saved" : "Save to my list"; }
    }
  });

  // filters from the address
  var params = new URLSearchParams(location.search);
  ["degree","year","type","q"].forEach(function(n){ var v = params.get(n); if (v && f(n)) f(n).value = v; });
  if (params.get("open") === "1") f("open").checked = true;
  if (params.get("outside") === "1") f("outside").checked = true;
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
