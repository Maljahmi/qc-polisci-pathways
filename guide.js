(function(){
  // Lists of programs to apply to, each chosen by the filter build.py wrote into data-spec
  // (degrees, types, years, paid). Used at the end of guides and on the Jobs page.
  var Q = window.QCPath;
  if (!Q) return;
  var any = function(list, want){ return !want || want.some(function(x){ return list.indexOf(x) >= 0; }); };
  var key = function(p){ return Q.dated(p) ? Q.parse(p.due).getTime() : Infinity; };
  document.querySelectorAll("[data-next-programs][data-spec]").forEach(function(el){
    var spec = {};
    try { spec = JSON.parse(el.getAttribute("data-spec")); } catch(e){}
    var list = (window.PROGRAMS || []).filter(function(p){
      return any(p.degrees, spec.degrees) && any(p.types, spec.types) && any(p.years, spec.years) && (!spec.paid || p.paid === true);
    }).sort(function(a, b){ return key(a) - key(b) || Q.name(a).localeCompare(Q.name(b)); });
    el.innerHTML = list.slice(0, spec.limit || 6).map(Q.applyItem).join("");
    if (!list.length) el.closest("section").hidden = true;
  });
})();
