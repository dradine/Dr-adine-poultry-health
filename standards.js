/* =========================================================
   ADINE POULTRY HEALTH CENTER
   STANDARDS COMPATIBILITY LAYER

   The authoritative numeric standard engine is standard-data.js.
   This file intentionally contains no duplicate catalog or curves.
========================================================= */
"use strict";


/* =========================================================
   RESOLVE POULTRY STANDARD
   ---------------------------------------------------------
   Compatibility resolver for real-world DB values:
   - accepts genetics id, company name, breed/strain aliases
   - resolves production type safely
   - resolves weight and FCR independently
   - never fabricates a genetic standard
   ========================================================= */

function normalizePoultryResolverText(value) {
    return String(value ?? "")
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[\u200c\u200f\u202a-\u202e]/g, "")
        .replace(/[‐‑‒–—−]/g, "-")
        .replace(/[._/\\]+/g, " ")
        .replace(/[^a-z0-9\u0600-\u06ff-]+/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizePoultryProductionType(value) {
    const v = normalizePoultryResolverText(value);
    if (["broiler", "broilers", "goshthi", "گوشتی"].includes(v)) return "broiler";
    if (["layer", "layers", "laying", "tخمگذار", "تخمگذار", "تخم گذار", "تخم‌گذار"].includes(v)) return "layer";
    if (["breeder", "breeders", "parent", "parent stock", "مادر", "مرغ مادر"].includes(v)) return "breeder";
    if (["pullet", "pullets", "پولت"].includes(v)) return "pullet";
    return v || "broiler";
}

const POULTRY_STANDARD_ALIAS_RULES = [
    {
        geneticsId: "aviagen_ross",
        strain: "Ross 308",
        aliases: [
            "ross 308", "ross308", "ross-308", "ross 308 ap", "ross308ap",
            "r308", "ross 308 ff", "ross308ff", "ross-308 ff",
            "aviagen ross", "ross", "aviagen ross 308"
        ]
    },
    {
        geneticsId: "cobb",
        strain: "Cobb500",
        aliases: [
            "cobb 500", "cobb500", "cobb-500", "cobb 500 ap",
            "cobb 500 broiler", "cobb"
        ]
    },
    {
        geneticsId: "hubbard",
        strain: "Efficiency Plus",
        aliases: [
            "hubbard efficiency plus", "hubbard plus", "hubbard eff plus",
            "efficiency plus", "hubbard"
        ]
    },
    {
        geneticsId: "hyline",
        strain: "W-80",
        aliases: [
            "hy line w 80", "hyline w80", "hyline w 80", "w80",
            "w-80", "hy line", "hyline"
        ]
    },
    {
        geneticsId: "lohmann",
        strain: "Lohmann Brown-Classic",
        aliases: [
            "lohmann brown", "lohmann brown classic", "lohmann brown-classic",
            "lohmann b", "lohmann"
        ]
    }
];

function findPoultryStandardIdentity(productionType, genetics, strain) {
    const type = normalizePoultryProductionType(productionType);
    const rawGenetics = normalizePoultryResolverText(genetics);
    const rawStrain = normalizePoultryResolverText(strain);
    const candidates = [rawStrain, rawGenetics].filter(Boolean);

    const catalog = typeof getCatalog === "function" ? getCatalog(type) : null;

    // 1) Exact catalog match (IDs and displayed strains).
    if (catalog) {
        const directGenetics = catalog.genetics.find(g =>
            normalizePoultryResolverText(g.id) === rawGenetics
        );
        if (directGenetics) {
            const exactStrain = directGenetics.strains.find(s =>
                normalizePoultryResolverText(s) === rawStrain
            );
            return {
                type,
                geneticsId: directGenetics.id,
                strain: exactStrain || directGenetics.strains[0] || ""
            };
        }

        const catalogMatch = catalog.genetics
            .flatMap(g => g.strains.map(s => ({ geneticsId: g.id, strain: s })))
            .find(item => candidates.some(c =>
                normalizePoultryResolverText(item.strain) === c
            ));
        if (catalogMatch) {
            const catalogOfficial =
                typeof VERIFIED_STANDARDS !== "undefined" &&
                VERIFIED_STANDARDS[type]?.[catalogMatch.geneticsId]?.[catalogMatch.strain];
            if (catalogOfficial) return { type, ...catalogMatch };
        }
    }

    // 2) Controlled aliases. Aliases never invent a new numeric curve;
    //    they only point to a curve that exists in VERIFIED_STANDARDS.
    for (const rule of POULTRY_STANDARD_ALIAS_RULES) {
        if (rule.aliases.some(a => candidates.includes(normalizePoultryResolverText(a)))) {
            const exists =
                typeof VERIFIED_STANDARDS !== "undefined" &&
                VERIFIED_STANDARDS[type]?.[rule.geneticsId]?.[rule.strain];
            if (exists) {
                return { type, geneticsId: rule.geneticsId, strain: rule.strain };
            }
        }
    }

    // 3) Safe substring recognition only for unambiguous canonical tokens.
    const joined = candidates.join(" ");
    const fallbackRules = [
        ["ross", "aviagen_ross", "Ross 308"],
        ["cobb", "cobb", "Cobb500"],
        ["hubbard", "hubbard", "Efficiency Plus"],
        ["w 80", "hyline", "W-80"],
        ["w80", "hyline", "W-80"]
    ];
    for (const [token, geneticsId, canonicalStrain] of fallbackRules) {
        if (joined.includes(token)) {
            const exists =
                typeof VERIFIED_STANDARDS !== "undefined" &&
                VERIFIED_STANDARDS[type]?.[geneticsId]?.[canonicalStrain];
            if (exists) return { type, geneticsId, strain: canonicalStrain };
        }
    }

    return { type, geneticsId: String(genetics || "").trim(), strain: String(strain || "").trim() };
}

function resolvePoultryStandard({ productionType, breed = "", strain = "", genetics = "" , ageDays }) {
    const type = normalizePoultryProductionType(productionType);
    const breedText = breed || genetics || "";
    const identity = findPoultryStandardIdentity(type, breedText, strain);
    const age = Number(ageDays);

    const result = {
        weight: null,
        fcr: null,
        weightSource: null,
        fcrSource: null,
        weightSourceLabel: null,
        fcrSourceLabel: null,
        sourceType: null,
        sourceName: null,
        confidence: "none",
        fallbackLevel: 3,
        weightFallbackLevel: 3,
        fcrFallbackLevel: 3,
        geneticsId: identity.geneticsId || null,
        strain: identity.strain || null
    };

    if (!Number.isFinite(age)) return result;

    const standard = typeof getStandard === "function"
        ? getStandard(type, identity.geneticsId, identity.strain)
        : null;

    const resolveMetric = metric => {
        if (!standard || typeof getStandardMeta !== "function") return null;
        const meta = getStandardMeta(standard, metric, age);
        if (!meta || meta.value == null || !Number.isFinite(Number(meta.value))) return null;

        const official = meta.sourceType && meta.sourceType !== "management-standard";
        return {
            value: Number(meta.value),
            sourceType: meta.sourceType,
            sourceLabel: meta.sourceLabel,
            fallbackLevel: official ? 0 : 2,
            confidence: official ? "official" : "management"
        };
    };

    const w = resolveMetric("bodyWeight");
    const f = resolveMetric("fcr");

    if (w) {
        result.weight = w.value;
        result.weightSource = w.sourceType;
        result.weightSourceLabel = w.sourceLabel;
        result.weightFallbackLevel = w.fallbackLevel;
    }
    if (f) {
        result.fcr = f.value;
        result.fcrSource = f.sourceType;
        result.fcrSourceLabel = f.sourceLabel;
        result.fcrFallbackLevel = f.fallbackLevel;
    }

    // Backward-compatible aggregate fields.
    const levels = [result.weightFallbackLevel, result.fcrFallbackLevel];
    result.fallbackLevel = Math.min(...levels);
    const sources = [result.weightSource, result.fcrSource].filter(Boolean);
    const labels = [result.weightSourceLabel, result.fcrSourceLabel].filter(Boolean);
    result.sourceType = sources.length === 2 && sources[0] === sources[1] ? sources[0] : (sources[0] || sources[1] || null);
    result.sourceName = labels.length === 2 && labels[0] === labels[1] ? labels[0] : (labels[0] || labels[1] || null);
    result.confidence = result.fallbackLevel === 0 ? "official" : result.fallbackLevel === 2 ? "management" : "none";

    return result;
}

if (typeof window !== "undefined") {
    window.normalizePoultryProductionType = normalizePoultryProductionType;
    window.findPoultryStandardIdentity = findPoultryStandardIdentity;
    window.resolvePoultryStandard = resolvePoultryStandard;
}

if (typeof window !== "undefined") {
    window.ADINE_STANDARDS_ENGINE_VERSION = "3.0-2026";

    if (typeof window.getStandard !== "function" && typeof getStandard === "function") {
        window.getStandard = getStandard;
    }

    if (typeof window.getStandardMeta !== "function" && typeof getStandardMeta === "function") {
        window.getStandardMeta = getStandardMeta;
    }

    if (typeof window.getStandardValueAtAge !== "function" && typeof getStandardValueAtAge === "function") {
        window.getStandardValueAtAge = getStandardValueAtAge;
    }
}
