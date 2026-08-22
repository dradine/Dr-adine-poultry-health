document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const auth =
            await AdineAuth
                .requireAuth();

        if (!auth) {
            return;
        }


        const welcome =
            document.getElementById(
                "welcomeText"
            );

        const status =
            document.getElementById(
                "accountStatus"
            );

        const logout =
            document.getElementById(
                "logoutButton"
            );


        welcome.textContent =
            `سلام ${auth.profile.full_name || "کاربر گرامی"}؛ به سامانه مرکز تخصصی سلامت طیور آدینه خوش آمدید.`;


        status.textContent =
            "حساب شما فعال است.";


        logout.addEventListener(
            "click",
            async () => {

                await AdineAuth
                    .signOut();

            }
        );

    }
);
