/* ADINEH — FLOCK GENETICS SELECTOR V2
   Definitive UI selector repair.
   The selector is intentionally independent from the older genetics helpers.
*/
(function () {
    "use strict";

    const FALLBACK_CATALOG = {
        broiler: [
            { id: "aviagen_ross", name: "Aviagen / Ross", strains: ["Ross 308", "Ross 308 FF", "Ross 708", "Ross 308 AP"] },
            { id: "cobb", name: "Cobb", strains: ["Cobb500", "Cobb800"] },
            { id: "aviagen_arbor", name: "Aviagen / Arbor Acres", strains: ["Arbor Acres Plus", "Arbor Acres Plus S"] },
            { id: "aviagen_indian", name: "Aviagen / Indian River", strains: ["Indian River", "Indian River FF"] },
            { id: "hubbard", name: "Hubbard", strains: ["Efficiency Plus", "Hubbard EDGE"] },
            { id: "arian", name: "آرین ایران", strains: ["Arian"] }
        ],
        layer: [
            { id: "lohmann", name: "Lohmann", strains: ["Lohmann Brown", "Lohmann LSL"] },
            { id: "hy_line", name: "Hy-Line", strains: ["Hy-Line W-80", "Hy-Line Brown"] },
            { id: "isa", name: "ISA", strains: ["ISA Brown", "ISA White"] },
            { id: "novogen", name: "Novogen", strains: ["Novogen Brown", "Novogen White"] }
        ],
        pullet: [
            { id: "lohmann", name: "Lohmann", strains: ["Lohmann Brown Pullet", "Lohmann LSL Pullet"] },
            { id: "hy_line", name: "Hy-Line", strains: ["Hy-Line Brown Pullet", "Hy-Line W-80 Pullet"] },
            { id: "isa", name: "ISA", strains: ["ISA Brown Pullet", "ISA White Pullet"] }
        ],
        breeder: [
            { id: "aviagen_ross", name: "Aviagen / Ross", strains: ["Ross 308 Parent Stock", "Ross 308 AP Parent Stock"] },
            { id: "cobb", name: "Cobb", strains: ["Cobb 500 Parent Stock"] },
            { id: "hubbard", name: "Hubbard", strains: ["Hubbard Parent Stock"] }
        ]
    };

    function normalizeType(value) {
        const s = String(value ?? "").normalize("NFKC").replace(/[\u200c\u200f\u202a-\u202e]/g, "").trim().toLowerCase();
        if (["broiler", "گوشتی"].includes(s)) return "broiler";
        if (["layer", "تخمگذار", "تخم گذار", "تخم‌گذار"].includes(s)) return "layer";
        if (["pullet", "پولت"].includes(s)) return "pullet";
        if (["breeder", "مادر", "مرغ مادر"].includes(s)) return "breeder";
        return s;
    }

    function catalog(type) {
        const key = normalizeType(type);
        try {
            if (typeof POULTRY_CATALOG !== "undefined" && Array.isArray(POULTRY_CATALOG?.[key]?.genetics)) {
                return POULTRY_CATALOG[key].genetics;
            }
        } catch (_) {}
        return FALLBACK_CATALOG[key] || [];
    }

    function fillGenetics() {
        const typeEl = document.getElementById("productionType");
        const geneticsEl = document.getElementById("genetics");
        const strainEl = document.getElementById("flockStrain");
        const programEl = document.getElementById("flockProgram");
        if (!typeEl || !geneticsEl || !strainEl || !programEl) return;

        const list = catalog(typeEl.value);
        geneticsEl.innerHTML = '<option value="">انتخاب شرکت / ژنتیک</option>';
        list.forEach(g => {
            const o = document.createElement("option");
            o.value = g.id;
            o.textContent = g.name;
            geneticsEl.appendChild(o);
        });

        geneticsEl.disabled = list.length === 0;
        strainEl.innerHTML = '<option value="">انتخاب سویه / خط ژنتیکی</option>';
        strainEl.disabled = true;
        programEl.innerHTML = '<option value="">انتخاب خودکار</option>';
        programEl.disabled = true;
    }

    function fillStrains() {
        const typeEl = document.getElementById("productionType");
        const geneticsEl = document.getElementById("genetics");
        const strainEl = document.getElementById("flockStrain");
        const programEl = document.getElementById("flockProgram");
        if (!typeEl || !geneticsEl || !strainEl || !programEl) return;

        const group = catalog(typeEl.value).find(g => String(g.id) === String(geneticsEl.value));
        const strains = Array.isArray(group?.strains) ? group.strains : [];

        strainEl.innerHTML = '<option value="">انتخاب سویه / خط ژنتیکی</option>';
        strains.forEach(s => {
            const o = document.createElement("option");
            o.value = s;
            o.textContent = s;
            strainEl.appendChild(o);
        });
        strainEl.disabled = strains.length === 0;

        programEl.innerHTML = '<option value="">انتخاب استاندارد / برنامه</option>';
        programEl.disabled = false;
        if (strains.length === 1) strainEl.value = strains[0];
        fillProgram();
    }

    function fillProgram() {
        const typeEl = document.getElementById("productionType");
        const geneticsEl = document.getElementById("genetics");
        const strainEl = document.getElementById("flockStrain");
        const programEl = document.getElementById("flockProgram");
        if (!typeEl || !geneticsEl || !strainEl || !programEl) return;
        if (!geneticsEl.value) {
            programEl.innerHTML = '<option value="">انتخاب خودکار</option>';
            programEl.disabled = true;
            return;
        }
        const group = catalog(typeEl.value).find(g => String(g.id) === String(geneticsEl.value));
        const company = group?.name || geneticsEl.value;
        const strain = strainEl.value;
        programEl.innerHTML = '<option value="">انتخاب استاندارد / برنامه</option>';
        const o = document.createElement("option");
        o.value = `${normalizeType(typeEl.value)}_${geneticsEl.value}_${strain || "default"}`;
        o.textContent = `استاندارد ${company}${strain ? " — " + strain : ""}`;
        programEl.appendChild(o);
        programEl.disabled = false;
    }

    function init() {
        const typeEl = document.getElementById("productionType");
        const geneticsEl = document.getElementById("genetics");
        const strainEl = document.getElementById("flockStrain");
        if (!typeEl || !geneticsEl || !strainEl) return;

        typeEl.addEventListener("change", fillGenetics, false);
        geneticsEl.addEventListener("change", fillStrains, false);
        strainEl.addEventListener("change", fillProgram, false);

        fillGenetics();

        // Expose the same names for other pages/modules, without replacing
        // the local functions in flocks.js.
        window.AdineFlockGeneticsSelector = { fillGenetics, fillStrains, fillProgram, catalog };
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
