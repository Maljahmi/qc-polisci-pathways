(function(){
  // The Graduate school and Law school pages. On Graduate school the degree buttons choose the degree:
  // its details open, and the path and the programs below switch to it. Law school is always law.
  var Q = window.QCPath;
  var pathEl = document.querySelector("[data-path]");
  var listEl = document.querySelector("[data-next-programs]");
  var allEl = document.querySelector("[data-all-programs]");
  var ledeEl = document.querySelector("[data-np-lede]");
  var buttons = [].slice.call(document.querySelectorAll("[data-degree]"));
  var DEGREES = buttons.map(function(b){ return b.getAttribute("data-degree"); });

  function show(goal){
    if (pathEl) Q.render(pathEl, goal);
    if (listEl){
      var progs = Q.programsFor(goal, "");
      listEl.innerHTML = progs.slice(0, 8).map(Q.applyItem).join("");
      if (allEl){ allEl.href = "programs.html?degree=" + goal; allEl.textContent = "All " + progs.length + " programs for " + Q.GOAL_NAME[goal]; }
      if (ledeEl) ledeEl.textContent = "The next deadlines for " + Q.GOAL_NAME[goal] + ", soonest first.";
    }
  }
  function choose(goal, quiet){
    buttons.forEach(function(b){ b.setAttribute("aria-pressed", b.getAttribute("data-degree") === goal ? "true" : "false"); });
    document.querySelectorAll("[data-panel]").forEach(function(p){ p.hidden = p.getAttribute("data-panel") !== goal; });
    show(goal);
    if (!quiet){ try { localStorage.setItem("qcpp-goal", goal); } catch(e){} }
  }

  if (buttons.length){
    buttons.forEach(function(b){ b.addEventListener("click", function(){ choose(b.getAttribute("data-degree")); }); });
    // the degree comes from the address (?degree=), then a section id in the hash, then the last choice
    var want = (location.search.match(/[?&]degree=([a-z]+)/) || [])[1];
    var hash = location.hash.slice(1), panel = hash && document.getElementById(hash) && document.getElementById(hash).closest("[data-panel]");
    if (panel) want = panel.getAttribute("data-panel");
    if (DEGREES.indexOf(want) < 0){ try { want = localStorage.getItem("qcpp-goal"); } catch(e){} }
    choose(DEGREES.indexOf(want) >= 0 ? want : "phd", true);
  } else if (pathEl){
    show(pathEl.getAttribute("data-goal") || "jd");
  }
  // land on the requested part once the path exists
  if (location.hash){
    var t = document.getElementById(location.hash.slice(1));
    if (t) setTimeout(function(){ t.scrollIntoView(); }, 0);
  }
})();
