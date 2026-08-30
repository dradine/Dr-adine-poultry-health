/* =========================================================
   FLOCK GENETICS SELECTOR — COMPATIBILITY FIX V1 + FINAL UI PATCH
========================================================= */
(function () {
    "use strict";

    function catalogRoot() {
        try {
            if (typeof POULTRY_CATALOG !== "undefined") return POULTRY_CATALOG;
        } catch (e) {}
        return null;
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
        const group = getCatalogGenetics(type).find(item => String(item?.id ?? "") === String(geneticsId ?? ""));
        return Array.isArray(group?.strains) ? group.strains : [];
    }

    window.getGenetics = getCatalogGenetics;
    window.getStrains = getCatalogStrains;

    window.updateGenetics = function () {
        const type = document.getElementById("productionType")?.value || "";
        const genetics = document.getElementById("genetics");
        const strain = document.getElementById("flockStrain");
        const program = document.getElementById("flockProgram");
        if (!genetics || !strain || !program) return;

        genetics.innerHTML = '<option value="">انتخاب شرکت / ژنتیک</option>';
        strain.innerHTML = '<option value="">ابتدا شرکت / ژنتیک را انتخاب کنید</option>';
        program.innerHTML = '<option value="">انتخاب خودکار</option>';

        getCatalogGenetics(type).forEach(item => {
            const option = document.createElement("option");
            option.value = String(item.id);
            option.textContent = item.name;
            genetics.appendChild(option);
        });

        genetics.disabled = genetics.options.length <= 1;
        strain.disabled = true;
        program.disabled = true;
    };

    window.updatePrograms = function () {
        const type = document.getElementById("productionType")?.value || "";
        const geneticsId = document.getElementById("genetics")?.value || "";
        const genetics = document.getElementById("genetics");
        const strain = document.getElementById("flockStrain");
        const program = document.getElementById("flockProgram");
        if (!genetics || !strain || !program) return;

        strain.innerHTML = '<option value="">انتخاب سویه / خط ژنتیکی</option>';
        program.innerHTML = '<option value="">انتخاب استاندارد / برنامه</option>';

        if (!geneticsId) {
            strain.disabled = true;
            program.disabled = true;
            return;
        }

        const strains = getCatalogStrains(type, geneticsId);
        strains.forEach(item => {
            const option = document.createElement("option");
            option.value = String(item);
            option.textContent = String(item);
            strain.appendChild(option);
        });

        strain.disabled = strains.length === 0;
        program.disabled = false;

        const company = genetics.selectedOptions?.[0]?.textContent || geneticsId;
        const selectedStrain = strain.value || "";
        const option = document.createElement("option");
        option.value = `${normalizeType(type)}_${geneticsId}_${selectedStrain || "default"}`;
        option.textContent = `استاندارد ${company}${selectedStrain ? " — " + selectedStrain : ""}`;
        program.appendChild(option);
    };

    function installFinalSelectorFix() {
        const production = document.getElementById("productionType");
        const genetics = document.getElementById("genetics");
        const strain = document.getElementById("flockStrain");
        const program = document.getElementById("flockProgram");
        if (!production || !genetics || !strain || !program) return;

        // Remove only handlers installed by this fix, if initialization is retried.
        if (production.dataset.finalGeneticsFix === "1") return;
        production.dataset.finalGeneticsFix = "1";

        // Directly populate from the master catalog. This intentionally does
        // not call flocks.js' lexical updateGenetics/updatePrograms functions.
        const fillGenetics = () => {
            const type = normalizeType(production.value);
            const groups = getCatalogGenetics(type);
            genetics.innerHTML = '<option value="">انتخاب شرکت / ژنتیک</option>';
            strain.innerHTML = '<option value="">ابتدا شرکت / ژنتیک را انتخاب کنید</option>';
            program.innerHTML = '<option value="">انتخاب خودکار</option>';

            groups.forEach(group => {
                const o = document.createElement("option");
                o.value = String(group.id);
                o.textContent = String(group.name ?? group.id);
                genetics.appendChild(o);
            });

            genetics.disabled = groups.length === 0;
            strain.disabled = true;
            program.disabled = true;
        };

        const fillStrains = () => {
            const type = normalizeType(production.value);
            const groups = getCatalogGenetics(type);
            const group = groups.find(g => String(g.id) === String(genetics.value));
            const strains = Array.isArray(group?.strains) ? group.strains : [];

            strain.innerHTML = '<option value="">انتخاب سویه / خط ژنتیکی</option>';
            program.innerHTML = '<option value="">انتخاب استاندارد / برنامه</option>';

            strains.forEach(value => {
                const o = document.createElement("option");
                o.value = String(value);
                o.textContent = String(value);
                strain.appendChild(o);
            });

            strain.disabled = strains.length === 0;
            program.disabled = genetics.value === "";

            if (strains.length === 1) strain.value = String(strains[0]);
            fillProgram();
        };

        const fillProgram = () => {
            program.innerHTML = '<option value="">انتخاب استاندارد / برنامه</option>';
            if (!genetics.value) {
                program.disabled = true;
                return;
            }
            const company = genetics.selectedOptions?.[0]?.textContent || genetics.value;
            const selectedStrain = strain.value || "";
            const o = document.createElement("option");
            o.value = `${normalizeType(production.value)}_${genetics.value}_${selectedStrain || "default"}`;
            o.textContent = `استاندارد ${company}${selectedStrain ? " — " + selectedStrain : ""}`;
            program.appendChild(o);
            program.disabled = false;
        };

        production.addEventListener("change", fillGenetics);
        genetics.addEventListener("change", fillStrains);
        strain.addEventListener("change", fillProgram);

        // Initial state and recovery if another script reset the selects.
        fillGenetics();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", installFinalSelectorFix, { once: true });
    } else {
        installFinalSelectorFix();
    }
})();
