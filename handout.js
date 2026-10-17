(function(){
  // One-page handout for each path: handout.html?path=grad or ?path=law. Black and white, made to print.
  // Add &pdf=1 for the digital version (the PDFs in downloads/): the same page with working links to the site.
  // Nothing here goes out of date week to week: no live deadlines, only the months things usually close,
  // and a QR code to the Programs page, which is updated every week.
  var path = /[?&]path=law\b/.test(location.search) ? "law" : "grad";
  var digital = /[?&]pdf=1\b/.test(location.search);
  var BASE = "https://maljahmi.github.io/qc-polisci-pathways/";
  var SITE = "maljahmi.github.io/qc-polisci-pathways";
  var EMAIL = "mohamed.aljahmi@qc.cuny.edu";
  var P = function(id){ return "programs.html#" + id; };

  var TEXT = {
    grad: {
      title: "Graduate school",
      intro: "For Queens College Political Science majors thinking about a PhD or a policy master's. Most of the programs in the full guide are free, and many pay you.",
      firstHead: "Degrees and paths",
      first: [
        ["PhD", "Research and teaching. Funded with tuition and a stipend; 5–6 years.", "grad.html?degree=phd#degrees"],
        ["Predoc", "A paid research job for 1–2 years before a PhD, open to any major. Apply in the fall of senior year.", "grad.html?degree=predoc#degrees"],
        ["MPP", "Design and evaluate policy. About 2 years. Baruch's Marxe School is adding one (first class fall 2027).", "grad.html?degree=mpp#degrees"],
        ["MPA", "Run public and nonprofit organizations. 1–2 years; CUNY programs cost far less than private ones.", "grad.html?degree=mpa#degrees"],
        ["MA", "Graduate study and methods without a PhD. 1–2 years.", "grad.html?degree=ma#degrees"]
      ],
      // each year's focus and tag match the site's year-by-year path
      focus: [["Explore and protect your GPA"], ["Get research experience"], ["Apply to summer research", "Busiest year"], ["Apply, or work first"]],
      years: [
        ["Freshman", ["Take PSCI 100-level courses and PSCI 200.", "Go to one professor's office hours.", "Protect your GPA; many programs cut off at 3.0.", "Summer: a paid job or internship."]],
        ["Sophomore", ["Take an intro statistics course (PSYCH 107 or DATA 205).", "Ask professors about research assistant work.", "Apply for summer research: MIT MSRP, Leadership Alliance, Big Ten SROP, Yale SURF.", "Apply to Honors in the Social Sciences."]],
        ["Junior", ["Apply to RBSI, PPIA, MIT MSRP and the Truman Scholarship (November–February).", "Albany session internships (campus dates in October).", "The CUNY Pipeline Program (early March).", "Apply to fall PhD visit programs in July–August."]],
        ["Senior", ["Take the GRE by October if your programs want it; ask for letters early.", "The APSA Diversity Fellowship (late October).", "PhD applications close late November to mid-December; apply to policy master's too.", "Or work first: Coro, Urban Fellows, Civil Service Pathways, predocs."]]
      ],
      calendar: [
        ["Sept–Oct", "Economics predoc jobs, the APSA Diversity Fellowship and QC's fall scholarship application"],
        ["November", "PPIA summer institutes and the Albany session internships"],
        ["December", "Most PhD applications"],
        ["Jan–Feb", "Summer research (RBSI, MIT MSRP, Leadership Alliance, Big Ten SROP, Yale SURF), the Truman Scholarship and Coro"],
        ["March", "The CUNY Pipeline Program and QC's spring scholarship application"],
        ["July–Aug", "Fall PhD visit programs, for rising seniors"]
      ],
      links: [
        ["office hours", "guide-professors.html"], ["PSYCH 107 or DATA 205", "guide-methods.html"],
        ["MIT MSRP", P("gp-mit-msrp-pathways-political")], ["Leadership Alliance", P("gp-leadership-alliance-sr-eip")],
        ["Big Ten SROP", P("gp-big-ten-academic-alliance")], ["Yale SURF", P("gp-yale-surf")],
        ["Honors in the Social Sciences", P("gp-honors-social-sciences-hss")], ["RBSI", P("gp-apsa-ralph-bunche-summer")],
        ["PPIA", P("gp-ppia-junior-summer-institute")], ["Truman Scholarship", P("gp-truman-scholarship")],
        ["Albany session internships", P("gp-ny-state-senate-session")], ["CUNY Pipeline Program", P("gp-cuny-pipeline-program")],
        ["PhD visit programs", "guide-phd-visits.html"], ["APSA Diversity Fellowship", P("gp-apsa-diversity-fellowship-program")],
        ["PhD applications", "guide-applying.html"], ["GRE", "guide-applying.html"], ["Coro", P("gp-coro-fellows-program-public")],
        ["Urban Fellows", P("gp-nyc-urban-fellows")], ["Civil Service Pathways", P("gp-cuny-civil-service-pathways")],
        ["predocs", "grad.html?degree=predoc#degrees"], ["Economics predoc jobs", "grad.html?degree=predoc#degrees"],
        ["fall scholarship application", P("gp-qc-general-scholarship-application")],
        ["spring scholarship application", P("gp-qc-general-scholarship-application")]
      ],
      help: [
        ["Office of Honors and Scholarships", "Rebecca Baron, Advisor for Scholarships and Fellowships, helps with statements of purpose, Truman and other fellowships.", "https://www.qc.cuny.edu/academics/ohs/externalscholarships/"],
        ["Your professors", "Office hours, research assistant work and, later, letters of recommendation.", BASE + "guide-professors.html"],
        ["Center for Career Engagement and Internships", "Frese Hall 213. Résumé reviews, mock interviews and the stipend for unpaid internships.", "https://www.qc.cuny.edu/academics/cei/"],
        ["Office of Undergraduate Research", "The spring research symposium. OUGR@qc.cuny.edu.", ""]
      ],
      qr: "assets/qr-programs-grad.svg", qrUrl: "programs.html?degree=grad"
    },
    law: {
      title: "Law school",
      intro: "For Queens College Political Science majors thinking about law school. Admissions weigh your LSAT score and GPA most, and most of the help is free. Taking time off before law school is normal.",
      firstHead: "What admissions reads",
      first: [
        ["LSAT", "Two Logical Reasoning sections and one Reading Comprehension section, scored 120–180, plus a writing sample. Many schools also take the GRE.", "guide-lsat.html"],
        ["GPA", "Every year counts, so protect it from the start.", "law.html#path"],
        ["The rest", "Personal statement, 2–3 letters and a résumé that lists your hours for jobs held during school.", "guide-law-resume.html"]
      ],
      focus: [["Explore and protect your GPA"], ["Get legal experience"], ["Legal internships and the LSAT", "Decide when to apply"], ["Apply, or take time off"]],
      years: [
        ["Freshman", ["Meet QC Pre-Law Advising.", "Join the Legal Studies Club or Model UN; take PSCI 100.", "Summer: any job or internship; responsibility counts."]],
        ["Sophomore", ["Start the Legal Studies minor.", "CLEO's Road to Law School workshop (fall).", "Apply for district attorney office internships; each office posts its own dates."]],
        ["Junior", ["Decide when to apply. Want to work first? Harvard's Junior Deferral Program or Columbia LEAD.", "Apply for the LSAC fee waiver at least six months before your first LSAT.", "Start LSAT prep on LawHub; take a June LSAT if you'll apply in the fall."]],
        ["Senior", ["Take the LSAT by September or October.", "Register for CAS; finish your statement and letters.", "Apply September–December.", "The ABA Legal Opportunity Scholarship (January to mid-March)."]]
      ],
      calendar: [
        ["Sept–Dec", "Law school applications. Apply early; most schools decide on a rolling basis"],
        ["Most months", "The LSAT; take it by the fall you apply"],
        ["Oct–Nov", "Albany session internships and CLEO's Road to Law School"],
        ["Jan–Mar", "Summer pre-law programs and the ABA Legal Opportunity Scholarship"],
        ["June–July", "Columbia LEAD and Harvard's Junior Deferral Program, for juniors"]
      ],
      links: [
        ["QC Pre-Law Advising", P("lp-qc-pre-law-advising")], ["Legal Studies minor", P("lp-legal-studies-minor")],
        ["CLEO's Road to Law School", P("lp-cleo-road-law-school")], ["district attorney office internships", P("lp-manhattan-da-college-internship")],
        ["Harvard's Junior Deferral Program", P("lp-harvard-law-junior-deferral")], ["Columbia LEAD", P("lp-columbia-law-lead")],
        ["LSAC fee waiver", "guide-lsat.html"], ["LawHub", "guide-lsat.html"], ["The LSAT", "guide-lsat.html"],
        ["ABA Legal Opportunity Scholarship", P("lp-aba-legal-opportunity-scholarship")],
        ["Albany session internships", P("gp-ny-state-senate-session")], ["Summer pre-law programs", "programs.html?degree=jd&type=pipeline"],
        ["Law school applications", "guide-gap-years.html"]
      ],
      help: [
        ["QC Pre-Law Advising", "In the Academic Advising Center: requirements, LSAT resources, statement and résumé review.", BASE + P("lp-qc-pre-law-advising")],
        ["Legal Studies minor", "Run by Political Science; its three required courses also count toward the major.", BASE + P("lp-legal-studies-minor")],
        ["Center for Career Engagement and Internships", "Frese Hall 213. Résumé reviews and a one-time stipend for unpaid internships.", "https://www.qc.cuny.edu/academics/cei/"],
        ["Office of Honors and Scholarships", "Truman and other fellowships.", "https://www.qc.cuny.edu/academics/ohs/externalscholarships/"]
      ],
      qr: "assets/qr-programs-law.svg", qrUrl: "programs.html?degree=jd"
    }
  };

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function a(href, label){
    if (!digital || !href) return label;
    if (!/^(https?|mailto):/.test(href)) href = BASE + href;
    // links to the site say they came from the PDF, so site analytics can count them
    if (href.indexOf(BASE) === 0){ var h = href.split("#"); href = h[0] + (h[0].indexOf("?") < 0 ? "?" : "&") + "utm_source=handout-pdf" + (h[1] ? "#" + h[1] : ""); }
    return '<a href="' + esc(href) + '">' + label + "</a>";
  }
  // in the digital version, program and guide names become links (first mention only)
  function linked(text, t, used){
    var out = esc(text);
    if (!digital) return out;
    t.links.forEach(function(l){
      if (used[l[0]]) return;
      var i = out.indexOf(esc(l[0]));
      if (i < 0) return;
      used[l[0]] = true;
      out = out.slice(0, i) + a(l[1], esc(l[0])) + out.slice(i + esc(l[0]).length);
    });
    return out;
  }

  var t = TEXT[path], used = {};
  document.documentElement.classList.toggle("digital", digital);
  var html = '<div class="mast"><span>Queens College Political Science Pathways</span>' + a(BASE, '<span class="url">' + SITE + "</span>") + "</div>" +
    '<div class="head"><h1>' + esc(t.title) + "</h1>" +
    '<p class="intro">' + esc(t.intro) + "</p></div>" +
    "<section><h2>" + esc(t.firstHead) + '</h2><div class="first" style="grid-template-columns:repeat(' + t.first.length + ',minmax(0,1fr))">' +
    t.first.map(function(r){ return "<div><b>" + a(r[2], esc(r[0])) + "</b><p>" + esc(r[1]) + "</p></div>"; }).join("") + "</div></section>" +
    "<section><h2>" + a(path === "law" ? "law.html#path" : "grad.html#path", "Year by year") + '</h2><div class="years">' +
    t.years.map(function(y, i){
      var f = t.focus[i] || [];
      return '<div class="year' + (f[1] ? " key" : "") + '"><h3>' + esc(y[0]) + "</h3>" +
        (f[0] ? '<p class="focus">' + esc(f[0]) + "</p>" : "") + (f[1] ? '<span class="tag">' + esc(f[1]) + "</span>" : "") +
        '<ul class="items">' + y[1].map(function(it){ return "<li>" + linked(it, t, used) + "</li>"; }).join("") + "</ul></div>";
    }).join("") + "</div></section>" +
    '<section class="two"><div><h2>When things usually close</h2><dl class="cal">' +
    t.calendar.map(function(c){ return "<dt>" + esc(c[0]) + "</dt><dd>" + linked(c[1], t, used) + "</dd>"; }).join("") +
    '</dl></div>' +
    "<div><h2>Help on campus</h2><ul class=\"help\">" +
    t.help.map(function(h){ return "<li><b>" + a(h[2], esc(h[0])) + "</b>" + esc(h[1]) + "</li>"; }).join("") + "</ul></div></section>" +
    '<footer><div class="foot">' +
    '<div class="scan">' + a(t.qrUrl, '<img src="' + t.qr + '" width="96" height="96" alt="QR code that opens the Programs page">') +
    "<div><b>" + (digital ? a(t.qrUrl, "Every program and deadline") : "Scan for every program and deadline") + "</b>" +
    "<span>Exact dates" + (path === "law" ? " for law school programs" : "") + ", updated every week, at " + a(BASE, SITE) + "</span></div></div>" +
    "<p>Student-made guide by Mohamed Aljahmi, not an official Queens College or CUNY publication. Dates change every year; confirm each one on the official page before you apply. Questions: " +
    a("mailto:" + EMAIL, EMAIL) + ".</p></div></footer>";
  document.getElementById("page").innerHTML = html;
  document.title = t.title + " handout · Queens College Political Science Pathways";
  var other = path === "grad" ? "law" : "grad";
  document.getElementById("pdf").href = "downloads/Pathways_" + (path === "law" ? "Law" : "Graduate") + "_School_Handout.pdf";
  document.getElementById("switch").innerHTML = '<a href="handout.html?path=' + other + (digital ? "&pdf=1" : "") + '">' + (other === "law" ? "Law school handout" : "Graduate school handout") + "</a>";
})();
