(function(){
  // One-page printable handout for each path: handout.html?path=grad or ?path=law.
  // The year-by-year text is a short version of the site's timelines; the deadlines come
  // from data.js, so the handout stays current with the site.
  var PROGRAMS = window.PROGRAMS || [], EXTRA = window.EXTRA_DEADLINES || [];
  var path = /[?&]path=law\b/.test(location.search) ? "law" : "grad";
  var SITE = "maljahmi.github.io/qc-polisci-pathways";
  var EMAIL = "mohamed.aljahmi@qc.cuny.edu";

  var TEXT = {
    grad: {
      title: "Graduate school at a glance",
      intro: "For Queens College Political Science majors thinking about a PhD or a policy master's. Most of the programs in the full guide are free, and many pay you.",
      firstHead: "Degrees",
      first: [
        ["PhD", "Research and teaching. Funded with tuition and a stipend; 5–6 years."],
        ["MPP", "Design and evaluate policy. About 2 years. Baruch's Marxe School starts one in fall 2027."],
        ["MPA", "Run public and nonprofit organizations. 1–2 years; CUNY programs cost far less than private ones."],
        ["MA", "Graduate study and methods without a PhD. 1–2 years."]
      ],
      years: [
        ["Freshman", ["Take PSCI 100-level courses and PSCI 200.", "Go to one professor's office hours.", "Protect your GPA; many programs cut off at 3.0.", "Summer: a paid job or internship."]],
        ["Sophomore", ["Take an intro statistics course (PSYCH 107 or DATA 205).", "Ask professors about research assistant work.", "Apply for summer research: MIT MSRP, Leadership Alliance, Big Ten SROP, Yale SURF (Nov–Feb).", "Apply to Honors in the Social Sciences."]],
        ["Junior", ["The busiest year: RBSI, PPIA JSI, MIT MSRP and Truman close October–February.", "Albany session internships (campus dates in October).", "CUNY Pipeline Program (priority date Mar 1).", "Apply to fall PhD visit programs in July–August."]],
        ["Senior", ["Take the GRE by October; ask for letters early.", "APSA Diversity Fellowship (Oct 25).", "PhD applications late November–December 17; policy master's, including Baruch's new MPP.", "Or work first: Coro, Urban Fellows, Civil Service Pathways, predocs."]]
      ],
      help: [
        ["Office of Honors and Scholarships", "Rebecca Baron, Advisor for Scholarships and Fellowships, helps with statements of purpose, Truman and other fellowships."],
        ["Your professors", "Office hours, research assistant work and, later, letters of recommendation."],
        ["Center for Career Engagement and Internships (Frese 213)", "Résumé reviews and the stipend for unpaid internships."],
        ["Office of Undergraduate Research", "The spring research symposium. OUGR@qc.cuny.edu."]
      ],
      degrees: ["phd", "mpp", "mpa", "ma"]
    },
    law: {
      title: "Law school at a glance",
      intro: "For Queens College Political Science majors thinking about law school. Admissions weigh your LSAT score and GPA most, and most of the help is free. Taking time off before law school is normal.",
      firstHead: "What admissions reads",
      first: [
        ["LSAT", "Two Logical Reasoning sections and one Reading Comprehension section, scored 120–180, plus a writing sample. Many schools also take the GRE."],
        ["GPA", "Every year counts, so protect it from the start."],
        ["The rest", "Personal statement, 2–3 letters and a résumé that lists your hours for jobs held during school."]
      ],
      years: [
        ["Freshman", ["Meet QC Pre-Law Advising.", "Join the Legal Studies Club or Model UN; take PSCI 100.", "Summer: any job or internship; responsibility counts."]],
        ["Sophomore", ["Start the Legal Studies minor.", "CLEO Road to Law School workshop (fall).", "Apply for DA office internships; the Manhattan DA's summer window is Jan 15–Feb 1."]],
        ["Junior", ["Decide when to apply. Deferring? Harvard's Junior Deferral Program or Columbia LEAD.", "Apply for the LSAC fee waiver at least six months before your first LSAT.", "Start LSAT prep on LawHub; June LSAT if you'll apply senior fall."]],
        ["Senior", ["LSAT by September–October.", "Register for CAS; finish your statement and letters.", "Apply September–December.", "ABA Legal Opportunity Scholarship (Jan 15–Mar 15)."]]
      ],
      help: [
        ["QC Pre-Law Advising", "In the Academic Advising Center: requirements, LSAT resources, statement and résumé review."],
        ["Legal Studies minor", "Run by Political Science; its three required courses also count toward the major."],
        ["Center for Career Engagement and Internships (Frese 213)", "Résumé reviews and a one-time $2,700 stipend for unpaid internships."],
        ["Office of Honors and Scholarships", "Truman and other fellowships."]
      ],
      degrees: ["jd"]
    }
  };

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function textOf(html){ var d = document.createElement("div"); d.innerHTML = html; return (d.textContent || "").trim(); }
  function parse(iso){ var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  var MONTHS = ["Jan","Feb","Mar","Apr","May","June","July","Aug","Sept","Oct","Nov","Dec"];
  var today = new Date(); today.setHours(0, 0, 0, 0);

  function deadlines(t){
    var list = [];
    PROGRAMS.forEach(function(p){
      if (!p.due || p.event || (p.status !== "confirmed" && p.status !== "estimate")) return;
      if (!p.degrees.some(function(d){ return t.degrees.indexOf(d) >= 0; })) return;
      list.push({d:p.due, n:p.short || textOf(p.name).replace(/\s*\([^)]*\)\s*$/, ""), a:p.status === "estimate"});
    });
    EXTRA.forEach(function(x){ if (x.t === path) list.push(x); });
    return list.filter(function(x){ return parse(x.d) >= today; })
      .sort(function(a, b){ return (parse(a.d) - parse(b.d)) || (a.n < b.n ? -1 : 1); })
      .slice(0, 10);
  }

  var t = TEXT[path];
  var checked = today.toLocaleDateString("en-US", {month:"long", day:"numeric", year:"numeric"});
  var html = '<header><div class="site">Queens College Political Science Pathways</div>' +
    '<h1>' + esc(t.title) + '</h1>' +
    '<p class="sub">Full guide: ' + SITE + ' · Program details checked September 2026 · Deadlines as of ' + esc(checked) + '</p></header>' +
    '<p class="intro">' + esc(t.intro) + '</p>' +
    '<h2>' + esc(t.firstHead) + '</h2><dl class="degrees">' +
    t.first.map(function(r){ return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join("") + '</dl>' +
    '<h2>Year by year</h2><div class="years">' +
    t.years.map(function(y){ return '<div><h3>' + esc(y[0]) + '</h3><ul>' + y[1].map(function(i){ return '<li>' + esc(i) + '</li>'; }).join("") + '</ul></div>'; }).join("") + '</div>' +
    '<div class="two"><div><h2>Next deadlines</h2><ol class="deadlines">' +
    deadlines(t).map(function(x){ var d = parse(x.d); return '<li><span class="d">' + (x.a ? "~" : "") + MONTHS[d.getMonth()] + " " + d.getDate() + '</span><span>' + esc(x.n) + '</span></li>'; }).join("") +
    '</ol></div><div><h2>Help on campus</h2><ul>' +
    t.help.map(function(h){ return '<li><b>' + esc(h[0]) + '.</b> ' + esc(h[1]) + '</li>'; }).join("") + '</ul></div></div>' +
    '<footer>Student-made guide by Mohamed Aljahmi, not an official Queens College or CUNY publication. Dates change every year; confirm each one on the official page before you apply. Questions: ' + EMAIL + '.</footer>';
  document.getElementById("page").innerHTML = html;
  document.title = t.title + " · Queens College Political Science Pathways";
  var other = path === "grad" ? "law" : "grad";
  document.getElementById("switch").innerHTML = '<a href="handout.html?path=' + other + '">' + (other === "law" ? "Law school handout" : "Grad school handout") + '</a>';
})();
