/* =========================================================
   ADINE POULTRY HEALTH CENTER
   GENETICS UI ENGINE
========================================================= */


/* =========================================================
   POPULATE PRODUCTION TYPE
========================================================= */

function populateProductionTypes(
    select
) {

    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            انتخاب نوع گله
        </option>

        <option value="broiler">
            گوشتی
        </option>

        <option value="layer">
            تخم‌گذار
        </option>

        <option value="pullet">
            پولت
        </option>

        <option value="breeder">
            مرغ مادر
        </option>

    `;

}


/* =========================================================
   POPULATE GENETICS
========================================================= */

function populateGenetics(
    type,
    select
) {

    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            انتخاب شرکت / ژنتیک
        </option>

    `;


    getGenetics(type)
        .forEach(
            genetics => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    genetics.id;


                option.textContent =
                    genetics.name;


                select.appendChild(
                    option
                );

            }
        );

}


/* =========================================================
   POPULATE STRAINS
========================================================= */

function populateStrains(
    type,
    geneticsId,
    select
) {

    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            انتخاب سویه / نژاد
        </option>

    `;


    getStrains(
        type,
        geneticsId
    )
    .forEach(
        strain => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                strain;


            option.textContent =
                strain;


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   SETUP SELECTORS
========================================================= */

function setupGeneticsSelectors({

    typeSelect,

    geneticsSelect,

    strainSelect,

    onChange = null

}) {

    if (typeSelect) {

        populateProductionTypes(
            typeSelect
        );


        typeSelect.addEventListener(
            "change",
            function() {

                populateGenetics(
                    this.value,
                    geneticsSelect
                );


                if (strainSelect) {

                    strainSelect.innerHTML =
                        `
                        <option value="">
                            انتخاب سویه / نژاد
                        </option>
                        `;

                }


                if (
                    typeof onChange ===
                    "function"
                ) {

                    onChange();

                }

            }
        );

    }


    if (geneticsSelect) {

        geneticsSelect.addEventListener(
            "change",
            function() {

                populateStrains(
                    typeSelect.value,
                    this.value,
                    strainSelect
                );


                if (
                    typeof onChange ===
                    "function"
                ) {

                    onChange();

                }

            }
        );

    }


    if (strainSelect) {

        strainSelect.addEventListener(
            "change",
            function() {

                if (
                    typeof onChange ===
                    "function"
                ) {

                    onChange();

                }

            }
        );

    }

}


/* =========================================================
   GET SELECTED STANDARD
========================================================= */

function getSelectedStandardFromUI({

    typeSelect,

    geneticsSelect,

    strainSelect

}) {

    if (
        !typeSelect ||
        !geneticsSelect ||
        !strainSelect
    ) {

        return null;

    }


    return getStandard(
        typeSelect.value,
        geneticsSelect.value,
        strainSelect.value
    );

}


/* =========================================================
   STANDARD STATUS MESSAGE
========================================================= */

function renderStandardStatus(
    element,
    standard
) {

    if (!element) {

        return;

    }


    if (!standard) {

        element.innerHTML = `

            <div class="info-box">

                برای این سویه هنوز
                استاندارد عددی وارد نشده است.
                عدد حدسی در محاسبات استفاده نمی‌شود.

            </div>

        `;

        return;

    }


    element.innerHTML = `

        <div class="info-box">

            <strong>استاندارد مرجع فعال است.</strong>
            <br>
            ${escapeHTML(
                standard.sourceType === "management-standard"
                    ? "برای این سویه/شاخص، استاندارد مدیریتی استفاده می‌شود."
                    : "استاندارد ژنتیکی رسمی برای شاخص‌های موجود و استاندارد مدیریتی برای شاخص‌های فاقد مرجع رسمی استفاده می‌شود."
            )}
            <br>
            نسخه: ${escapeHTML(standard.version || "-")}

        </div>

    `;

}
