/* FINAL FLOCK GENETICS SELECTOR FIX
   Source of truth: POULTRY_CATALOG in standard-data.js
   This file deliberately owns the three dependent selects on flocks.html.
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
    const s = String(v ?? "").normalize("NFKC").trim().toLowerCase();
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
    const list = groups(e.type.value);
    const g = list.find(x => String(x.id) === String(e.company.value));
    const strains = Array.isArray(g && g.strains) ? g.strains : [];

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
    const company = e.company.selectedOptions && e.company.selectedOptions[0]
      ? e.company.selectedOptions[0].textContent : e.company.value;
    const strain = e.strain ? e.strain.value : "";
    e.program.appendChild(option("استاندارد " + company + (strain ? " — " + strain : ""),
      normType(e.type ? e.type.value : "") + "_" + e.company.value + "_" + (strain || "default")));
    e.program.disabled = false;
  }

  function install() {
    const e = els();
    if (!e.type || !e.company || !e.strain) return false;
    if (e.type.dataset.geneticsFinalFix === "1") return true;
    e.type.dataset.geneticsFinalFix = "1";

    /* Capture listeners run before the older flocks.js listeners and therefore
       keep the actual DOM selectors populated from the master catalog. */
    e.type.addEventListener("change", fillCompanies, true);
    e.company.addEventListener("change", fillStrains, true);
    e.strain.addEventListener("change", fillProgram, true);

    fillCompanies();
    return true;
  }

  /* flocks.js and this script are both loaded at the end of body. Retry briefly
     so async page initialization or another script cannot leave empty selects. */
  let tries = 0;
  function boot() {
    if (install()) return;
    if (++tries < 50) setTimeout(boot, 100);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else boot();

  window.AdineFinalGeneticsSelector = {
    refresh: fillCompanies,
    refreshStrains: fillStrains
  };
})();
