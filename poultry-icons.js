/* =========================================================
   ADINE POULTRY HEALTH CENTER
   PROFESSIONAL DUOTONE SVG ICON SYSTEM
   No emoji / no external icon library.
   ========================================================= */

(function () {

    "use strict";

    const ICON = {

        home: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M7 22 24 8l17 14v19H29V29H19v12H7z"/><path d="M7 22 24 8l17 14M11 20v21h26M19 41V29h10v12"/></svg>`,

        farm: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M6 21 24 9l18 12v20H6z"/><path d="M6 21 24 9l18 12M10 20v21h28M18 41V27h12v14M18 22h12"/></svg>`,

        flock: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M6 21 24 9l18 12v20H6z"/><path d="M6 21 24 9l18 12M10 20v21h28M18 41V29h12v12M18 22h12"/><circle class="icon-fill" cx="34" cy="17" r="4"/><path d="M38 17l5 1.5-5 1.5"/></svg>`,

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

        scale: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M9 13h30l-5 12H14z"/><path d="M9 13h30l-5 12H14zM24 7v29M14 42h20M18 38h12M18 13a6 6 0 0 1 12 0M11 25h26"/></svg>`,

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

        health: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M24 6 40 12v11c0 10-7 16-16 19C15 39 8 33 8 23V12z"/><path d="M24 6 40 12v11c0 10-7 16-16 19C15 39 8 33 8 23V12zM24 15v16M16 23h16"/></svg>`,

        mortality: `<svg viewBox="0 0 48 48"><path class="icon-fill" d="M7 28c3-7 9-10 16-10s13 3 18 10v8H7z"/><circle class="icon-fill" cx="20" cy="14" r="6"/><path d="M7 36h34M20 8c-4 0-7 3-7 7s3 7 7 7M26 14l7 2-7 2M31 29l4-4 4 4"/></svg>`,

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

        professionals: `<svg viewBox="0 0 48 48"><circle class="icon-fill" cx="18" cy="15" r="7"/><path d="M7 40c1-8 5-12 11-12s10 4 11 12M18 8v14M11 15h14"/><path class="icon-fill" d="M30 24h9v16h-9z"/><path d="M33 24v-3a3 3 0 0 1 6 0v3M32 31h5M34.5 28.5v5"/></svg>`,

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
