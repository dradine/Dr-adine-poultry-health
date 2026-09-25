/* =========================================================
   ADINE POULTRY HEALTH CENTER
   PROFESSIONAL POULTRY LINE-ART SVG ICON SYSTEM
   No emoji / no external icon library.
   ========================================================= */

(function () {

    "use strict";

    const ICON = {

        home: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M7 22 24 8l17 14v19H29V29H19v12H7z"/><path d="M7 22 24 8l17 14M11 20v21h26M19 41V29h10v12"/></svg>`,

        farm: `
            <svg viewBox="0 0 24 24">
                <path d="M8 14V4.5a2.5 2.5 0 0 0-5 0V14M8 8l6-5 8 6M20 5v10M12 10h4v4h-4zM2 14h20M2 22l5-8m0 8 5-8m10 8H12l5-8m-2 4h7"/>
            </svg>`,

        flock: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M9 37c1-8 6-13 13-13s12 5 13 13z"/>
                <circle class="icon-fill" cx="22" cy="15" r="7"/>
                <path d="M9 37c1-8 6-13 13-13s12 5 13 13M15 15c0-4 3-7 7-7s7 3 7 7M29 15l8 2-8 2M19 35v6M25 35v6"/>
                <circle class="icon-fill" cx="36" cy="32" r="5"/>
                <path d="M36 29v6M33 32h6"/>
            </svg>`,

        broiler: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M11 38c1-9 6-14 14-14 8 0 13 5 14 14z"/>
                <circle class="icon-fill" cx="25" cy="16" r="8"/>
                <path d="M11 38c1-9 6-14 14-14 8 0 13 5 14 14M17 16c0-5 3-8 8-8s8 3 8 8"/>
                <path d="m33 16 7 2-7 2M22 36v5M29 36v5"/>
            </svg>`,

        layer: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M8 38c2-8 7-12 16-12s14 4 16 12z"/>
                <circle class="icon-fill" cx="24" cy="15" r="8"/>
                <path d="M8 38c2-8 7-12 16-12s14 4 16 12M16 15c0-5 3-8 8-8s8 3 8 8"/>
                <path d="m32 15 7 2-7 2M21 36v5M29 36v5"/>
            </svg>`,

        pullet: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M10 39c2-7 7-11 14-11s12 4 14 11z"/>
                <circle class="icon-fill" cx="24" cy="17" r="7"/>
                <path d="M10 39c2-7 7-11 14-11s12 4 14 11M17 17c0-4 3-7 7-7s7 3 7 7"/>
                <path d="m30 17 7 2-7 2M21 37v4M27 37v4"/>
            </svg>`,

        breeder: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M8 40c2-9 8-14 16-14s14 5 16 14z"/>
                <circle class="icon-fill" cx="24" cy="15" r="9"/>
                <path d="M8 40c2-9 8-14 16-14s14 5 16 14M15 15c0-5 4-9 9-9s9 4 9 9"/>
                <path d="m33 15 7 2-7 2M20 37v4M28 37v4"/>
            </svg>`,

        weeklyReport: `
            <svg viewBox="0 0 24 24">
                <path d="M14 3v4a1 1 0 0 0 1 1h4M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2M10 18l5-5a1.414 1.414 0 0 0-2-2l-5 5v2z"/>
            </svg>`,

        scale: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M9 8h30v32H9z"/><path d="M9 8h30v32H9zM15 15h18M15 21h10"/><path d="M15 34v-7h5v7M23 34v-11h5v11M31 34v-16h4v16M14 37h22"/></svg>`,

        uniformity: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M7 37V11h34v26z"/>
                <path d="M7 37V11h34v26zM13 31l7-8 6 5 9-12"/>
                <circle cx="13" cy="31" r="2" fill="currentColor" stroke="none"/>
                <circle cx="20" cy="23" r="2" fill="currentColor" stroke="none"/>
                <circle cx="26" cy="28" r="2" fill="currentColor" stroke="none"/>
                <circle cx="35" cy="16" r="2" fill="currentColor" stroke="none"/>
            </svg>`,

        vaccine: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="m29 7 12 12-17 17-9-9z"/><path d="m29 7 12 12-17 17-9-9zM20 14l14 14M16 27 9 40M8 40h12M34 12l5-5M29 19l-4 4"/></svg>`,

        medicine: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M17 10a7 7 0 0 1 10 0l11 11a7 7 0 0 1-10 10L17 20a7 7 0 0 1 0-10z"/><path d="M17 10a7 7 0 0 1 10 0l11 11a7 7 0 0 1-10 10L17 20a7 7 0 0 1 0-10zM13 14l21 21M22 19l7-7"/></svg>`,

        water: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M24 7S11 21 11 30a13 13 0 0 0 26 0C37 21 24 7 24 7z"/>
                <path d="M24 7S11 21 11 30a13 13 0 0 0 26 0C37 21 24 7 24 7z"/>
                <path d="M18 30c1 4 4 6 8 6"/>
            </svg>`,

        feed: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M8 20h32v20H8zM8 20l5-10h22l5 10z"/>
                <path d="M8 20h32v20H8zM8 20l5-10h22l5 10z"/>
                <path d="M15 27c4-4 7 4 11 0s7 4 11 0M19 15h10"/>
            </svg>`,

        report: `
            <svg viewBox="0 0 48 48">
                <path d="M12 7h18l8 8v26H12zM30 7v9h8M18 32l5-6 5 4 7-9"/>
                <path d="M18 37h19"/>
            </svg>`,

        archive: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M7 10h34v8H7zM10 18h28v22H10z"/><path d="M7 10h34v8H7zM10 18h28v22H10zM18 25h12M18 31h12M19 6h10"/></svg>`,

        health: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M24 5 40 11v12c0 10-7 17-16 20C15 40 8 33 8 23V11z"/><path d="M24 5 40 11v12c0 10-7 17-16 20C15 40 8 33 8 23V11zM24 15v16M16 23h16"/></svg>`,

        healthcare: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M9 10h22v27H9z"/>
                <path d="M9 10h22v27H9zM14 15h12M14 21h12M14 27h7"/>
                <path d="m29 28 8-8M34 25l-5-5M36 16l4 4M38 13l3 3M28 31l4 4"/>
            </svg>`,

        mortality: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M9 37c1-8 6-13 13-13s12 5 13 13z"/>
                <circle class="icon-fill" cx="22" cy="15" r="7"/>
                <path d="M9 37c1-8 6-13 13-13s12 5 13 13M15 15c0-4 3-7 7-7s7 3 7 7M29 15l8 2-8 2M19 35v6M25 35v6"/>
                <path class="icon-fill" d="m37 4 9 16H28z"/>
                <path d="m37 4 9 16H28zM37 9v5M37 17h.01"/>
            </svg>`,

        calendar: `
            <svg viewBox="0 0 48 48">
                <rect class="icon-fill" x="7" y="9" width="34" height="33" rx="5"/>
                <path d="M7 18h34M15 5v8M33 5v8M15 24h4M22 24h4M29 24h4M15 31h4M22 31h4M29 31h4"/>
            </svg>`,

        analysis: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M7 41h34V9z"/>
                <path d="M7 41h34M10 34l9-11 7 6 12-16"/>
                <circle cx="10" cy="34" r="2" fill="currentColor" stroke="none"/>
                <circle cx="19" cy="23" r="2" fill="currentColor" stroke="none"/>
                <circle cx="26" cy="29" r="2" fill="currentColor" stroke="none"/>
                <circle cx="38" cy="13" r="2" fill="currentColor" stroke="none"/>
            </svg>`,

        warning: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="m24 6 20 36H4z"/>
                <path d="m24 6 20 36H4zM24 17v11"/>
                <circle cx="24" cy="34" r="1.7" fill="currentColor" stroke="none"/>
            </svg>`,

        settings: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="m24 7 4 2 5-1 3 4-1 5 3 4-1 5-3 3 1 5-4 3-5-1-4 3-5-2-2-5-4-3 1-5-2-4 3-4 5-1 3-4z"/><circle cx="24" cy="24" r="6"/><path d="M24 7v4M24 37v4M7 24h4M37 24h4"/></svg>`,

        logout: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M8 6h12v36H8z"/>
                <path d="M20 6H8v36h12M29 16l9 8-9 8M17 24h21"/>
            </svg>`,

        check: `
            <svg viewBox="0 0 48 48">
                <circle class="icon-fill" cx="24" cy="24" r="17"/>
                <path d="m15 24 6 6 13-14"/>
            </svg>`,

        accounting: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M9 7h23a3 3 0 0 1 3 3v31H12a3 3 0 0 1-3-3z"/><path d="M9 7h23a3 3 0 0 1 3 3v31H12a3 3 0 0 1-3-3zM14 14h14M14 20h9M14 26h6M26 41V31h5v10M32 41V25h5v16M38 41V19h3v22M12 41h29"/></svg>`,

        professionals: `
            <svg viewBox="0 0 48 48">
                <circle class="icon-fill" cx="22" cy="13" r="7"/>
                <path d="M9 39c1-8 6-13 13-13s12 5 13 13M15 13c0-4 3-7 7-7s7 3 7 7"/>
                <path d="M31 27h7v12h-7zM34.5 29v8M31 33h7"/>
                <path d="M35 20v6M31 23h8"/>
            </svg>`,

        user: `
            <svg viewBox="0 0 48 48">
                <circle class="icon-fill" cx="24" cy="15" r="8"/>
                <path d="M9 42c1-9 7-14 15-14s14 5 15 14"/>
                <circle cx="24" cy="15" r="8"/>
            </svg>`

    };

    /* FINAL UNIFIED DASHBOARD ICON SET — single source of truth */
    ICON.home='<svg viewBox="0 0 48 48"><path d="M6 22 24 7l18 15"/><path d="M10 20v21h28V20"/><path d="M19 41V29h10v12"/><path d="M15 25h5M28 25h5"/></svg>';
    ICON.accounting='<svg viewBox="0 0 48 48"><path d="M9 7h23a3 3 0 0 1 3 3v31H12a3 3 0 0 1-3-3z"/><path d="M15 14h13M15 20h9M15 26h6"/><path d="M25 41V31h5v10M32 41V25h5v16M39 41V19h3v22M12 41h30"/></svg>';
    ICON.professionals='<svg viewBox="0 0 48 48"><circle cx="20" cy="13" r="7"/><path d="M8 39c1-8 6-13 12-13s11 5 12 13"/><path d="M31 24h8v14h-8zM35 27v8M32 31h6"/><path d="M35 17v6M32 20h6"/></svg>';
    ICON.farm='<svg class="adi-farm-detailed" viewBox="0 0 96 48"><path d="M4 24 24 10l68 6v25H4z"/><path d="M4 24 24 10l68 6"/><path d="M24 10v31M24 16h68"/><path d="M10 28h10v9H10zM30 28h10v9H30zM45 25h45v10H45z"/><path d="M48 25v10M60 25v10M72 25v10M84 25v10"/><path d="M8 41h84"/><path d="M18 21v-5h6v5M35 16v-5h6v5M52 17v-5h6v5M69 18v-5h6v5M86 20v-5h6v5"/></svg>';
    ICON.flock='<svg viewBox="0 0 96 48"><path d="M7 23 48 7l41 16M14 21v22M82 21v22M22 25h52M22 25v16M74 25v16M22 41h52"/><path d="M36 32c0-5 3-8 7-8 4 0 7 3 7 8 0 4-3 7-7 7h-4l-3 2 1-4c-1-1-1-3-1-5z"/><circle cx="45" cy="28" r="1"/><path d="M50 30l5 2-5 2M39 38v3M47 38v3"/><ellipse cx="77" cy="37" rx="4" ry="5"/><ellipse cx="86" cy="37" rx="4" ry="5"/><path d="M10 43h78"/></svg>';
    ICON.weeklyReport='<svg viewBox="0 0 48 48"><path d="M12 6h20l7 7v29H12zM32 6v8h7"/><path d="M18 21h16M18 27h12M18 37l6-7 5 4 8-9"/></svg>';
    ICON.healthcare='<svg viewBox="0 0 48 48"><path d="M10 16h28v25H10zM16 16v-4a8 8 0 0 1 16 0v4"/><path d="M17 28h7M20.5 24.5v7M29 25h5M29 31h5"/></svg>';
    ICON.mortality='<svg viewBox="0 0 48 48"><circle cx="17" cy="16" r="6"/><path d="M7 37c1-7 5-11 10-11s9 4 10 11M12 16c0-4 2-6 5-6s5 2 5 6M22 16l6 2-6 2"/><path d="M35 6 45 23H25zM35 11v6M35 20h.01"/></svg>';
    ICON.report='<svg viewBox="0 0 48 48"><path d="M10 7h21l7 7v27H10zM31 7v8h7"/><path d="M16 21h15M16 27h10M16 37l5-6 5 4 7-9"/></svg>';
    ICON.archive='<svg viewBox="0 0 48 48"><path d="M7 10h34v8H7zM10 18h28v22H10zM18 25h12M18 31h12M19 6h10"/></svg>';
    ICON.settings='<svg viewBox="0 0 48 48"><path d="m20 7 4 3 4-3 4 4 5-1 1 6 4 3-3 5 3 5-4 3-1 6-5-1-4 4-4-3-5 1-1-6-4-3 3-5-3-5 4-3 1-6 5 1z"/><circle cx="24" cy="24" r="7"/><circle cx="24" cy="24" r="2"/></svg>';
    ICON.scale='<svg viewBox="0 0 48 48"><path d="M8 8h32v32H8z"/><path d="M14 15h20M14 21h12M15 36V27h5v9M23 36V23h5v13M31 36V18h4v18M13 39h24"/></svg>';
    ICON.logout='<svg viewBox="0 0 48 48"><path class="icon-fill" d="M8 6h12v36H8z"/><path d="M20 6H8v36h12M29 16l9 8-9 8M17 24h21"/></svg>';

    const EMOJI_MAP = {
        "ð ": "home",
        "ð­": "farm",
        "ð": "flock",
        "ð£": "pullet",
        "ð¥": "layer",
        "âï¸": "scale",
        "â": "scale",
        "ð": "vaccine",
        "ð": "medicine",
        "ð§": "water",
        "ð¾": "feed",
        "ð": "report",
        "ðï¸": "archive",
        "ð": "archive",
        "ð": "archive",
        "ð©º": "health",
        "âï¸": "settings",
        "â": "settings",
        "ð": "calendar",
        "ð": "analysis",
        "â ï¸": "warning",
        "â ": "warning",
        "ðª": "logout",
        "â": "check",
        "â": "check",
        "ð¤": "user"
    };

    function make(name, className) {

        if (!ICON[name]) {
            return "";
        }

        return `
            <span
                class="adi-svg-icon ${className || ""}"
                aria-hidden="true"
            >${ICON[name]}</span>
        `;

    }

    function replaceElement(element) {

        if (!element || element.classList.contains("adi-icon-ready")) {
            return;
        }

        let iconName =
            element.dataset?.icon || null;

        if (!iconName) {

            const text =
                element.textContent || "";

            for (const emoji in EMOJI_MAP) {

                if (text.includes(emoji)) {
                    iconName = EMOJI_MAP[emoji];
                    break;
                }

            }

        }

        if (!iconName || !ICON[iconName]) {
            return;
        }

        if (element.classList.contains("menu-icon")) {

            element.innerHTML =
                make(iconName, "adi-menu-svg");

            element.classList.add("adi-icon-ready");
            return;

        }

        if (element.classList.contains("status-icon")) {

            element.innerHTML =
                make(iconName, "adi-status-svg");

            element.classList.add("adi-icon-ready");
            return;

        }

        if (element.closest(".bottom-nav")) {

            const small =
                element.querySelector("small");

            const label =
                small ? small.outerHTML : "";

            element.innerHTML =
                make(iconName, "adi-bottom-svg") +
                label;

            element.classList.add("adi-icon-ready");
            return;
        }

        /* Generic data-icon element, e.g. logout/status controls */
        if (element.dataset?.icon) {

            element.innerHTML =
                make(iconName, "adi-generic-svg");

            element.classList.add("adi-icon-ready");
        }

    }

    function scan(root = document) {

        root
            .querySelectorAll(
                ".menu-icon:not(.adi-icon-ready), " +
                ".bottom-nav button:not(.adi-icon-ready), " +
                ".bottom-nav a:not(.adi-icon-ready), " +
                ".status-icon:not(.adi-icon-ready), " +
                "[data-icon]:not(.adi-icon-ready)"
            )
            .forEach(replaceElement);

    }

    window.AdiPoultryIcons = {
        make,
        scan,
        ICON
    };

    function start() {

        scan();

        const observer =
            new MutationObserver(
                (mutations) => {

                    let shouldScan = false;

                    for (const mutation of mutations) {

                        if (mutation.type !== "childList") {
                            continue;
                        }

                        if (
                            mutation.target &&
                            mutation.target.closest &&
                            mutation.target.closest(".adi-svg-icon")
                        ) {
                            continue;
                        }

                        shouldScan = true;
                        break;

                    }

                    if (shouldScan) {
                        scan();
                    }

                }
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

})();
