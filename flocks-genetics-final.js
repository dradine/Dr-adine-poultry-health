/* FINAL DEPENDENT GENETICS SELECTORS
   Single purpose: production type -> genetics/company -> strain -> program.
   Runs after every other flock script and repairs legacy handlers that disable
   or clear the dependent selects. Source: standard-data.js / POULTRY_CATALOG.
*/
(function () {
  "use strict";

  var FALLBACK = {
    broiler: [
      { id: "aviagen_ross", name: "Aviagen / Ross", strains: ["Ross 308", "Ross 308 FF", "Ross 708", "Ross 308 AP"] },
      { id: "cobb", name: "Cobb", strains: ["Cobb500", "Cobb800"] },
      { id: "aviagen_arbor", name: "Aviagen / Arbor Acres", strains: ["Arbor Acres Plus", "Arbor Acres Plus S"] },
      { id: "aviagen_indian", name: "Aviagen / Indian River", strains: ["Indian River", "Indian River FF"] },
      { id: "hubbard", name: "Hubbard", strains: ["Efficiency Plus", "Hubbard EDGE"] },
      { id: "arian", name: "آرین ایران", strains: ["Arian"] }
    ],
    layer: [
      { id: "hyline", name: "Hy-Line", strains: ["W-36", "W-80", "W-80 Plus", "W-80 Pro", "Brown"] },
      { id: "hendrix", name: "Hendrix Genetics", strains: ["ISA Brown", "ISA White", "Dekalb White", "Dekalb Brown", "Bovans White", "Bovans Brown", "Shaver White", "Shaver Brown", "Hisex White", "Hisex Brown"] },
      { id: "lohmann", name: "Lohmann", strains: ["Lohmann Brown-Classic", "Lohmann Brown-Lite", "Lohmann Brown-Extra", "Lohmann LSL-Classic", "Lohmann LSL-Lite", "Lohmann LSL-Extra", "Lohmann Sandy", "Lohmann Tradition"] }
    ],
    pullet: [],
    breeder: []
  };

  function normalize(v) {
    return String(v == null ? "" : v).normalize("NFKC")
      .replace(/[\u200c\u200f\u202a-\u202e]/g, "")
      .replace(/ي/g, "ی").replace(/ك/g, "ک")
      .trim().toLowerCase();
  }

  function productionKey(v) {
    var k = normalize(v);
    var map = {
      "گوشتی": "broiler", "broiler": "broiler",
      "تخمگذار": "layer", "تخم گذار": "layer", "تخم‌گذار": "layer", "layer": "layer",
      "پولت": "pullet", "pullet": "pullet",
      "مادر": "breeder", "مرغ مادر": "breeder", "breeder": "breeder"
    };
    return map[k] || k;
  }

  function catalog() {
    try {
      if (typeof POULTRY_CATALOG !== "undefined" && POULTRY_CATALOG) return POULTRY_CATALOG;
    } catch (_) {}
    return window.POULTRY_CATALOG || null;
  }

  function groups() {
    var t = document.getElementById("productionType");
    var c = catalog();
    var key = productionKey(t && t.value);
    var g = c && c[key] && c[key].genetics;
    return Array.isArray(g) && g.length ? g : (FALLBACK[key] || []);
  }

  function els() {
    return {
      t: document.getElementById("productionType"),
      g: document.getElementById("genetics"),
      s: document.getElementById("flockStrain"),
      p: document.getElementById("flockProgram")
    };
  }

  function addOption(select, text, value) {
    var o = document.createElement("option");
    o.value = value == null ? "" : String(value);
    o.textContent = text == null ? "" : String(text);
    select.appendChild(o);
  }

  function reset(select, placeholder) {
    if (!select) return;
    while (select.firstChild) select.removeChild(select.firstChild);
    addOption(select, placeholder, "");
  }

  function fillCompanies() {
    var x = els();
    if (!x.t || !x.g || !x.s) return false;
    var old = x.g.value;
    var list = groups();
    x.g.disabled = false;
    reset(x.g, "انتخاب شرکت / ژنتیک");
    list.forEach(function (g) { addOption(x.g, g.name, g.id); });
    if (list.some(function (g) { return String(g.id) === String(old); })) x.g.value = old;
    x.s.disabled = true;
    reset(x.s, "ابتدا شرکت / ژنتیک را انتخاب کنید");
    if (x.p) { x.p.disabled = true; reset(x.p, "انتخاب استاندارد / برنامه"); }
    return true;
  }

  function fillStrains() {
    var x = els();
    if (!x.t || !x.g || !x.s) return false;
    var list = groups();
    var selected = list.find(function (g) { return String(g.id) === String(x.g.value); });
    var strains = selected && Array.isArray(selected.strains) ? selected.strains : [];
    x.s.disabled = false;
    reset(x.s, "انتخاب سویه / خط ژنتیکی");
    strains.forEach(function (s) { addOption(x.s, s, s); });
    if (x.p) { x.p.disabled = !x.g.value; reset(x.p, "انتخاب استاندارد / برنامه"); }
    return true;
  }

  function fillProgram() {
    var x = els();
    if (!x.p) return;
    x.p.disabled = !x.g || !x.g.value;
    reset(x.p, "انتخاب استاندارد / برنامه");
    if (x.g && x.g.value) {
      var company = x.g.options[x.g.selectedIndex] ? x.g.options[x.g.selectedIndex].textContent : x.g.value;
      var strain = x.s && x.s.value ? " — " + x.s.value : "";
      addOption(x.p, "استاندارد " + company + strain, productionKey(x.t.value) + "_" + x.g.value + "_" + (x.s && x.s.value || "default"));
    }
  }

  function sync() {
    var x = els();
    if (!x.t || !x.g || !x.s) return;
    if (!x.t.value) {
      x.g.disabled = false;
      reset(x.g, "ابتدا نوع پرورش را انتخاب کنید");
      x.s.disabled = true;
      reset(x.s, "ابتدا شرکت / ژنتیک را انتخاب کنید");
      if (x.p) { x.p.disabled = true; reset(x.p, "انتخاب استاندارد / برنامه"); }
      return;
    }
    var list = groups();
    x.g.disabled = false;
    var valid = list.some(function (g) { return String(g.id) === String(x.g.value); });
    if (x.g.options.length !== list.length + 1 || (!valid && x.g.value)) fillCompanies();
    if (!x.g.value) {
      if (x.g.options.length <= 1) fillCompanies();
      x.s.disabled = true;
      return;
    }
    fillStrains();
  }

  function bind() {
    var x = els();
    if (!x.t || !x.g || !x.s) return false;
    if (document.documentElement.dataset.finalGeneticsBound === "1") return true;
    document.documentElement.dataset.finalGeneticsBound = "1";

    document.addEventListener("change", function (ev) {
      if (ev.target === x.t) { ev.stopImmediatePropagation(); fillCompanies(); }
      else if (ev.target === x.g) { ev.stopImmediatePropagation(); fillStrains(); }
      else if (ev.target === x.s) { ev.stopImmediatePropagation(); fillProgram(); }
    }, true);

    var observer = new MutationObserver(function () { sync(); });
    [x.g, x.s, x.p].forEach(function (el) {
      if (el) observer.observe(el, { attributes: true, attributeFilter: ["disabled"], childList: true, subtree: true });
    });

    sync();
    var count = 0;
    var timer = setInterval(function () {
      sync();
      if (++count >= 80) clearInterval(timer);
    }, 100);
    return true;
  }

  function boot() {
    if (!bind()) setTimeout(boot, 100);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  window.AdineFinalGeneticsSelector = { sync: sync, companies: fillCompanies, strains: fillStrains, program: fillProgram };
})();
