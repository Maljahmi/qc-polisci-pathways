(function(){
  // The home page: the goal buttons switch the shared year-by-year path (path-core.js).
  var Q = window.QCPath;
  var stagesEl = document.querySelector("[data-stages]");
  var buttons = [].slice.call(document.querySelectorAll("[data-goal]"));
  var GOALS = buttons.map(function(b){ return b.getAttribute("data-goal"); });

  function choose(goal, quiet){
    buttons.forEach(function(b){ b.setAttribute("aria-pressed", b.getAttribute("data-goal") === goal ? "true" : "false"); });
    Q.render(stagesEl, goal);
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
