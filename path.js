(function(){
  // The home page: the goal buttons switch the shared year-by-year path (path-core.js) and the
  // "next deadline" line in the first screen.
  var Q = window.QCPath, PROGRAMS = window.PROGRAMS || [];
  var stagesEl = document.querySelector("[data-stages]");
  var buttons = [].slice.call(document.querySelectorAll("[data-goal]"));
  var GOALS = buttons.map(function(b){ return b.getAttribute("data-goal"); });

  function nextDeadline(goal){
    var el = document.querySelector("[data-next]");
    var up = PROGRAMS.filter(function(p){ return p.degrees.indexOf(goal) >= 0 && Q.dated(p); })
      .sort(function(a, b){ return Q.parse(a.due) - Q.parse(b.due); });
    if (!el || !up.length) return;
    var p = up[0], d = Q.parse(p.due);
    el.innerHTML = "<b>Next deadline</b>" + Q.esc(Q.name(p)) + ", " + Q.MON[d.getMonth()] + " " + d.getDate() + ", " + Q.inDays(Q.left(p.due)) + ".";
  }
  function choose(goal, quiet){
    buttons.forEach(function(b){ b.setAttribute("aria-pressed", b.getAttribute("data-goal") === goal ? "true" : "false"); });
    Q.render(stagesEl, goal);
    nextDeadline(goal);
    if (!quiet){ try { localStorage.setItem("qcpp-goal", goal); } catch(e){} }
  }
  buttons.forEach(function(b){ b.addEventListener("click", function(){ choose(b.getAttribute("data-goal")); }); });
  window.QCChooseGoal = function(g){ if (GOALS.indexOf(g) >= 0) choose(g); };
  var g0 = null; try { g0 = localStorage.getItem("qcpp-goal"); } catch(e){}
  choose(GOALS.indexOf(g0) >= 0 ? g0 : "phd", true);

  var picker = document.querySelector(".picker");
  function pickerH(){ if (picker) document.documentElement.style.setProperty("--picker-h", picker.offsetHeight + "px"); }
  pickerH(); window.addEventListener("resize", pickerH);
  if (location.hash){ var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function(){ t.scrollIntoView(); }, 0); }
})();
