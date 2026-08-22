/* =========================================================
   ADINE POULTRY HEALTH CENTER
   PROFESSIONAL DUOTONE SVG ICON SYSTEM
   No emoji / no external icon library.
   ========================================================= */

(function () {

    "use strict";

    const ICON = {

        home: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M7 22 24 8l17 14v19H29V29H19v12H7z"/>
                <path d="M7 22 24 8l17 14"/>
                <path d="M11 20v21h26V20"/>
                <path d="M19 41V29h10v12"/>
            </svg>`,

        farm: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M7 40V22l17-12 17 12v18H31V28H17v12z"/>
                <path d="M7 40h34M7 22 24 10l17 12M17 40V28h14v12"/>
                <path d="M19 22h10"/>
                <path d="M24 16v6"/>
            </svg>`,

        flock: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M18 39c0-7 4-12 10-14 5 2 9 7 9 14z"/>
                <circle class="icon-fill" cx="26" cy="17" r="8"/>
                <path d="M18 39c0-7 4-12 10-14 5 2 9 7 9 14M18 17c0-5 3-9 8-9s8 4 8 9"/>
                <path d="m34 17 7 2-7 2"/>
                <circle cx="28.5" cy="16" r="1.2" fill="currentColor" stroke="none"/>
                <path d="M22 37v4M30 37v4"/>
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

        scale: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M10 15h28l-5 10H15z"/>
                <path d="M24 8v28M10 15h28M7 15h10l-5 10H9zM31 15h10l-5 10h-3z"/>
                <path d="M14 36h20M18 40h12"/>
                <path d="M20 15a4 4 0 0 1 8 0"/>
            </svg>`,

        uniformity: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M7 37V11h34v26z"/>
                <path d="M7 37V11h34v26zM13 31l7-8 6 5 9-12"/>
                <circle cx="13" cy="31" r="2" fill="currentColor" stroke="none"/>
                <circle cx="20" cy="23" r="2" fill="currentColor" stroke="none"/>
                <circle cx="26" cy="28" r="2" fill="currentColor" stroke="none"/>
                <circle cx="35" cy="16" r="2" fill="currentColor" stroke="none"/>
            </svg>`,

        vaccine: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="m30 7 11 11-16 16-8-8z"/>
                <path d="m30 7 11 11-16 16-8-8zM21 14l13 13M17 26l-5 13 13-5"/>
                <path d="M34 13l5-5M9 40h12"/>
            </svg>`,

        medicine: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M16 7h16v7H16zM18 14h12v27H18z"/>
                <path d="M16 7h16v7H16zM18 14h12v27H18zM18 21h12"/>
                <path d="M24 25v11M18.5 30.5h11"/>
            </svg>`,

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
                <path class="icon-fill" d="M9 6h30v36H9z"/>
                <path d="M9 6h30v36H9zM15 13h18M15 19h18M15 35v-8M22 35V22M29 35v-5M36 35V23"/>
            </svg>`,

        archive: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M7 10h34v8H7zM10 18h28v22H10z"/>
                <path d="M7 10h34v8H7zM10 18h28v22H10zM18 25h12M18 31h12M19 6h10"/>
            </svg>`,

        health: `
            <svg viewBox="0 0 48 48">
                <path class="icon-fill" d="M24 40S8 31 8 19c0-6 4-10 9-10 3 0 6 2 7 5 1-3 4-5 7-5 5 0 9 4 9 10 0 12-16 21-16 21z"/>
                <path d="M24 40S8 31 8 19c0-6 4-10 9-10 3 0 6 2 7 5 1-3 4-5 7-5 5 0 9 4 9 10 0 12-16 21-16 21z"/>
                <path d="M16 24h5l2-5 3 10 2-5h5"/>
            </svg>`,

        mortality: `
            <svg viewBox="0 0 48 48">
                <circle class="icon-fill" cx="24" cy="24" r="17"/>
                <circle cx="24" cy="24" r="17"/>
                <path d="m17 17 14 14M31 17 17 31"/>
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

        settings: `
            <svg viewBox="0 0 48 48">
                <circle class="icon-fill" cx="24" cy="24" r="15"/>
                <circle cx="24" cy="24" r="6"/>
                <path d="M24 5v7M24 36v7M5 24h7M36 24h7M10 10l5 5M33 33l5 5M38 10l-5 5M15 33l-5 5"/>
            </svg>`,

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
