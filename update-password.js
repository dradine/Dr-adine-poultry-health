document.addEventListener("DOMContentLoaded", async () => {

    const form = document.getElementById("updatePasswordForm");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const button = document.getElementById("updateButton");
    const message = document.getElementById("message");


    function showMessage(text, type = "error") {

        message.textContent = text;
        message.className = "message " + type;
        message.classList.remove("hidden");

    }


    try {

        /*
         * Supabase ممکن است Session را از URL
         * به صورت خودکار دریافت کند.
         */

        const { data: sessionData, error: sessionError } =
            await supabaseClient.auth.getSession();


        if (sessionError) {

            console.error(
                "SESSION ERROR:",
                sessionError
            );

        }


        let session = sessionData?.session || null;


        /*
         * اگر Session هنوز ساخته نشده بود،
         * URL را برای Recovery Token بررسی می‌کنیم.
         */

        if (!session) {

            const hash =
                window.location.hash.substring(1);

            const params =
                new URLSearchParams(hash);

            const accessToken =
                params.get("access_token");

            const refreshToken =
                params.get("refresh_token");

            const type =
                params.get("type");


            if (
                accessToken &&
                refreshToken &&
                type === "recovery"
            ) {

                const { data, error } =
                    await supabaseClient.auth.setSession({

                        access_token:
                            accessToken,

                        refresh_token:
                            refreshToken

                    });


                if (error) {

                    console.error(
                        "RECOVERY SESSION ERROR:",
                        error
                    );

                    showMessage(
                        "لینک بازیابی رمز عبور معتبر نیست یا منقضی شده است."
                    );

                    return;

                }


                session =
                    data.session;

            }

        }


        /*
         * اگر هنوز Session نداریم،
         * کاربر نباید بتواند رمز را تغییر دهد.
         */

        if (!session) {

            showMessage(
                "نشست بازیابی رمز عبور پیدا نشد. لطفاً دوباره درخواست بازیابی رمز کنید."
            );

            return;

        }


        showMessage(
            "لطفاً رمز عبور جدید خود را وارد کنید.",
            "info"
        );


    } catch (error) {

        console.error(
            "AUTH INITIALIZATION ERROR:",
            error
        );

        showMessage(
            "خطا در تأیید لینک بازیابی رمز عبور."
        );

        return;

    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (
                password.value.length < 8
            ) {

                showMessage(
                    "رمز عبور باید حداقل ۸ کاراکتر باشد."
                );

                return;

            }


            if (
                password.value !==
                confirmPassword.value
            ) {

                showMessage(
                    "تکرار رمز عبور صحیح نیست."
                );

                return;

            }


            button.disabled = true;

            button.textContent =
                "در حال ذخیره...";


            try {

                /*
                 * یک بار دیگر Session را بررسی می‌کنیم.
                 */

                const {
                    data: sessionData,
                    error: sessionError
                } =
                    await supabaseClient.auth.getSession();


                if (
                    sessionError ||
                    !sessionData.session
                ) {

                    showMessage(
                        "Auth session missing! لطفاً دوباره از طریق ایمیل بازیابی رمز وارد شوید."
                    );

                    return;

                }


                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.updateUser({

                        password:
                            password.value

                    });


                console.log(
                    "UPDATE RESULT:",
                    data,
                    error
                );


                if (error) {

                    console.error(
                        "PASSWORD UPDATE ERROR:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "تغییر رمز عبور انجام نشد."
                    );

                    return;

                }


                showMessage(
                    "رمز عبور با موفقیت تغییر کرد.",
                    "success"
                );


                setTimeout(
                    async () => {

                        await supabaseClient.auth.signOut();

                        window.location.href =
                            "login.html";

                    },
                    2000
                );


            } catch (error) {

                console.error(
                    "PASSWORD UPDATE ERROR:",
                    error
                );

                showMessage(
                    error.message ||
                    "خطایی رخ داد. دوباره تلاش کنید."
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    "ذخیره رمز جدید";

            }

        }
    );

});
