(function(){
  // Shared by every page: the program count, the "last updated" date, entrances as things scroll in,
  // the sample résumé tabs, and the top bar's height for sticky offsets.
  var PROGRAMS = window.PROGRAMS || [];
  var MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  document.querySelectorAll("[data-count]").forEach(function(el){ el.textContent = PROGRAMS.length; });
  if (window.UPDATED){
    var p = window.UPDATED.split("-"), u = new Date(+p[0], +p[1] - 1, +p[2]);
    document.querySelectorAll("[data-updated]").forEach(function(el){
      el.textContent = "Last updated " + MONTH[u.getMonth()] + " " + u.getDate() + ", " + u.getFullYear() + ". Deadlines and new programs are checked every week.";
    });
    document.querySelectorAll("[data-checked]").forEach(function(el){ el.textContent = MONTH[u.getMonth()] + " " + u.getFullYear(); });
  }

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, {rootMargin: "0px 0px -10% 0px", threshold: 0.08}) : null;
  window.QCReveal = function(root){
    var n = 0;
    root.querySelectorAll("[data-reveal]").forEach(function(el){
      if (el.classList.contains("is-in")) return;
      el.style.setProperty("--d", n++ % 4);
      if (io) io.observe(el); else el.classList.add("is-in");
    });
  };
  // long pages reveal their blocks as they arrive: article parts, lists and program rows
  document.querySelectorAll(".article > *, .about-grid > div, .credit-grid > li, .about-right > *, .about-left > *, .guide-list > li, .gg-side > *, .article-band > h2, .degrees > h2, .next-programs > h2, .more-guides > h2, .guide-pic").forEach(function(el){
    if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "");
  });
  window.QCReveal(document);

  // sample résumé and CV tabs
  document.querySelectorAll(".tabs button[data-doc]").forEach(function(b){
    b.addEventListener("click", function(){
      var doc = b.getAttribute("data-doc"), box = b.closest(".stage") || document;
      b.parentNode.querySelectorAll("button").forEach(function(x){ x.setAttribute("aria-selected", x === b ? "true" : "false"); });
      box.querySelectorAll("[data-paper]").forEach(function(s){ s.hidden = s.getAttribute("data-paper") !== doc; });
    });
  });

  // the home page's photo credits come from the list the skill's asset tool keeps
  var credit = document.querySelector("[data-credits]");
  if (credit && window.fetch) fetch("assets/credits.json").then(function(r){ return r.json(); }).then(function(list){
    var e = function(t){ return String(t).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); };
    credit.parentNode.innerHTML = "Photos (shown in black and white), via Wikimedia Commons: " + list.map(function(c){
      return '<a href="' + e(c.page) + '">' + e(c.title) + "</a> by " + e(c.creator) + ", " + e(c.license);
    }).join("; ") + ".";
  }).catch(function(){});

  // links to other sites open in a new tab, including the ones drawn after load (program lists, the path)
  function newTab(){
    document.querySelectorAll('a[href^="http"]:not([target])').forEach(function(a){
      if (a.host !== location.host){ a.target = "_blank"; a.rel = "noopener"; }
    });
  }
  newTab();
  var queued = false;
  if ("MutationObserver" in window) new MutationObserver(function(){
    if (queued) return;
    queued = true;
    setTimeout(function(){ queued = false; newTab(); }, 0);  // a timer, not a frame: frames don't run in background tabs
  }).observe(document.body, {childList: true, subtree: true});

  var bar = document.querySelector(".topbar");
  function barH(){ if (bar) document.documentElement.style.setProperty("--bar", bar.offsetHeight + "px"); }
  barH(); window.addEventListener("resize", barH);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(barH);
})();
