(function(){
  // "Not sure where to start?": eight plain questions, each with a way to say "not sure". The result is
  // the goal that fits best, a runner-up and a fact about each (facts already checked on the site), plus
  // a button that switches the path to it and jumps to the student's year. A student who answers "not
  // sure" a lot gets first steps that help with every path instead of a forced answer.
  var box = document.querySelector("[data-quiz]");
  if (!box) return;

  var NAME = {phd:"a PhD", predoc:"a predoc", mpp:"an MPP", mpa:"an MPA", ma:"an MA", jd:"law school"};
  var TITLE = {phd:"A PhD", predoc:"A predoc", mpp:"An MPP", mpa:"An MPA", ma:"An MA", jd:"Law school"};
  var FACT = {
    phd: ["PhD programs pay you: tuition plus a stipend of $31,141 a year at the CUNY Graduate Center and $52,680 at Princeton (2026–27).", "grad.html?degree=phd#g-phd-about"],
    predoc: ["A predoc is a paid research job before a PhD, open to any major. Stanford's SIEPR posted one at $64,260 a year.", "grad.html?degree=predoc#g-predoc-about"],
    mpp: ["An MPP teaches you to design and test policy in about two years. Baruch, part of CUNY, starts one in fall 2027 with evening classes.", "grad.html?degree=mpp#g-mpp-about"],
    mpa: ["An MPA teaches you to run public and nonprofit organizations. At Baruch or John Jay it costs New York residents $6,375 a semester; Columbia SIPA charges $74,220 a year.", "grad.html?degree=mpa#g-mpa-about"],
    ma: ["An MA gives you graduate methods without committing to a PhD. 73% of UChicago MAPSS graduates who applied to PhDs got funded offers.", "grad.html?degree=ma#g-ma-about"],
    jd: ["86% of Harvard Law's Class of 2029 spent at least a year out of college, so you don't have to go straight from QC.", "law.html#takes"]
  };
  var Q = [
    {q: "What year are you in?", a: [
      ["Freshman", {year: "fr"}], ["Sophomore", {year: "so"}], ["Junior", {year: "jr"}], ["Senior", {year: "sr"}], ["I've graduated", {year: "grad"}]]},
    {q: "What are you hoping to do after college?", a: [
      ["Go to graduate school", {phd: 1, predoc: 1, mpp: 1, mpa: 1, ma: 1}],
      ["Go to law school", {jd: 3}],
      ["Get a job first and decide later", {predoc: 1, mpa: 1, jd: 1, work: 1}],
      ["I have no idea yet", {unsure: 1}]]},
    {q: "Which topics do you enjoy most in your classes?", a: [
      ["Courts, rights and the Constitution", {jd: 3}],
      ["How government and cities actually work", {mpa: 2, mpp: 1, government: 1}],
      ["Problems like housing, health or immigration, and what to do about them", {mpp: 3, mpa: 1, jd: 1}],
      ["Elections, public opinion and why people believe what they do", {phd: 2, predoc: 1, ma: 1}],
      ["Other countries and international relations", {ma: 2, phd: 1, mpp: 1, abroad: 1}],
      ["Writing about the news and current events", {ma: 1, jd: 1, journalism: 1}],
      ["I haven't found a favorite yet", {unsure: 1}]]},
    {q: "How do you feel about statistics and working with data?", a: [
      ["I like it", {phd: 2, predoc: 3, mpp: 1}],
      ["It's okay", {mpp: 1, mpa: 1, ma: 1}],
      ["I've never really tried it", {stats: 1}],
      ["I don't enjoy it", {jd: 2, mpa: 1, phd: -1, predoc: -3}]]},
    {q: "How do you feel about reading a lot and writing long papers?", a: [
      ["I enjoy it", {jd: 2, phd: 2, ma: 1}],
      ["It's okay", {}],
      ["I'd rather do hands-on work", {mpa: 2, mpp: 1}],
      ["Not sure yet", {unsure: 1}]]},
    {q: "Which kind of work sounds best day to day?", a: [
      ["Researching one question for months until you find the answer", {phd: 3, predoc: 2, ma: 1}],
      ["Helping people with their problems, one person at a time", {jd: 3, mpa: 1}],
      ["Running projects and leading a team", {mpa: 3}],
      ["Weighing options and recommending what a government should do", {mpp: 3, predoc: 1}],
      ["Not sure yet", {unsure: 1}]]},
    {q: "How do you feel about more school after college?", a: [
      ["I'd stay five or more years if it's paid for", {phd: 3}],
      ["One or two more years is fine", {mpp: 2, mpa: 2, ma: 2}],
      ["Three years is fine for the right degree", {jd: 2}],
      ["I'd rather work for a while first", {predoc: 2, jd: 1, mpa: 1, work: 1}],
      ["I don't know yet", {unsure: 1}]]},
    {q: "Where could you see yourself in ten years?", a: [
      ["At a university or think tank, doing research", {phd: 3, predoc: 1, ma: 1}],
      ["In a government office, like City Hall or a federal agency", {mpa: 2, mpp: 2, jd: 1, government: 1}],
      ["In a courtroom, a legal aid office or a law firm", {jd: 4}],
      ["At a nonprofit or advocacy group", {mpa: 2, jd: 1, mpp: 1}],
      ["In a newsroom", {ma: 1, mpp: 1, journalism: 1}],
      ["I honestly don't know yet", {unsure: 1}]]}
  ];
  var ORDER = ["jd", "phd", "mpp", "mpa", "predoc", "ma"];
  var picks = [], step = 0;
  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

  function question(){
    var item = Q[step];
    box.innerHTML = '<form class="q-form"><fieldset><legend class="q-q">' + esc(item.q) + "</legend>" +
      '<p class="q-progress">Question ' + (step + 1) + " of " + Q.length + "</p>" +
      '<div class="q-opts">' + item.a.map(function(a, i){
        return '<label class="q-opt"><input type="radio" name="q" value="' + i + '"' + (picks[step] === i ? " checked" : "") + "><span>" + esc(a[0]) + "</span></label>";
      }).join("") + "</div></fieldset>" +
      (step ? '<button type="button" class="q-back">Back</button>' : "") + "</form>";
    box.querySelectorAll('input[name="q"]').forEach(function(r){
      r.addEventListener("change", function(){
        picks[step] = +r.value;
        setTimeout(function(){ step++; if (step < Q.length) question(); else result(); focusBox(); }, 160);
      });
    });
    var back = box.querySelector(".q-back");
    if (back) back.addEventListener("click", function(){ step--; question(); focusBox(); });
  }
  function focusBox(){ var f = box.querySelector("input, h3"); if (f) f.focus({preventScroll: true}); }

  function result(){
    var score = {}, flags = {}, year = "fr";
    ORDER.forEach(function(g){ score[g] = 0; });
    picks.forEach(function(p, i){
      var w = Q[i].a[p][1];
      Object.keys(w).forEach(function(k){
        if (k === "year") year = w[k];
        else if (score.hasOwnProperty(k)) score[k] += w[k];
        else flags[k] = (flags[k] || 0) + 1;
      });
    });
    var ranked = ORDER.slice().sort(function(a, b){ return score[b] - score[a]; });
    var best = ranked[0], next = ranked[1];
    var unsure = (flags.unsure || 0) >= 3 || score[best] < 6;
    var tips = [];
    if (flags.stats) tips.push('Never tried statistics? A free course like <a href="https://www.khanacademy.org/math/statistics-probability">Khan Academy\'s Statistics and probability</a> is a low-stakes way to find out if you like it. More in <a href="guide-methods.html">Methods and skills</a>.');
    if (flags.journalism) tips.push('You might also like journalism: paid newsroom internships and fellowships are in <a href="guide-journalism-nonprofits-government.html">Journalism, nonprofits and government</a>.');
    if (flags.government) tips.push('Government internships, from City Hall to Washington, are in <a href="programs.html?q=government">Opportunities</a>.');
    if (flags.abroad) tips.push('Interested in other countries? See <a href="guide-scholarships.html">Scholarships and funding</a> for study and work abroad, from Fulbright to teaching in Japan.');
    if (flags.work) tips.push('Working first is common. The "After college" part of your path shows paid jobs and fellowships.');
    // students who aren't sure: AI can help, and so can people
    if (unsure) tips.push('<b>AI can help you figure it out.</b> Tell it who you are and what you like, ask it the right questions, and it can help you map out a path. Start with the prompts in <a href="guide-ai.html">Using AI the right way</a>. If you\'d rather not use AI, that\'s fine: that\'s what professors, advisors, your classmates and the internet are for. There\'s no one right way to get a degree or a job, and if you put in your best effort, you can succeed.');
    // no signal at all (mostly "not sure"): don't name a degree, show both paths instead
    var signal = score[best] >= 3;
    var steps = '<p class="q-say">That\'s completely normal, and you don\'t have to decide now. Three things help with every path: go to one professor\'s office hours (<a href="guide-professors.html">here\'s how</a>), take a statistics or methods class, and try one paid summer program or internship.' +
      (signal ? " From your answers, " + esc(NAME[best]) + " and " + esc(NAME[next]) + " are worth a look first." : "") + "</p>";
    var facts = signal
      ? '<p class="q-fact">' + esc(FACT[best][0]) + ' <a href="' + FACT[best][1] + '">More about ' + esc(NAME[best]) + "</a></p>" +
        '<p class="q-also"><b>Also worth a look: ' + esc(NAME[next]) + ".</b> " + esc(FACT[next][0]) + ' <a href="' + FACT[next][1] + '">More</a></p>'
      : '<p class="q-also"><b>Graduate school.</b> ' + esc(FACT.phd[0]) + ' <a href="grad.html">See the degrees</a></p>' +
        '<p class="q-also"><b>Law school.</b> ' + esc(FACT.jd[0]) + ' <a href="law.html">See law school</a></p>';
    box.innerHTML = '<div class="q-result">' +
      '<h3 tabindex="-1">' + (unsure ? "No single path stands out yet" : esc(TITLE[best]) + " fits you best") + "</h3>" +
      (unsure ? steps : "") + facts +
      tips.map(function(t){ return '<p class="q-tip">' + t + "</p>"; }).join("") +
      '<div class="q-actions"><button type="button" class="btn q-go">' + (signal ? "See my path" : "See what to do this year") + '</button><button type="button" class="q-again">Start over</button></div></div>';
    box.querySelector(".q-go").addEventListener("click", function(){
      if (signal && window.QCChooseGoal) window.QCChooseGoal(best);
      var t = document.getElementById("y-" + year);
      if (t) t.scrollIntoView();
    });
    box.querySelector(".q-again").addEventListener("click", function(){ picks = []; step = 0; question(); focusBox(); });
  }
  question();
})();
