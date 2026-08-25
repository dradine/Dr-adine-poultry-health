(function () {

    "use strict";

    function normalize(value) {
        return String(value || "")
            .trim()
            .toLowerCase();
    }

    window.AdineAuth = {

        canonicalUserType(value) {
            const x = String(value || '').trim().toLowerCase();
            const aliases = {
                poultry_operator: 'farm_operator',
                poultry_manager: 'farm_manager',
                poultry_operat: 'farm_operator',
                poultry_manage: 'farm_manager',
                veterinary_lab: 'diagnostic_lab',
                organization_manager: 'company_manager'
            };
            return aliases[x] || x || 'other';
        },


        async getUser() {

            try {

                const {
                    data: sessionData,
                    error: sessionError
                } = await supabaseClient.auth.getSession();

                if (!sessionError && sessionData?.session?.user) {
                    return sessionData.session.user;
                }

                const {
                    data,
                    error
                } = await supabaseClient.auth.getUser();

                if (error) {
                    console.error("getUser:", error);
                    return null;
                }

                return data?.user || null;

            } catch (error) {

                console.error("getUser exception:", error);
                return null;

            }

        },

        async getSession() {

            try {

                const {
                    data,
                    error
                } = await supabaseClient.auth.getSession();

                if (error) {
                    console.error("getSession:", error);
                    return null;
                }

                return data?.session || null;

            } catch (error) {

                console.error("getSession exception:", error);
                return null;

            }

        },

        async getProfile(userId = null) {

            const user =
                userId
                    ? { id: userId }
                    : await this.getUser();

            if (!user?.id) {
                return null;
            }

            try {

                const {
                    data,
                    error
                } = await supabaseClient
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .maybeSingle();

                if (error) {
                    console.error("getProfile:", error);
                    return null;
                }

                if (!data) {
                    return null;
                }

                // نوع کاربری حرفه‌ای در ساختار جدید در professional_profiles نگهداری می‌شود.
                // برای جلوگیری از اختلاف بین login/dashboard/professional، آن را به پروفایل جاری merge می‌کنیم.
                try {
                    const { data: professional, error: professionalError } =
                        await supabaseClient
                            .from("professional_profiles")
                            .select("user_type,activity_types,organization_name,license_number,province,city,specialty,notes,is_verified")
                            .eq("user_id", user.id)
                            .maybeSingle();

                    if (professionalError) {
                        // نبودن ردیف حرفه‌ای برای کاربران غیرحرفه‌ای خطای دسترسی محسوب نمی‌شود.
                        console.warn("getProfile professional profile:", professionalError);
                    }

                    if (professional) {
                        return {
                            ...data,
                            ...professional,
                            user_type: this.canonicalUserType(professional.user_type || data.user_type || null)
                        };
                    }
                } catch (professionalError) {
                    console.warn("getProfile professional profile exception:", professionalError);
                }

                return { ...data, user_type: this.canonicalUserType(data.user_type) };

            } catch (error) {

                console.error("getProfile exception:", error);
                return null;

            }

        },

        async signOut() {

            try {
                await supabaseClient.auth.signOut();
            } catch (error) {
                console.error("signOut:", error);
            }

            window.location.replace("login.html");

        },

        isActiveProfile(profile) {

            if (!profile) {
                return false;
            }

            const status = normalize(profile.status);
            const accessStatus = normalize(profile.access_status);
            const role = normalize(profile.role);

            const blocked =
                ["blocked", "suspended", "removed"].includes(status) ||
                ["blocked", "suspended", "removed"].includes(accessStatus);

            if (blocked) {
                return false;
            }

            return (
                status === "active" ||
                accessStatus === "approved" ||
                role === "owner" ||
                role === "admin"
            );

        },

        getAccessMessage(profile) {

            if (!profile) {
                return "اطلاعات حساب شما پیدا نشد.";
            }

            const status = normalize(profile.status);
            const accessStatus = normalize(profile.access_status);

            if (
                status === "pending" ||
                accessStatus === "pending"
            ) {
                return "ثبت‌نام شما انجام شده و در انتظار تأیید مالک سامانه است.";
            }

            if (
                status === "suspended" ||
                accessStatus === "suspended"
            ) {
                return "دسترسی حساب شما موقتاً غیرفعال شده است.";
            }

            if (
                status === "blocked" ||
                accessStatus === "blocked"
            ) {
                return "حساب شما مسدود شده است.";
            }

            if (
                status === "removed" ||
                accessStatus === "removed"
            ) {
                return "دسترسی شما به سامانه لغو شده است.";
            }

            return "دسترسی حساب شما فعال نیست.";

        },

        async requireAuth() {

            const session =
                await this.getSession();

            if (!session?.user) {

                window.location.replace("login.html");
                return null;

            }

            const user =
                session.user;

            const profile =
                await this.getProfile(user.id);

            if (!profile) {

                await supabaseClient.auth.signOut();

                window.location.replace(
                    "login.html?message=" +
                    encodeURIComponent(
                        "اطلاعات حساب شما در سامانه پیدا نشد."
                    )
                );

                return null;

            }

            if (!this.isActiveProfile(profile)) {

                const message =
                    this.getAccessMessage(profile);

                await supabaseClient.auth.signOut();

                window.location.replace(
                    "login.html?message=" +
                    encodeURIComponent(message)
                );

                return null;

            }

            try {

                const {
                    error
                } = await supabaseClient.rpc(
                    "update_my_activity"
                );

                if (error) {
                    console.warn(
                        "update_my_activity:",
                        error
                    );
                }

            } catch (error) {

                console.warn(
                    "update_my_activity exception:",
                    error
                );

            }

            return {
                user,
                profile
            };

        },

        async requireOwner() {

            const auth =
                await this.requireAuth();

            if (!auth) {
                return null;
            }

            if (
                normalize(auth.profile.role) !==
                "owner"
            ) {

                window.location.replace(
                    "Dashboard.html"
                );

                return null;

            }

            return auth;

        }

    };

})();
