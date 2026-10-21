(function(){
  // Abbreviations explained: the first time each one appears in a block of text (a guide, a program, a plan), it gets
  // a dotted underline; tap, click or focus it to see what it stands for. Add new ones to ABBR.
  var ABBR = {
    AAPD: "American Association of People with Disabilities", ABNY: "Association for a Better New York",
    AI: "artificial intelligence", APAICS: "Asian Pacific American Institute for Congressional Studies",
    APSA: "American Political Science Association", APSIA: "Association of Professional Schools of International Affairs",
    BALA: "Business and Liberal Arts (a Queens College honors minor)", BPC: "Bipartisan Policy Center",
    CAIR: "Council on American-Islamic Relations", CAS: "Credential Assembly Service, LSAC's system for sending your law school applications",
    CBCF: "Congressional Black Caucus Foundation", CBYX: "Congress-Bundestag Youth Exchange", CFB: "New York City Campaign Finance Board",
    CFR: "Council on Foreign Relations", CHCI: "Congressional Hispanic Caucus Institute", CHLI: "Congressional Hispanic Leadership Institute",
    CIA: "Central Intelligence Agency", CLS: "Critical Language Scholarship", CNAS: "Center for a New American Security",
    CSIS: "Center for Strategic and International Studies", CUNY: "City University of New York",
    DAAD: "German Academic Exchange Service", DACA: "Deferred Action for Childhood Arrivals",
    DCAS: "New York City Department of Citywide Administrative Services", DCCC: "Democratic Congressional Campaign Committee",
    DIA: "Defense Intelligence Agency", DNC: "Democratic National Committee",
    DYCD: "New York City Department of Youth and Community Development", FAFSA: "Free Application for Federal Student Aid",
    FBI: "Federal Bureau of Investigation", FPA: "Foreign Policy Association", FSOT: "Foreign Service Officer Test",
    GMF: "German Marshall Fund of the United States", GPA: "grade point average", GRE: "Graduate Record Examinations, a test some graduate programs ask for",
    HKS: "Harvard Kennedy School", HNMUN: "Harvard National Model United Nations",
    HPAIR: "Harvard Project for Asian and International Relations", HSS: "Honors in the Social Sciences (Queens College)",
    IMF: "International Monetary Fund", IRC: "International Rescue Committee", ISF: "Islamic Scholarship Fund",
    ISW: "Institute for the Study of War", ITIN: "Individual Taxpayer Identification Number", JD: "Juris Doctor, the law degree",
    LSAC: "Law School Admission Council", LSAT: "Law School Admission Test", MA: "Master of Arts",
    MBA: "Master of Business Administration", MEI: "Middle East Institute", MEXT: "Japan's Ministry of Education, Culture, Sports, Science and Technology",
    MIA: "Master of International Affairs", MPA: "Master of Public Administration", MPAC: "Muslim Public Affairs Council",
    MPH: "Master of Public Health", MPP: "Master of Public Policy", MPSA: "Midwest Political Science Association",
    MSRP: "MIT Summer Research Program", MSW: "Master of Social Work", NAFAC: "Naval Academy Foreign Affairs Conference",
    NCCC: "National Civilian Community Corps (AmeriCorps)", NCSC: "National Collegiate Security Conference",
    NCUR: "National Conference on Undergraduate Research", NCUSCR: "National Committee on U.S.-China Relations",
    NEPSA: "Northeastern Political Science Association", NMUN: "National Model United Nations",
    NRCC: "National Republican Congressional Committee", NSA: "National Security Agency",
    NYPIRG: "New York Public Interest Research Group", NYSPSA: "New York State Political Science Association",
    OUGR: "Office of Undergraduate Research (Queens College)", OWL: "Online Writing Lab (Purdue)", PhD: "Doctor of Philosophy, a research doctorate",
    PMF: "Presidential Management Fellows", PPIA: "Public Policy and International Affairs program", PSCI: "political science (the course prefix at Queens College)",
    PSLF: "Public Service Loan Forgiveness", QC: "Queens College", RBSI: "Ralph Bunche Summer Institute",
    REU: "Research Experiences for Undergraduates", RNC: "Republican National Committee",
    SCUSA: "Student Conference on U.S. Affairs (West Point)", SLU: "CUNY School of Labor and Urban Studies",
    SPH: "CUNY School of Public Health", SROP: "Summer Research Opportunities Program", SUNY: "State University of New York",
    SURF: "Summer Undergraduate Research Fellowship", SYEP: "Summer Youth Employment Program", TAP: "Tuition Assistance Program (New York State)",
    TPS: "Temporary Protected Status", UN: "United Nations", UNICEF: "United Nations Children's Fund",
    WFPG: "Women's Foreign Policy Group", WOLA: "Washington Office on Latin America", YPFP: "Young Professionals in Foreign Policy"
  };
  var RE = new RegExp("\\b(" + Object.keys(ABBR).sort(function(a, b){ return b.length - a.length; }).join("|") + ")\\b", "g");
  var SKIP = /^(A|ABBR|BUTTON|SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|CODE|H1|H2|H3|H4|LABEL|SUMMARY|TITLE)$/;
  // one block of text each: a guide or page section, a program row, a list item in a plan
  var BLOCK = ".prog, .p-what, section, article, .stage, li.plan-yr, .term, .about-right";

  function mark(root){
    if (!root || !root.querySelectorAll || (root.closest && root.closest("header, nav, footer, .s-dlg, .picker, .presets, .filters"))) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: function(n){
      for (var p = n.parentNode; p && p !== root.parentNode; p = p.parentNode){
        if (p.nodeType === 1 && (SKIP.test(p.tagName) || p.matches("header, nav, footer, .s-dlg, .picker, .presets, .filters, .p-when, [data-ui]"))) return NodeFilter.FILTER_REJECT;
      }
      RE.lastIndex = 0;
      return RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }});
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function(node){
      var block = (node.parentNode.closest && node.parentNode.closest(BLOCK)) || document.body;
      var seen = block.__abbrSeen || (block.__abbrSeen = {});
      var text = node.nodeValue, out = document.createDocumentFragment(), last = 0, changed = false, m;
      RE.lastIndex = 0;
      while ((m = RE.exec(text))){
        var k = m[1];
        // already spelled out right here, like "Law School Admission Test (LSAT)"? leave it
        if (seen[k]) continue;
        seen[k] = true;
        if (text.slice(Math.max(0, m.index - 2), m.index) === " (" && text.slice(0, m.index).indexOf(ABBR[k].split(/[,(]/)[0]) >= 0) continue;
        changed = true;
        out.appendChild(document.createTextNode(text.slice(last, m.index)));
        var ab = document.createElement("abbr");
        ab.title = ABBR[k]; ab.tabIndex = 0; ab.textContent = k;
        out.appendChild(ab);
        last = m.index + k.length;
      }
      if (!changed) return;
      out.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(out, node);
    });
  }

  // tap, click or focus shows the meaning (title tooltips don't show on phones)
  var tip = document.createElement("span");
  tip.className = "abbr-tip"; tip.setAttribute("role", "tooltip"); tip.hidden = true;
  document.body.appendChild(tip);
  var current = null;
  function show(ab){
    current = ab; tip.textContent = ab.textContent + ": " + ab.title; tip.hidden = false;
    var r = ab.getBoundingClientRect(), w = Math.min(320, document.documentElement.clientWidth - 24);
    tip.style.maxWidth = w + "px";
    var left = Math.max(12, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - w - 12));
    tip.style.left = left + "px"; tip.style.top = (r.bottom + window.scrollY + 6) + "px";
  }
  function hide(){ tip.hidden = true; current = null; }
  document.addEventListener("click", function(e){
    var ab = e.target.closest && e.target.closest("abbr[title]");
    if (ab){ if (current === ab) hide(); else show(ab); } else hide();
  });
  document.addEventListener("focusin", function(e){ if (e.target.matches && e.target.matches("abbr[title]")) show(e.target); });
  document.addEventListener("focusout", function(e){ if (e.target.matches && e.target.matches("abbr[title]")) hide(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") hide(); });
  window.addEventListener("scroll", function(){ if (current) show(current); }, {passive: true});

  mark(document.querySelector("main") || document.body);
  // lists drawn after load (programs, the year-by-year path) get the same treatment
  if ("MutationObserver" in window) new MutationObserver(function(list){
    list.forEach(function(r){ [].forEach.call(r.addedNodes, function(nd){ if (nd.nodeType === 1 && !nd.matches("abbr, .abbr-tip")) mark(nd); }); });
  }).observe(document.querySelector("main") || document.body, {childList: true, subtree: true});
})();
