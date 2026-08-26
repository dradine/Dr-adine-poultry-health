/* ADINEH | Farm / House / Flock registration fixes */
(function () {
    "use strict";
    const $ = id => document.getElementById(id);
    const norm = value => typeof normalizeNumbers === "function" ? normalizeNumbers(value) : String(value ?? "").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[,٬،]/g,"").trim();
    const num = id => { const v=norm($(id)?.value); if(v==="") return null; const n=Number(v); return Number.isFinite(n)?n:null; };
    const text = id => String($(id)?.value ?? "").trim();
    const iso = id => { const v=text(id); if(!v)return null; return window.AdineDateSystem?.jalaliToISO?.(v) || window.jalaliToISO?.(v) || null; };
    const productionRelevant = () => ["layer","breeder"].includes(text("productionType").toLowerCase());

    const productionLabels = new Set(["شروع تولید","تاریخ شروع تولید","سن شروع تولید (روز)","تعداد پرنده شروع تولید","وزن شروع تولید (گرم)"]);

    /* Remove the old permanent/partial production fields. */
    function removeDuplicateProductionFields(){
        const form=$("flockForm"); if(!form)return;
        form.querySelectorAll("label").forEach(label=>{
            if(label.closest("#productionBaselineFields")) return;
            const t=label.textContent.replace(/\s+/g," ").trim();
            if(!productionLabels.has(t))return;
            const g=label.closest(".form-group")||label.parentElement;
            if(g&&g!==form)g.remove();
        });
    }

    /* Always create one clean, protected conditional block with all four fields. */
    function addProductionSection(){
        const form=$("flockForm"), notes=$("flockNotes");
        if(!form||!notes)return;
        const old=$("productionBaselineFields");
        if(old)old.remove();
        removeDuplicateProductionFields();
        const wrap=document.createElement("div");
        wrap.id="productionBaselineFields";
        wrap.dataset.productionBaseline="true";
        wrap.className="form-grid full production-baseline";
        wrap.innerHTML=`
            <div class="form-group"><label for="productionStartDate">تاریخ شروع تولید</label><input id="productionStartDate" type="text" inputmode="numeric" autocomplete="off" placeholder="۱۴۰۵/۰۶/۰۱"></div>
            <div class="form-group"><label for="productionStartAgeDays">سن شروع تولید (روز)</label><input id="productionStartAgeDays" type="text" inputmode="numeric" autocomplete="off"></div>
            <div class="form-group"><label for="productionBaselineBirdCount">تعداد پرنده شروع تولید</label><input id="productionBaselineBirdCount" type="text" inputmode="numeric" autocomplete="off"></div>
            <div class="form-group"><label for="productionBaselineWeightG">وزن شروع تولید (گرم)</label><input id="productionBaselineWeightG" type="text" inputmode="decimal" autocomplete="off"></div>`;
        notes.closest(".form-group")?.before(wrap);
    }

    function updateProductionVisibility(){
        const wrap=$("productionBaselineFields"); if(!wrap)return;
        const active=productionRelevant();
        wrap.style.display=active?"grid":"none";
        ["productionStartDate","productionStartAgeDays","productionBaselineBirdCount","productionBaselineWeightG"].forEach(id=>{
            const el=$(id); if(!el)return;
            el.required=active;
            if(!active)el.value="";
        });
    }

    function watchForDuplicates(){
        const form=$("flockForm"); if(!form||form.dataset.productionObserver)return;
        form.dataset.productionObserver="1";
        new MutationObserver(removeDuplicateProductionFields).observe(form,{childList:true,subtree:true});
    }

    function selectedHouse(){
        const id=text("flockHouse");if(!id)return null;
        try{const list=(typeof houses!=="undefined")?houses:[];return list.find(h=>String(h.id)===String(id))||null;}catch(_){return null;}
    }
    function autoFillBirds(){
        const h=selectedHouse(),input=$("birdCount");if(!h||!input)return;
        const v=h.initial_bird_count??h.capacity;
        if(v!==null&&v!==undefined&&v!=="")input.value=Number(v).toLocaleString("fa-IR");
    }

    /* Density is a visible, read-only field in the house form. */
    function addDensity(){
        const form=$("houseForm"),length=$("houseLength"),width=$("houseWidth");
        if(!form||!length||!width)return;
        let out=$("houseDensity");
        if(out)return;
        const g=document.createElement("div");
        g.className="form-group";
        g.innerHTML=`<label for="houseDensity">تراکم اولیه (پرنده / مترمربع)</label><input id="houseDensity" type="text" readonly aria-readonly="true" placeholder="خودکار محاسبه می‌شود">`;
        width.closest(".form-group")?.after(g);
    }
    function updateDensity(){
        const l=num("houseLength"),w=num("houseWidth"),b=num("houseInitialBirdCount"),o=$("houseDensity");
        if(!o)return;
        if(!l||!w||b===null||l<=0||w<=0||b<0){o.value="";return;}
        o.value=(b/(l*w)).toLocaleString("fa-IR",{maximumFractionDigits:2});
    }

    function interceptHouse(){
        const form=$("houseForm");if(!form||form.dataset.adineFixHouse)return;form.dataset.adineFixHouse="1";
        form.addEventListener("submit",async e=>{
            e.preventDefault();e.stopImmediatePropagation();
            if(typeof selectedFarm==="undefined"||!selectedFarm)return alert("ابتدا یک فارم انتخاب کنید.");
            const name=text("houseName");if(!name)return alert("نام سالن را وارد کنید.");
            const payload={farm_id:selectedFarm.id,owner_id:currentUser.id,name,house_code:text("houseCode"),capacity:num("houseCapacity"),initial_bird_count:num("houseInitialBirdCount"),length_m:num("houseLength"),width_m:num("houseWidth"),ventilation_type:text("houseVentilation"),housing_system:text("houseSystem"),notes:text("houseNotes"),is_active:true};
            const btn=form.querySelector('button[type="submit"]');if(btn){btn.disabled=true;btn.textContent="در حال ذخیره...";}
            try{const{error}=await supabaseClient.from("houses").insert(payload);if(error)throw error;form.reset();updateDensity();await loadHouses();alert("سالن با موفقیت ثبت شد.");}
            catch(err){console.error(err);alert("ذخیره سالن انجام نشد:\n"+(err.message||err));}
            finally{if(btn){btn.disabled=false;btn.textContent="ذخیره سالن";}}
        },true);
    }

    function interceptFlock(){
        const form=$("flockForm");if(!form||form.dataset.adineFixFlock)return;form.dataset.adineFixFlock="1";
        form.addEventListener("submit",async e=>{
            e.preventDefault();e.stopImmediatePropagation();
            if(typeof selectedFarm==="undefined"||!selectedFarm)return alert("ابتدا یک فارم انتخاب کنید.");
            const houseId=text("flockHouse"),name=text("flockName"),type=text("productionType"),weight=num("initialAverageWeightG"),birds=num("birdCount");
            if(!houseId||!name||!type)return alert("سالن، نام گله و نوع پرورش الزامی است.");
            if(weight===null||weight<=0)return alert("میانگین وزن اولیه گله را وارد کنید.");
            if(birds===null||birds<=0)return alert("تعداد اولیه جوجه / مرغ را وارد کنید.");
            const placementDate=iso("placementDate");if(!placementDate)return alert("تاریخ جوجه‌ریزی / استقرار گله را وارد کنید.");
            const p={farm_id:selectedFarm.id,house_id:houseId,owner_id:currentUser.id,flock_name:name,flock_code:text("flockCode"),production_type:type,genetics:text("genetics"),strain:text("flockStrain")||text("genetics"),program:text("flockProgram"),sex:text("flockSex")||"mixed",initial_bird_count:birds,current_bird_count:birds,initial_average_weight_g:weight,placement_date:placementDate,start_age_days:num("startAgeDays")??1,status:"active",notes:text("flockNotes")};
            if(productionRelevant()){
                const sd=iso("productionStartDate"),sa=num("productionStartAgeDays"),sb=num("productionBaselineBirdCount"),sw=num("productionBaselineWeightG");
                if(!sd||sa===null||sb===null||sw===null||sa<=0||sb<=0||sw<=0)return alert("اطلاعات شروع تولید تخم‌گذار/مادر را کامل وارد کنید.");
                p.production_start_date=sd;p.production_start_age_days=sa;p.production_baseline_bird_count=sb;p.production_baseline_weight_g=sw;p.production_onset_date=sd;p.production_onset_age_days=sa;p.production_baseline_status="registered";
            }else{
                p.production_start_date=null;p.production_start_age_days=null;p.production_baseline_bird_count=null;p.production_baseline_weight_g=null;p.production_onset_date=null;p.production_onset_age_days=null;p.production_baseline_status=null;
            }
            const btn=form.querySelector('button[type="submit"]');if(btn){btn.disabled=true;btn.textContent="در حال ذخیره...";}
            try{const{error}=await supabaseClient.from("flocks").insert(p);if(error)throw error;form.reset();updateProductionVisibility();await loadFlocks();alert("گله با موفقیت ثبت شد.");}
            catch(err){console.error("Flock save error",err,p);alert("ذخیره گله انجام نشد:\n"+(err.message||err));}
            finally{if(btn){btn.disabled=false;btn.textContent="ذخیره گله";}}
        },true);
    }

    function init(){
        addProductionSection();
        interceptHouse();interceptFlock();
        $("productionType")?.addEventListener("change",updateProductionVisibility);
        $("flockHouse")?.addEventListener("change",autoFillBirds);
        ["houseLength","houseWidth","houseInitialBirdCount"].forEach(id=>$(id)?.addEventListener("input",updateDensity));
        autoFillBirds();addDensity();updateDensity();updateProductionVisibility();watchForDuplicates();
    }
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
