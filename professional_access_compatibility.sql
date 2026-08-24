-- ADINEH PROFESSIONAL ACCESS COMPATIBILITY
-- Run once in Supabase SQL Editor if the database uses diagnostic_lab in farm_professional_access
-- while existing professional profiles use veterinary_lab.

CREATE OR REPLACE FUNCTION public.professional_can_edit_lab(p_farm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT auth.uid() IS NOT NULL
       AND EXISTS (
            SELECT 1
            FROM public.farm_professional_access fpa
            WHERE fpa.farm_id = p_farm_id
              AND fpa.professional_user_id = auth.uid()
              AND fpa.status = 'active'
              AND fpa.professional_type IN ('diagnostic_lab','veterinary_lab')
       );
$$;

-- Canonical access value is diagnostic_lab because farm_professional_access allows it.
-- Existing professional profiles may use veterinary_lab; both are accepted here.
CREATE OR REPLACE FUNCTION public.request_professional_access_by_code(
    p_farm_id uuid,
    p_access_code text,
    p_professional_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_owner_id uuid;
    v_professional_user_id uuid;
    v_access_id uuid;
    v_code text;
    v_requested_type text;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'کاربر وارد نشده است'; END IF;
    SELECT owner_id INTO v_owner_id FROM public.farms WHERE id = p_farm_id;
    IF v_owner_id IS NULL THEN RAISE EXCEPTION 'فارم پیدا نشد'; END IF;
    IF v_owner_id <> auth.uid() THEN RAISE EXCEPTION 'شما مالک این فارم نیستید'; END IF;

    v_code := trim(p_access_code);
    IF v_code IS NULL OR v_code = '' THEN RAISE EXCEPTION 'کد حرفه‌ای وارد نشده است'; END IF;

    IF p_professional_type NOT IN ('veterinarian','technical_veterinarian','poultry_technical_expert','diagnostic_lab') THEN
        RAISE EXCEPTION 'نوع متخصص معتبر نیست';
    END IF;

    SELECT user_id INTO v_professional_user_id
    FROM public.professional_access_codes
    WHERE access_code = v_code AND is_active = true
    LIMIT 1;
    IF v_professional_user_id IS NULL THEN RAISE EXCEPTION 'کد حرفه‌ای معتبر یا فعال نیست'; END IF;
    IF v_professional_user_id = auth.uid() THEN RAISE EXCEPTION 'امکان اتصال حساب کاربر به خودش وجود ندارد'; END IF;

    SELECT CASE WHEN p_professional_type = 'diagnostic_lab' THEN 'diagnostic_lab' ELSE p_professional_type END
    INTO v_requested_type;

    IF NOT EXISTS (
        SELECT 1
        FROM public.professional_profiles pp
        JOIN public.profiles p ON p.id = pp.user_id
        WHERE pp.user_id = v_professional_user_id
          AND (
              pp.user_type = v_requested_type
              OR (v_requested_type = 'diagnostic_lab' AND pp.user_type = 'veterinary_lab')
          )
          AND COALESCE(p.status::text,'active') = 'active'
          AND COALESCE(p.is_active,true) = true
    ) THEN
        RAISE EXCEPTION 'نوع متخصص با پروفایل این کد مطابقت ندارد';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.farm_professional_access
        WHERE farm_id = p_farm_id AND professional_user_id = v_professional_user_id
          AND status IN ('pending','active')
    ) THEN RAISE EXCEPTION 'برای این متخصص قبلاً درخواست یا دسترسی فعال وجود دارد'; END IF;

    INSERT INTO public.farm_professional_access
        (farm_id,professional_user_id,professional_type,status,requested_by,requested_at,created_at,updated_at)
    VALUES
        (p_farm_id,v_professional_user_id,v_requested_type,'pending',auth.uid(),now(),now(),now())
    RETURNING id INTO v_access_id;

    INSERT INTO public.professional_notifications
        (user_id,farm_id,notification_type,title,body,metadata,is_read,created_at)
    VALUES
        (v_professional_user_id,p_farm_id,'access_request','درخواست جدید دسترسی به فارم',
         'یک مرغدار درخواست کرده است این فارم تحت نظر شما قرار گیرد.',
         jsonb_build_object('access_id',v_access_id,'farm_id',p_farm_id,'professional_type',v_requested_type),false,now());

    RETURN v_access_id;
END;
$$;
