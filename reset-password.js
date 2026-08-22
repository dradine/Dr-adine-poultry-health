
document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("resetForm");

    const emailInput =
        document.getElementById("email");

    const button =
        document.getElementById("resetButton");

    const message =
        document.getElementById("message");


    function showMessage(
        text,
        type = "error"
    ) {

        message.textContent = text;

        message.className =
            "message " + type;

        message.classList.remove("hidden");
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();


            if (!email) {

                showMessage(
                    "ایمیل را وارد کنید."
                );

                return;
            }


            button.disabled = true;

            button.textContent =
                "در حال ارسال...";


            try {

                const { error } =
                    await supabaseClient.auth
                        .resetPasswordForEmail(
                            email,
                            {
                                redirectTo:
                                    redirectTo:
    "https://dradine.github.io/Adine-poultry-health-center/update-password.html?v=20260819"
                            }
                        );


                if (error) {

                    console.error(error);

                    showMessage(
                        "ارسال لینک بازیابی انجام نشد."
                    );

                    return;
                }


                showMessage(
                    "اگر این ایمیل در سامانه ثبت شده باشد، لینک بازیابی رمز عبور برای آن ارسال می‌شود.",
                    "success"
                );


                form.reset();


            } catch (error) {

                console.error(error);

                showMessage(
                    "خطایی رخ داد. دوباره تلاش کنید."
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    "ارسال لینک بازیابی";
            }

        }
    );

});
