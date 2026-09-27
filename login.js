(function(){
    try {
        if (window.location.hostname === "dradine.github.io") {
            const target = "https://app.adinepoultryhealth.ir/login.html" + window.location.search + window.location.hash;
            window.location.replace(target);
            return;
        }
    } catch (e) {
        console.warn("Canonical login host redirect:", e);
    }
})();

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
       EMAIL CONFIRMATION SUCCESS
    ===================================================== */

    try {
        const hash = String(window.location.hash || "");
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const authType = params.get("type");
        const hasAccessToken = !!params.get("access_token");

        if (hasAccessToken && authType === "signup") {
            showMessage(
                "ایمیل شما با موفقیت تأیید شد. اکنون رمز عبور خود را وارد کنید و روی «ورود» بزنید.",
                "success"
            );

            // Do not remove the auth hash until Supabase has had a chance
            // to consume the confirmation token and establish the session.
            setTimeout(async function () {
                try {
                    const sessionResult =
                        await window.supabaseClient.auth.getSession();

                    if (sessionResult?.data?.session && window.history?.replaceState) {
                        window.history.replaceState(
                            {},
                            document.title,
                            window.location.pathname + window.location.search
                        );
                    }
                } catch (sessionError) {
                    console.warn("Email confirmation session check:", sessionError);
                }
            }, 700);
        }
    } catch (error) {
        console.warn("Email confirmation message:", error);
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
                    await Promise.race([
                        window.supabaseClient.auth.signInWithPassword({
                            email: email,
                            password: password
                        }),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("LOGIN_TIMEOUT")), 15000)
                        )
                    ]);


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

                // signInWithPassword already returned the authenticated user.
                // Do not perform a second auth round-trip here; it can race with
                // session persistence on static GitHub Pages and make a valid login
                // look like a failed one.
                const authenticatedUser = data.user;


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


                // Load the required access profile directly. The professional
                // extension is optional for authentication, so a transient failure there
                // must not invalidate an otherwise valid login.
                let profile = null;
                try {
                    const profileResult = await Promise.race([
                        window.supabaseClient
                            .from("profiles")
                            .select("id,full_name,email,phone,role,status,is_active,approved_at,approved_by,last_seen_at,created_at,updated_at")
                            .eq("id", authenticatedUser.id)
                            .maybeSingle(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("PROFILE_TIMEOUT")), 7000))
                    ]);
                    if (profileResult?.error) throw profileResult.error;
                    profile = profileResult?.data || null;
                } catch (profileError) {
                    console.error("LOGIN PROFILE LOAD:", profileError);
                }

                // Fetch professional metadata separately. It is used only for routing.
                // If it is unavailable, Auth metadata remains a safe routing fallback.
                if (profile) {
                    try {
                        const professionalResult = await Promise.race([
                            window.supabaseClient
                                .from("professional_profiles")
                                .select("user_type,activity_types,organization_name,license_number,province,city,specialty,notes,is_verified")
                                .eq("user_id", authenticatedUser.id)
                                .maybeSingle(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error("PROFESSIONAL_PROFILE_TIMEOUT")), 5000))
                        ]);
                        if (!professionalResult?.error && professionalResult?.data) {
                            profile = { ...profile, ...professionalResult.data };
                        } else if (professionalResult?.error) {
                            console.warn("LOGIN PROFESSIONAL PROFILE LOAD:", professionalResult.error);
                        }
                    } catch (professionalError) {
                        console.warn("LOGIN PROFESSIONAL PROFILE EXCEPTION:", professionalError);
                    }
                }

                // Keep role/type metadata as a fallback for routing if the extension row
                // is temporarily unavailable.
                if (profile) {
                    profile.role = profile.role || authenticatedUser.user_metadata?.role || "";
                    profile.user_type = profile.user_type ||
                        authenticatedUser.user_metadata?.user_type ||
                        authenticatedUser.user_metadata?.userType || "";
                }


                /* =================================================
                   PROFILE NOT FOUND
                ================================================= */

                if (!profile) {
                    showMessage(
                        "ورود شما توسط سامانه تأیید شد، اما اطلاعات پروفایل دریافت نشد. لطفاً یک‌بار دیگر تلاش کنید.",
                        "error"
                    );
                    console.error("LOGIN PROFILE NOT AVAILABLE:", authenticatedUser.id);
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
                   UPDATE ACTIVITY
                ================================================= */

                try {
                    await Promise.race([
                        window.supabaseClient.rpc("update_my_activity"),
                        new Promise(resolve => setTimeout(resolve, 3000))
                    ]);
                } catch (activityError) {
                    // ثبت آخرین فعالیت نباید مانع ورود و مسیریابی شود.
                    console.warn("ACTIVITY UPDATE EXCEPTION:", activityError);
                }


                /* =================================================
                   REDIRECT
                ================================================= */

                const role =
                    String(
                        profile.role ||
                        authenticatedUser.user_metadata?.role ||
                        ""
                    )
                        .trim()
                        .toLowerCase();

                const rawUserType =
                    String(
                        profile.user_type ||
                        authenticatedUser.user_metadata?.user_type ||
                        authenticatedUser.user_metadata?.userType ||
                        ""
                    )
                        .trim()
                        .toLowerCase();

                // نام‌های قدیمی ثبت‌نام را فقط در لایه مسیریابی به نام‌های
                // استاندارد فعلی تبدیل می‌کنیم؛ داده حساب را دست نمی‌زنیم.
                const typeAliases = {
                    poultry_operator: "farm_operator",
                    poultry_manager: "farm_manager",
                    veterinary_lab: "diagnostic_lab",
                    organization_manager: "company_manager"
                };
                const userType = typeAliases[rawUserType] || rawUserType;

                // مسیر ورود قطعی و مستقل هر گروه:
                // مالک/مدیر سامانه → پنل مالک
                // بهره‌بردار/مدیر واحد/کارشناس فنی طیور → اپلیکیشن اصلی فارم
                // آزمایشگاه → پنل اختصاصی آزمایشگاه
                // دامپزشک/مسئول فنی/مدیر مجموعه/سایر → مرکز متخصصان
                if (role === "owner" || role === "admin") {
                    window.location.replace("owner.html");
                    return;
                }

                if ([
                    "farm_operator",
                    "farm_manager",
                    "poultry_technical_expert"
                ].includes(userType)) {
                    window.location.replace("Dashboard.html");
                    return;
                }

                if (userType === "diagnostic_lab") {
                    window.location.replace("laboratory.html");
                    return;
                }

                if ([
                    "veterinarian",
                    "technical_veterinarian",
                    "company_manager",
                    "other"
                ].includes(userType)) {
                    window.location.replace("professional.html");
                    return;
                }

                window.location.replace("professional.html");


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
