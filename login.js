document.addEventListener("DOMContentLoaded", function () {

    "use strict";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const form =
        document.getElementById("loginForm");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const button =
        document.getElementById("loginButton");

    const buttonText =
        document.getElementById("loginButtonText");

    const message =
        document.getElementById("message");

    const togglePassword =
        document.getElementById("togglePassword");


    /* =====================================================
       UI CHECK
    ===================================================== */

    if (
        !form ||
        !emailInput ||
        !passwordInput ||
        !button ||
        !message
    ) {

        console.error(
            "Login UI initialization failed."
        );

        return;
    }


    /* =====================================================
       SHOW MESSAGE
    ===================================================== */

    function showMessage(
        text,
        type = "error"
    ) {

        message.textContent =
            String(text || "");

        message.className =
            "message " + type;

        message.classList.remove(
            "hidden"
        );

        message.style.display =
            "block";

        message.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    /* =====================================================
       HIDE MESSAGE
    ===================================================== */

    function hideMessage() {

        message.textContent = "";

        message.className =
            "message hidden";

        message.style.display =
            "none";

        message.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    /* =====================================================
       PERSIAN LOGIN ERRORS
    ===================================================== */

    function getLoginErrorMessage(
        error
    ) {

        const text =
            String(
                error?.message ||
                error?.error_description ||
                ""
            )
            .trim()
            .toLowerCase();


        /* INVALID LOGIN */

        if (
            text.includes(
                "invalid login credentials"
            ) ||
            text.includes(
                "invalid credentials"
            ) ||
            text.includes(
                "invalid email or password"
            )
        ) {

            return "ایمیل یا رمز عبور اشتباه است.";
        }


        /* EMAIL NOT CONFIRMED */

        if (
            text.includes(
                "email not confirmed"
            )
        ) {

            return "ایمیل شما هنوز تأیید نشده است.";
        }


        /* USER NOT FOUND */

        if (
            text.includes(
                "user not found"
            )
        ) {

            return "حساب کاربری پیدا نشد.";
        }


        /* TOO MANY REQUESTS */

        if (
            text.includes(
                "too many requests"
            ) ||
            text.includes(
                "rate limit"
            )
        ) {

            return "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً چند دقیقه بعد دوباره تلاش کنید.";
        }


        /* NETWORK */

        if (
            text.includes(
                "failed to fetch"
            ) ||
            text.includes(
                "network"
            ) ||
            text.includes(
                "networkerror"
            )
        ) {

            return "ارتباط با سامانه برقرار نشد. اتصال اینترنت را بررسی کنید.";
        }


        /* DEFAULT */

        return "ورود انجام نشد. ایمیل و رمز عبور خود را بررسی کنید.";

    }


    /* =====================================================
       CHECK SUPABASE
    ===================================================== */

    function checkSupabase() {

        if (
            typeof window.supabaseClient ===
            "undefined"
        ) {

            return false;
        }

        if (
            !window.supabaseClient ||
            !window.supabaseClient.auth
        ) {

            return false;
        }

        return true;
    }


    /* =====================================================
       PASSWORD TOGGLE
    ===================================================== */

    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            function () {

                const isVisible =
                    passwordInput.type ===
                    "text";


                if (isVisible) {

                    passwordInput.type =
                        "password";

                    togglePassword.textContent =
                        "نمایش";

                    togglePassword.setAttribute(
                        "aria-label",
                        "نمایش رمز"
                    );

                } else {

                    passwordInput.type =
                        "text";

                    togglePassword.textContent =
                        "پنهان";

                    togglePassword.setAttribute(
                        "aria-label",
                        "پنهان کردن رمز"
                    );

                }

            }
        );

    }


    /* =====================================================
       URL MESSAGE
    ===================================================== */

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const urlMessage =
            params.get("message");

        if (urlMessage) {

            showMessage(
                urlMessage,
                "info"
            );
        }

    } catch (error) {

        console.warn(
            "URL message error:",
            error
        );

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* PREVENT DOUBLE CLICK */

            if (button.disabled) {
                return;
            }


            hideMessage();


            /* =================================================
               VALUES
            ================================================= */

            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordInput.value;


            /* =================================================
               VALIDATION
            ================================================= */

            if (!email) {

                showMessage(
                    "لطفاً ایمیل خود را وارد کنید.",
                    "error"
                );

                emailInput.focus();

                return;
            }


            if (!password) {

                showMessage(
                    "لطفاً رمز عبور خود را وارد کنید.",
                    "error"
                );

                passwordInput.focus();

                return;
            }


            /* =================================================
               SUPABASE CHECK
            ================================================= */

            if (!checkSupabase()) {

                showMessage(
                    "سامانه ورود به حساب کاربری بارگذاری نشده است. لطفاً صفحه را دوباره بارگذاری کنید.",
                    "error"
                );

                console.error(
                    "supabaseClient is not available."
                );

                return;
            }


            /* =================================================
               LOADING
            ================================================= */

            button.disabled =
                true;

            button.setAttribute(
                "aria-busy",
                "true"
            );


            if (buttonText) {

                buttonText.textContent =
                    "در حال ورود…";

            } else {

                button.textContent =
                    "در حال ورود…";
            }


            try {


                /* =================================================
                   SIGN IN
                ================================================= */

                const result =
                    await window.supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });


                const data =
                    result?.data;

                const error =
                    result?.error;


                /* =================================================
                   AUTH ERROR
                ================================================= */

                if (error) {

                    console.error(
                        "LOGIN ERROR:",
                        error
                    );


                    showMessage(
                        getLoginErrorMessage(
                            error
                        ),
                        "error"
                    );


                    return;
                }


                /* =================================================
                   USER CHECK
                ================================================= */

                if (!data?.user) {

                    showMessage(
                        "ورود انجام نشد؛ حساب کاربری پیدا نشد.",
                        "error"
                    );

                    return;
                }


                /* =================================================
                   PROFILE
                ================================================= */

                if (
                    typeof window.AdineAuth ===
                    "undefined"
                ) {

                    await window.supabaseClient.auth.signOut();

                    showMessage(
                        "سامانه احراز هویت به‌درستی بارگذاری نشده است.",
                        "error"
                    );

                    return;
                }


                const profile =
                    await window.AdineAuth.getProfile(
                        data.user.id
                    );


                /* =================================================
                   PROFILE NOT FOUND
                ================================================= */

                if (!profile) {

                    await window.supabaseClient.auth.signOut();

                    showMessage(
                        "حساب شما در سامانه ثبت نشده است. لطفاً با مالک سامانه تماس بگیرید.",
                        "error"
                    );

                    return;
                }


                /* =================================================
                   ACCOUNT ACCESS
                ================================================= */

                if (
                    !window.AdineAuth
                        .isActiveProfile(profile)
                ) {

                    const accessMessage =
                        window.AdineAuth
                            .getAccessMessage(
                                profile
                            );


                    await window.supabaseClient.auth.signOut();


                    showMessage(
                        accessMessage ||
                        "دسترسی حساب شما فعال نیست.",
                        "error"
                    );


                    return;
                }


                /* =================================================
                   COMPLETE ROLE PROFILE IF EMAIL CONFIRMATION
                   PREVENTED REGISTRATION RPC FROM RUNNING
                ================================================= */
                if (profile && profile.profile_completed !== true && window.supabaseClient?.rpc) {
                    try {
                        const md = data.user.user_metadata || {};
                        await window.supabaseClient.rpc("complete_profile_registration", {
                            p_full_name: md.full_name || profile.full_name || "",
                            p_phone: md.phone || profile.phone || "",
                            p_user_type: md.user_type || profile.user_type || "other",
                            p_activity_types: md.activity_types || profile.activity_types || []
                        });
                    } catch (profileCompletionError) {
                        console.warn("PROFILE COMPLETION:", profileCompletionError);
                    }
                }

                /* =================================================
                   UPDATE ACTIVITY
                ================================================= */

                try {

                    const activityResult =
                        await window.supabaseClient.rpc(
                            "update_my_activity"
                        );


                    if (
                        activityResult?.error
                    ) {

                        console.warn(
                            "ACTIVITY UPDATE ERROR:",
                            activityResult.error
                        );
                    }

                } catch (activityError) {

                    console.warn(
                        "ACTIVITY UPDATE EXCEPTION:",
                        activityError
                    );

                }


                /* =================================================
                   REDIRECT
                ================================================= */

                const role =
                    String(profile.role || "")
                        .trim()
                        .toLowerCase();

                const userType =
                    (window.AdineAuth.canonicalUserType
                        ? window.AdineAuth.canonicalUserType(profile.user_type)
                        : String(profile.user_type || "").trim().toLowerCase());

                const mainFarmTypes = [
                    "farm_operator",
                    "farm_manager",
                    "poultry_technical_expert"
                ];

                // سه گروه اصلی وارد برنامه مرغداری می‌شوند؛ مالک وارد مدیریت می‌شود؛
                // سایر حساب‌ها وارد مرکز مدیریت متخصصان/سایر کاربران می‌شوند.
                if (role === "owner" || role === "admin") {
                    window.location.replace("owner.html");
                } else if (mainFarmTypes.includes(userType)) {
                    window.location.replace("Dashboard.html");
                } else {
                    window.location.replace("professional.html");
                }


            } catch (error) {

                console.error(
                    "LOGIN EXCEPTION:",
                    error
                );


                showMessage(
                    getLoginErrorMessage(
                        error
                    ),
                    "error"
                );


            } finally {

                button.disabled =
                    false;

                button.removeAttribute(
                    "aria-busy"
                );


                if (buttonText) {

                    buttonText.textContent =
                        "ورود";

                } else {

                    button.textContent =
                        "ورود";
                }

            }

        }
    );

});
