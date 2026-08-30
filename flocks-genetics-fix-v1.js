/* =========================================================
   FLOCK GENETICS SELECTOR — COMPATIBILITY FIX V1
   Fixes the selector returning no genetics/strains after the
   catalog was moved to standard-data.js.
========================================================= */
(function () {
    "use strict";

    function catalogRoot() {
        // standard-data.js declares POULTRY_CATALOG as a global lexical
        // binding, so prefer the direct binding over window.POULTRY_CATALOG.
        try {
            if (typeof POULTRY_CATALOG !== "undefined") return POULTRY_CATALOG;
        } catch (e) {}
        return window.POULTRY_CATALOG || null;
    }

    function normalizeType(value) {
        const raw = String(value ?? "").normalize("NFKC").trim().toLowerCase();
        const map = {
            "گوشتی": "broiler",
            "تخمگذار": "layer",
            "تخم گذار": "layer",
            "تخم‌گذار": "layer",
            "پولت": "pullet",
            "مادر": "breeder",
            "مرغ مادر": "breeder"
        };
        return map[raw] || raw;
    }

    function getCatalogGenetics(type) {
        const root = catalogRoot();
        const entry = root && root[normalizeType(type)];
        return Array.isArray(entry?.genetics) ? entry.genetics : [];
    }

    function getCatalogStrains(type, geneticsId) {
        const group = getCatalogGenetics(type).find(
            item => String(item?.id ?? "") === String(geneticsId ?? "")
        );
        return Array.isArray(group?.strains) ? group.strains : [];
    }

    // Keep compatibility with older pages that expect these helpers.
    if (typeof window.getGenetics !== "function") {
        window.getGenetics = getCatalogGenetics;
    }
    if (typeof window.getStrains !== "function") {
        window.getStrains = getCatalogStrains;
    }

    // flocks.js resolves these functions at initialization time. Re-define
    // them here so the existing event wiring uses the corrected catalog path.
    window.updateGenetics = function updateGeneticsFixed() {
        const type = typeof getValue === "function" ? getValue("productionType") : document.getElementById("productionType")?.value || "";
        const genetics = document.getElementById("genetics");
        const strain = document.getElementById("flockStrain");
        const program = document.getElementById("flockProgram");
        if (!genetics || !strain || !program) return;

        genetics.innerHTML = '<option value="">انتخاب شرکت / ژنتیک</option>';
        strain.innerHTML = '<option value="">انتخاب سویه / خط ژنتیکی</option>';
        program.innerHTML = '<option value="">انتخاب خودکار</option>';

        const catalog = getCatalogGenetics(type);
        catalog.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.name;
            genetics.appendChild(option);
        });

        genetics.disabled = catalog.length === 0;
        strain.disabled = true;
        program.disabled = true;
    };

    window.updatePrograms = function updateProgramsFixed() {
        const type = typeof getValue === "function" ? getValue("productionType") : document.getElementById("productionType")?.value || "";
        const geneticsId = typeof getValue === "function" ? getValue("genetics") : document.getElementById("genetics")?.value || "";
        const genetics = document.getElementById("genetics");
        const strain = document.getElementById("flockStrain");
        const program = document.getElementById("flockProgram");
        if (!genetics || !strain || !program) return;

        strain.innerHTML = '<option value="">انتخاب سویه / خط ژنتیکی</option>';
        program.innerHTML = '<option value="">انتخاب خودکار</option>';

        if (!geneticsId) {
            strain.disabled = true;
            program.disabled = true;
            return;
        }

        const strains = getCatalogStrains(type, geneticsId);
        strains.forEach(item => {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            strain.appendChild(option);
        });

        strain.disabled = strains.length === 0;
        program.disabled = false;

        if (strains.length === 1) strain.value = strains[0];
        window.updateStrainProgram();
    };

    window.updateStrainProgram = function updateStrainProgramFixed() {
        const type = typeof getValue === "function" ? getValue("productionType") : document.getElementById("productionType")?.value || "";
        const geneticsId = typeof getValue === "function" ? getValue("genetics") : document.getElementById("genetics")?.value || "";
        const strainValue = typeof getValue === "function" ? getValue("flockStrain") : document.getElementById("flockStrain")?.value || "";
        const genetics = document.getElementById("genetics");
        const program = document.getElementById("flockProgram");
        if (!program) return;

        program.innerHTML = '<option value="">انتخاب استاندارد / برنامه</option>';
        if (!geneticsId) {
            program.disabled = true;
            return;
        }

        const company = genetics?.selectedOptions?.[0]?.textContent || geneticsId;
        const option = document.createElement("option");
        option.value = `${normalizeType(type)}_${geneticsId}_${strainValue || "default"}`;
        option.textContent = `استاندارد ${company}${strainValue ? " — " + strainValue : ""}`;
        program.appendChild(option);
        program.disabled = false;
    };

    // Replace setup so the change handlers always point to the fixed functions.
    window.setupGenetics = function setupGeneticsFixed() {
        const production = document.getElementById("productionType");
        const genetics = document.getElementById("genetics");
        const strain = document.getElementById("flockStrain");
        if (!production || !genetics || !strain) return;

        production.addEventListener("change", window.updateGenetics);
        genetics.addEventListener("change", window.updatePrograms);
        strain.addEventListener("change", window.updateStrainProgram);
        window.updateGenetics();
    };
})();
