(function(){
  // The year-by-year path, shared by the home page and the Graduate school and Law school pages.
  // For each year: what to do (window.PLANS, built from the site's timelines by build.py), how to do it
  // (the matching guides) and what to apply to (programs from data.js for that year and goal).
  var PROGRAMS = window.PROGRAMS || [];
  var PLANS = window.PLANS || {};
  var GUIDE_FILE = (window.SITEMAP && window.SITEMAP.guides) || {};
  var MON = ["Jan","Feb","Mar","Apr","May","June","July","Aug","Sept","Oct","Nov","Dec"];
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function parse(s){ var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function left(s){ return Math.round((parse(s) - today) / 86400000); }
  function nextOf(md){ if (!md) return Infinity; var d = new Date(today.getFullYear(), +md.slice(0, 2) - 1, +md.slice(3)); if (d < today) d.setFullYear(d.getFullYear() + 1); return d.getTime(); }
  function textOf(h){ var d = document.createElement("div"); d.innerHTML = h; return (d.textContent || "").trim(); }
  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function name(p){ return p.short || textOf(p.name).replace(/\s*\([^)]*\)\s*$/, ""); }
  // ev: the date is an event (a fair, a talk), not a deadline
  function inDays(n, ev){ return ev ? "event " + (n === 0 ? "today" : n === 1 ? "tomorrow" : "in " + n + " days")
                                    : n === 0 ? "closes today" : n === 1 ? "closes tomorrow" : "in " + n + " days"; }
  function dated(p){ return p.due && (p.status === "confirmed" || p.status === "estimate") && left(p.due) >= 0; }
  var KIND = {"summer-research":"summer research", "summer-internship":"summer internship", "fall-internship":"fall internship",
              "spring-internship":"spring internship", "fellowship":"fellowship or scholarship", "campus":"at QC and CUNY",
              "visit":"PhD visit or prep", "pipeline":"pre-law program", "course":"course or training", "conference":"conference or event", "after":"after-college job", "journalism":"journalism program", "international":"international affairs program", "politics":"politics program"};
  var GOAL_NAME = {phd:"the PhD", predoc:"a predoc", mpp:"the MPP", mpa:"the MPA", ma:"the MA", jd:"law school"};

  var STAGES = [
    {y:"fr", label:"Freshman", plural:"freshmen", pic:"assets/main-st-qns-college-td-32-queens.jpg", alt:"Queens Hall on the Queens College campus", pos:"55% 50%"},
    {y:"so", label:"Sophomore", plural:"sophomores", pic:"assets/manhattan-seen-from-queens-college.jpg", alt:"The Manhattan skyline seen across the Queens College Quad", pos:"40% 70%"},
    {y:"jr", label:"Junior", plural:"juniors", pic:"assets/new-york-state-capitol-albany-new-york.jpg", alt:"Inside the New York State Capitol in Albany", pos:"50% 45%"},
    {y:"sr", label:"Senior", plural:"seniors", pic:"assets/courthouses-on-foley-square.jpg", alt:"The courthouses on Foley Square in Lower Manhattan", pos:"50% 35%"},
    {y:"grad", label:"After college", plural:"recent graduates", pic:"assets/united-states-capitol-washington-dc.jpg", alt:"The United States Capitol in Washington", pos:"50% 50%"}
  ];
  function Gd(id, title, line){ return {id:id, title:title, line:line}; }
  var GUIDES = {
    grad: {
      fr: [Gd("g-social", "Talk to your professors", "Office hours, and an email you can copy"), Gd("g-campus", "Getting involved at Queens College", "Clubs, student government and honor societies"), Gd("g-pair", "Pair your major", "Minors and second majors that open doors"), Gd("g-funding", "Scholarships and funding", "QC's own application, every semester"), Gd("g-search", "Job search tools and AI", "HireQC, free certificates and job alerts")],
      so: [Gd("g-methods", "Methods and skills", "Statistics, R and the courses that teach them"), Gd("g-network", "Building a network", "Professors, the career center and NYC events"), Gd("g-social", "Talk to your professors", "How office hours turn into research work"), Gd("g-samples", "Sample résumé and CV", "Copy the structure, not the content")],
      jr: [Gd("g-letters", "Recommendation letters", "How to ask, with a sample email"), Gd("g-help", "Statements, help and AI", "Who reads your statement, and where AI fits"), Gd("g-visit", "PhD visit programs", "Funded campus visits; apply the summer before senior year"), Gd("g-funding", "Scholarships and funding", "Truman, Rhodes, Marshall and other national awards"), Gd("g-ai", "Using AI the right way", "A helper and a proofreader, never the writer")],
      sr: [Gd("g-apply", "Applying to PhD programs", "Fees, waivers, the GRE and the rest of the file"), Gd("g-letters", "Recommendation letters", "Ask six to eight weeks ahead"), Gd("g-help", "Statements, help and AI", "Get your statement read before you send it"), Gd("g-funding", "Study or work abroad", "Fully funded master's degrees and teaching jobs abroad")],
      grad: [Gd("g-jobs", "Jobs you can get", "Common first jobs for political science majors and what they pay"), Gd("g-fields", "Journalism, nonprofits and government", "Paid fellowships and jobs after college"), Gd("g-funding", "Study or work abroad", "Fulbright, Princeton in Asia, JET and more"), Gd("g-ai", "Using AI the right way", "Profiles, job searches and interview practice")]
    },
    law: {
      fr: [Gd("l-start", "Start here: law school", "Three ground rules for pre-law students"), Gd("l-qc", "QC and CUNY pre-law resources", "Pre-law advising, the Legal Studies minor and clubs"), Gd("g-social", "Talk to your professors", "Office hours, and an email you can copy"), Gd("g-funding", "Scholarships and funding", "QC's own application, every semester")],
      so: [Gd("l-research", "Research as a pre-law student", "Honors theses and faculty research"), Gd("g-network", "Building a network", "Professors, the career center and NYC events"), Gd("g-search", "Job search tools and AI", "HireQC, free certificates and job alerts"), Gd("g-social", "Talk to your professors", "The professors who will write your letters")],
      jr: [Gd("l-lsat", "LSAT and fees", "Test dates, costs and the fee waiver"), Gd("g-letters", "Recommendation letters", "How to ask, with a sample email"), Gd("l-sample", "Sample law school résumé", "Hours per week, interests, no objective"), Gd("g-help", "Statements, help and AI", "Who reads your statement, and where AI fits")],
      sr: [Gd("l-lsat", "LSAT and fees", "Fall test dates and the fee waiver"), Gd("g-letters", "Recommendation letters", "Ask six to eight weeks ahead"), Gd("g-help", "Statements, help and AI", "Get your statement read before you send it"), Gd("l-sample", "Sample law school résumé", "List hours per week for jobs during school")],
      grad: [Gd("l-gap", "Gap years", "Most law students worked first"), Gd("g-jobs", "Jobs you can get", "Paralegal, legislative and nonprofit jobs, and what they pay"), Gd("l-lsat", "LSAT and fees", "Take the LSAT while you work"), Gd("g-letters", "Recommendation letters", "Keep two professors who can still write for you")]
    }
  };

  function planRows(goal, stage){
    var rows = PLANS[goal] || [];
    if (stage.y === "sr") return rows.filter(function(r){ return r.label === "Senior"; }).slice(0, 1);
    if (stage.y === "grad") return rows.filter(function(r){ return r.label === "Senior"; }).slice(1);  // law's "taking time off"
    return rows.filter(function(r){ return r.label === stage.label; });
  }
  function programsFor(goal, year){
    var list = PROGRAMS.filter(function(p){
      var g = goal === "grad" ? p.degrees.some(function(d){ return d !== "jd"; }) : p.degrees.indexOf(goal) >= 0;
      return g && (!year || p.years.indexOf(year) >= 0);
    });
    var key = function(p){ return dated(p) ? parse(p.due).getTime() : nextOf(p.dueMD); };
    return list.sort(function(a, b){ return key(a) - key(b) || name(a).localeCompare(name(b)); });
  }
  function applyItem(p){
    var when;
    if (dated(p)){ var d = parse(p.due), n = left(p.due); when = '<time datetime="' + p.due + '"' + (n <= 14 ? ' class="soon"' : "") + ">" + MON[d.getMonth()] + " " + d.getDate() + "</time>"; }
    else when = '<span class="when">' + esc(p.whenB || "") + "</span>";
    var bits = (p.paid === true ? "Paid " : p.cost === "funded" ? "Fully funded " : p.cost === "free" ? "Free " : "") + (KIND[p.types[0]] || "");
    if (dated(p)) bits += ", " + inDays(left(p.due), p.event); else if (p.whenS) bits += ", " + p.whenS;
    bits = bits.charAt(0).toUpperCase() + bits.slice(1);
    return "<li>" + when + '<a href="programs.html#' + esc(p.id) + '">' + esc(name(p)) + '</a><span class="m">' + esc(bits) + "</span></li>";
  }

  function render(el, goal){
    var kind = goal === "jd" ? "law" : "grad";
    el.innerHTML = STAGES.map(function(st){
      var rows = planRows(goal, st), head = rows[0];
      var focus = head ? head.focus : "Work first, or go straight on";
      var todo = rows.map(function(r, i){
        return (i ? '<p class="part-note alt">' + esc(r.focus) + "</p>" : "") + '<div class="terms">' + r.terms.map(function(t){
          return '<div><p class="term-n">' + esc(t.name) + "</p><ul>" + t.items.map(function(x){ return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
        }).join("") + "</div>";
      }).join("") || '<p class="part-note">There is no fixed plan after college. Most people work a year or two first; the guides and programs here are where to start.</p>';
      var guides = (GUIDES[kind][st.y] || []).filter(function(g){ return !(g.id === "g-visit" && goal !== "phd") && !(g.id === "g-apply" && goal !== "phd"); });
      if (kind === "grad" && st.y === "sr" && goal !== "phd") guides.unshift(Gd("g-funding", "Scholarships and funding", "Funding for policy and master's programs"));
      var progs = programsFor(goal, st.y);
      return '<section class="stage" id="y-' + st.y + '" aria-labelledby="h-' + st.y + '">' +
        '<div class="stage-pin"><h2 id="h-' + st.y + '">' + esc(st.label) + "</h2>" +
          '<p class="stage-focus">' + esc(focus) + "</p>" + (head && head.tag ? '<p class="stage-tag">' + esc(head.tag) + "</p>" : "") +
          '<img src="' + st.pic + '" width="1920" height="1280" alt="' + esc(st.alt) + '" loading="lazy" decoding="async" style="object-position:' + st.pos + '">' +
        "</div>" +
        '<div class="stage-body">' +
          '<div class="part" data-reveal><h3>What to do</h3>' + todo + "</div>" +
          '<div class="part" data-reveal><h3>How to do it</h3><ul class="guides">' + guides.slice(0, 4).map(function(g){
            return '<li><a href="' + (GUIDE_FILE[g.id] || "guides.html") + '">' + esc(g.title) + "</a><span>" + esc(g.line) + "</span></li>";
          }).join("") + "</ul></div>" +
          '<div class="part" data-reveal><h3>Apply to</h3><ol class="apply">' + progs.slice(0, 5).map(applyItem).join("") +
          '</ol><a class="all-link" href="programs.html?degree=' + goal + "&year=" + st.y + '">All ' + progs.length + " programs for " + esc(st.plural) + "</a></div>" +
        "</div></section>";
    }).join("");
    if (window.QCReveal) window.QCReveal(el);
  }

  window.QCPath = {render: render, programsFor: programsFor, applyItem: applyItem, dated: dated, name: name, left: left, parse: parse, MON: MON, GOAL_NAME: GOAL_NAME, inDays: inDays, esc: esc};
})();
