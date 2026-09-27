/* Global no-auto-zoom guard for the password reset page. */
(function(){try{let m=document.querySelector('meta[name="viewport"]');if(!m){m=document.createElement("meta");m.name="viewport";(document.head||document.documentElement).appendChild(m);}m.content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";const s=document.createElement("style");s.textContent='html{-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}input,select,textarea,button{touch-action:manipulation}input,select,textarea{font-size:16px!important}';(document.head||document.documentElement).appendChild(s);}catch(e){console.warn("no-zoom guard",e);}})();

document.addEventListener("DOMContentLoaded", () => {
 const form=document.getElementById("resetForm"),emailInput=document.getElementById("email"),button=document.getElementById("resetButton"),message=document.getElementById("message"),successModal=document.getElementById("recoverySuccessModal"),successOk=document.getElementById("recoverySuccessOk");
 function openSuccessModal(){successModal.hidden=false;document.body.style.overflow="hidden";successOk.focus();}
 function closeSuccessModal(){successModal.hidden=true;document.body.style.overflow="";}
 successOk.addEventListener("click",closeSuccessModal);
 successModal.addEventListener("click",(event)=>{if(event.target===successModal)closeSuccessModal();});
 document.addEventListener("keydown",(event)=>{if(event.key==="Escape"&&!successModal.hidden)closeSuccessModal();});
 function showMessage(text,type="error"){message.textContent=text;message.className="message "+type;message.classList.remove("hidden");}
 form.addEventListener("submit",async(event)=>{event.preventDefault();const email=emailInput.value.trim().toLowerCase();if(!email){showMessage("ایمیل را وارد کنید.");return;}button.disabled=true;button.textContent="در حال ارسال...";try{const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:"https://app.adinepoultryhealth.ir/update-password.html"});if(error){console.error(error);showMessage("ارسال لینک بازیابی انجام نشد.");return;}form.reset();showMessage("", "success");message.classList.add("hidden");openSuccessModal();}catch(error){console.error(error);showMessage("خطایی رخ داد. دوباره تلاش کنید.");}finally{button.disabled=false;button.textContent="ارسال لینک بازیابی";}});
});
