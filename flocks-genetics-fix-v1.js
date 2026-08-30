/* FINAL FLOCK GENETICS SELECTOR FIX
   Source of truth: POULTRY_CATALOG in standard-data.js.
   This file owns the three dependent selectors on flocks.html and blocks
   older selector handlers from overwriting them.
*/
(function () {
  "use strict";

  function rootCatalog() {
    try {
      if (typeof POULTRY_CATALOG !== "undefined" && POULTRY_CATALOG) return POULTRY_CATALOG;
    } catch (_) {}
    return null;
  }

  function normType(v) {
    const s = String(v ?? "").normalize("NFKC").replace(/[\u200c\u200f\u202a-\u202e]/g, "").trim().toLowerCase();
    return ({
      "گوشتی":"broiler", "broiler":"broiler",
      "تخمگذار":"layer", "تخم گذار":"layer", "تخم‌گذار":"layer", "layer":"layer",
      "پولت":"pullet", "pullet":"pullet",
      "مادر":"breeder", "مرغ مادر":"breeder", "breeder":"breeder"
    })[s] || s;
  }

  function groups(type) {
    const c = rootCatalog();
    const g = c && c[normType(type)] && c[normType(type)].genetics;
    return Array.isArray(g) ? g : [];
  }

  function els() {
    return {
      type: document.getElementById("productionType"),
      company: document.getElementById("genetics"),
      strain: document.getElementById("flockStrain"),
      program: document.getElementById("flockProgram")
    };
  }

  function option(text, value) {
    const o = document.createElement("option");
    o.value = String(value ?? "");
    o.textContent = String(text ?? "");
    return o;
  }

  function fillCompanies() {
    const e = els();
    if (!e.type || !e.company || !e.strain) return;
    const list = groups(e.type.value);

    e.company.innerHTML = "";
    e.company.appendChild(option("انتخاب شرکت / ژنتیک", ""));
    list.forEach(g => e.company.appendChild(option(g.name, g.id)));

    e.strain.innerHTML = "";
    e.strain.appendChild(option("ابتدا شرکت / ژنتیک را انتخاب کنید", ""));
    e.company.disabled = false;
    e.strain.disabled = true;
    if (e.program) {
      e.program.innerHTML = "";
      e.program.appendChild(option("انتخاب استاندارد / برنامه", ""));
      e.program.disabled = true;
    }
  }

  function fillStrains() {
    const e = els();
    if (!e.type || !e.company || !e.strain) return;
    const g = groups(e.type.value).find(x => String(x.id) === String(e.company.value));
    const strains = Array.isArray(g?.strains) ? g.strains : [];

    e.strain.innerHTML = "";
    e.strain.appendChild(option("انتخاب سویه / خط ژنتیکی", ""));
    strains.forEach(s => e.strain.appendChild(option(s, s)));
    e.strain.disabled = strains.length === 0;

    if (e.program) {
      e.program.innerHTML = "";
      e.program.appendChild(option("انتخاب استاندارد / برنامه", ""));
      e.program.disabled = !e.company.value;
      if (e.company.value) fillProgram();
    }
  }

  function fillProgram() {
    const e = els();
    if (!e.program || !e.company) return;
    e.program.innerHTML = "";
    e.program.appendChild(option("انتخاب استاندارد / برنامه", ""));
    if (!e.company.value) { e.program.disabled = true; return; }
    const company = e.company.selectedOptions?.[0]?.textContent || e.company.value;
    const strain = e.strain?.value || "";
    e.program.appendChild(option(
      "استاندارد " + company + (strain ? " — " + strain : ""),
      normType(e.type?.value) + "_" + e.company.value + "_" + (strain || "default")
    ));
    e.program.disabled = false;
  }

  function install() {
    const e = els();
    if (!e.type || !e.company || !e.strain) return false;
    if (e.type.dataset.geneticsFinalFix === "1") return true;
    e.type.dataset.geneticsFinalFix = "1";

    /* The previous versions added normal/bubble listeners in flocks.js,
       genetics-ui.js and selector-v2. Those handlers were overwriting the
       values produced here. Capture + stopImmediatePropagation makes this
       selector the single owner of these three controls. */
    e.type.addEventListener("change", function (ev) {
      ev.stopImmediatePropagation();
      fillCompanies();
    }, true);
    e.company.addEventListener("change", function (ev) {
      ev.stopImmediatePropagation();
      fillStrains();
    }, true);
    e.strain.addEventListener("change", function (ev) {
      ev.stopImmediatePropagation();
      fillProgram();
    }, true);

    fillCompanies();
    return true;
  }

  let tries = 0;
  function boot() {
    if (install()) return;
    if (++tries < 100) setTimeout(boot, 100);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else boot();

  window.AdineFinalGeneticsSelector = { refresh: fillCompanies, refreshStrains: fillStrains };
})();
