/* ADINE REPORTS ACCESS PATCH
   The report page has a canonical flock loader. Do not create a second list query.
   Only repair the detail query so farm/professional-authorized users are not
   incorrectly restricted by reports-data.js owner_id filtering.
*/
(function(g){
  'use strict';
  if(g.__ADINE_REPORTS_ACCESS_PATCH__) return;
  g.__ADINE_REPORTS_ACCESS_PATCH__=true;
  function install(){
    var client=g.supabaseClient;
    if(!client) return false;
    g.getReportFlock=async function(flockId){
      if(!flockId) return null;
      var r=await client.from('flocks').select('*, farms(id,name), houses(id,name)').eq('id',flockId).maybeSingle();
      if(r.error){console.error('Report flock access error:',r.error);throw r.error;}
      return r.data||null;
    };
    return true;
  }
  var n=0,t=setInterval(function(){n++;if(install()||n>100)clearInterval(t);},100);
  install();
})(window);
