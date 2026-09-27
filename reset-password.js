/* Global no-auto-zoom guard for the password reset page. */
(function(){try{let m=document.querySelector('meta[name="viewport"]');if(!m){m=document.createElement("meta");m.name="viewport";(document.head||document.documentElement).appendChild(m);}m.content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";const s=document.createElement("style");s.textContent='html{-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}input,select,textarea,button{touch-action:manipulation}input,select,textarea{font-size:16px!important}';(document.head||document.documentElement).appendChild(s);}catch(e){console.warn("no-zoom guard",e);}})();

document.addEventListener("DOMContentLoaded", () => {
 const form=document.getElementById("resetForm"),emailInput=document.getElementById("email"),button=document.getElementById("resetButton"),message=document.getElementById("message"),successModal=document.getElementById("recoverySuccessModal"),successOk=document.getElementById("recoverySuccessOk"); let recoveryEmail=""; let resendButton=null; let resendTimer=null;
 function openSuccessModal(){successModal.hidden=false;document.body.style.overflow="hidden";successOk.focus();}
 function closeSuccessModal(){successModal.hidden=true;document.body.style.overflow="";}
 successOk.addEventListener("click",closeSuccessModal);
 successModal.addEventListener("click",(event)=>{if(event.target===successModal)closeSuccessModal();});
 document.addEventListener("keydown",(event)=>{if(event.key==="Escape"&&!successModal.hidden)closeSuccessModal();});
 function showMessage(text,type="error"){message.textContent=text;message.className="message "+type;message.classList.remove("hidden");}
 function ensureResendButton(){
   if(resendButton)return resendButton;
   resendButton=document.createElement("button");
   resendButton.type="button";
   resendButton.className="registration-modal-button";
   resendButton.style.marginTop="9px";
   resendButton.style.background="#eef7f2";
   resendButton.style.color="#1f6045";
   resendButton.textContent="ارسال مجدد لینک بازیابی";
   resendButton.addEventListener("click",sendRecoveryEmail);
   successOk.parentElement.appendChild(resendButton);
   return resendButton;
 }
 function cooldown(seconds=60){
   const btn=ensureResendButton(); btn.disabled=true; let left=seconds; btn.textContent="ارسال مجدد ("+left+" ثانیه)";
   clearInterval(resendTimer);
   resendTimer=setInterval(()=>{left--;if(left<=0){clearInterval(resendTimer);btn.disabled=false;btn.textContent="ارسال مجدد لینک بازیابی";}else btn.textContent="ارسال مجدد ("+left+" ثانیه)";},1000);
 }
 async function sendRecoveryEmail(){
   const email=recoveryEmail||emailInput.value.trim().toLowerCase();
   if(!email)return;
   recoveryEmail=email;
   const btn=ensureResendButton(); btn.disabled=true; btn.textContent="در حال ارسال...";
   try{
     const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:"https://app.adinepoultryhealth.ir/update-password.html"});
     if(error)throw error;
     btn.textContent="لینک بازیابی دوباره ارسال شد";
   }catch(error){
     console.error("PASSWORD RECOVERY SEND ERROR:",error);
     const msg=String(error?.message||"");
     if(error?.status===429||/rate limit|too many|60|second/i.test(msg)){cooldown(60);}
     else {btn.disabled=false;btn.textContent="ارسال مجدد لینک بازیابی";}
     showMessage(msg||"ارسال لینک بازیابی انجام نشد.");
   }
 }
 form.addEventListener("submit",async(event)=>{event.preventDefault();const email=emailInput.value.trim().toLowerCase();if(!email){showMessage("ایمیل را وارد کنید.");return;}recoveryEmail=email;button.disabled=true;button.textContent="در حال ارسال...";try{const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:"https://app.adinepoultryhealth.ir/update-password.html"});if(error){console.error("PASSWORD RECOVERY SEND ERROR:",error);const msg=String(error.message||"");if(error.status===429||/rate limit|too many|60|second/i.test(msg))showMessage("برای جلوگیری از ارسال‌های پیاپی، لطفاً ۶۰ ثانیه صبر کنید و دوباره تلاش کنید.");else showMessage(msg||"ارسال لینک بازیابی انجام نشد.");return;}form.reset();showMessage("", "success");message.classList.add("hidden");ensureResendButton();openSuccessModal();}catch(error){console.error(error);showMessage(error?.message||"خطایی رخ داد. دوباره تلاش کنید.");}finally{button.disabled=false;button.textContent="ارسال لینک بازیابی";}});
});
