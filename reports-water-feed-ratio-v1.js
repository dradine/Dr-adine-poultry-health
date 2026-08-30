(function(){'use strict';
function num(v){if(v==null)return null;var s=String(v).replace(/[۰-۹]/g,function(d){return String(d.charCodeAt(0)-1776)}).replace(/[٠-٩]/g,function(d){return String(d.charCodeAt(0)-1632)}).replace(/[٬,]/g,'').replace('٫','.').replace(/[^0-9.\-]/g,'');var n=Number(s);return Number.isFinite(n)?n:null}
function fmt(v,d){return Number(v).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})}
function render(){var root=document.getElementById('root');if(!root)return;var section=root.querySelector('.section');var cards=section&&section.querySelector('.cards');if(!cards)return;
var old=document.getElementById('weeklyWaterFeedRatioCard');if(old)old.remove();
var feed=null,water=null;cards.querySelectorAll('.metric').forEach(function(c){var l=(c.querySelector('.label')?.textContent||'').trim();var v=(c.querySelector('.value')?.textContent||'').trim();if(l==='دان')feed=num(v);if(l==='آب')water=num(v)});
if(feed==null||feed<=0||water==null)return;
var ratio=water/feed;
var card=document.createElement('div');card.id='weeklyWaterFeedRatioCard';card.className='metric';card.innerHTML='<div class="label">نسبت آب به دان هفتگی</div><div class="value">'+fmt(ratio*100,1)+'٪</div><div class="ref">آب: '+fmt(ratio,2)+' برابر دان</div>';
cards.appendChild(card);
}
var observer=new MutationObserver(function(){render()});
function boot(){render();var root=document.getElementById('root');if(root)observer.observe(root,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
