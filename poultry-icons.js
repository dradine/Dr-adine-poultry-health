/* =========================================================
   ADINE POULTRY HEALTH CENTER
   PROFESSIONAL DUOTONE SVG ICON SYSTEM
   No emoji / no external icon library.
   ========================================================= */

(function () {

    "use strict";

    const ICON = {

        home: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M7 22 24 8l17 14v19H29V29H19v12H7z"/><path d="M7 22 24 8l17 14M11 20v21h26M19 41V29h10v12"/></svg>`,

        farm: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M5 22 24 8l19 14v19H5z"/><path d="M5 22 24 8l19 14M9 20v21h30M17 41V28h14v13M17 23h14"/><path d="M35 10v-4h5v8"/><path d="M37.5 28v7M34 31.5h7"/></svg>`,

        flock: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M5 23 24 11l19 12v17H5z"/><path d="M5 23 24 11l19 12M9 22v18h30M18 40V29h12v11"/><circle class="icon-fill" cx="17" cy="21" r="3.5"/><path d="M20.5 21 25 22.5 20.5 24"/><circle class="icon-fill" cx="30" cy="20" r="3.5"/><path d="M33.5 20 38 21.5 33.5 23"/></svg>`,

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

        weeklyReport: `<svg viewBox="0 0 48 48"><rect class="icon-fill" x="7" y="7" width="34" height="34" rx="5"/><path d="M7 17h34M15 5v6M33 5v6M14 24h5M22 24h5M30 24h4M14 31h5M22 31h5"/><path d="M14 36v-2M21 36v-6M28 36v-10M35 36v-14"/></svg>`,

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

        report: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M9 6h30v36H9z"/><path d="M9 6h30v36H9zM15 14h18M15 20h18M15 36V28h4v8M22 36V24h4v12M29 36V21h4v15"/></svg>`,

        archive: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M7 10h34v8H7zM10 18h28v22H10z"/><path d="M7 10h34v8H7zM10 18h28v22H10zM18 25h12M18 31h12M19 6h10"/></svg>`,

        health: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M24 5 40 11v12c0 10-7 17-16 20C15 40 8 33 8 23V11z"/><path d="M24 5 40 11v12c0 10-7 17-16 20C15 40 8 33 8 23V11zM24 15v16M16 23h16"/></svg>`,

        healthcare: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M8 12 24 6l16 6v11c0 9-6 15-16 19C14 38 8 32 8 23z"/><path d="M8 12 24 6l16 6v11c0 9-6 15-16 19C14 38 8 32 8 23zM24 14v16M16 22h16"/><path d="M31 32h8a3 3 0 0 0 0-6h-8a3 3 0 0 0 0 6zM34 26v6"/></svg>`,

        mortality: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M7 31c2-8 8-12 17-12s15 4 17 12v6H7z"/><circle class="icon-fill" cx="21" cy="12" r="7"/><path d="M7 37h34M21 5c-4 0-7 3-7 7s3 7 7 7M28 12l7 2-7 2"/><path d="M35 25v12M30 32l5 5 5-5"/></svg>`,

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

        professionals: `<svg viewBox="0 0 48 48"><circle class="icon-fill" cx="15" cy="13" r="6"/><path d="M6 38c1-8 4-12 9-12s8 4 9 12"/><path d="M19 21c7 0 12 4 13 11"/><path d="M28 15c4 0 7 3 7 7s-3 7-7 7"/><path d="M34 29c3 1 5 4 6 9"/><path class="icon-fill" d="M36 10h5v8h-5z"/><path d="M38.5 10V7h3v3"/></svg>`

        user: `
            <svg viewBox="0 0 48 48">
                <circle class="icon-fill" cx="24" cy="15" r="8"/>
                <path d="M9 42c1-9 7-14 15-14s14 5 15 14"/>
                <circle cx="24" cy="15" r="8"/>
            </svg>`

    };

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
