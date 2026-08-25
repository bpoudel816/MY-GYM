(() => {
  const $ = id => document.getElementById(id);
  function authPanel(name){
    ["loginPanel","registerPanel","resetPanel"].forEach(id => $(id).classList.remove("active"));
    $(name).classList.add("active");
    $("loginTab").classList.toggle("active", name==="loginPanel");
    $("registerTab").classList.toggle("active", name==="registerPanel");
    $("authMessage").textContent="";
  }
  $("loginTab").addEventListener("click",()=>authPanel("loginPanel"));
  $("registerTab").addEventListener("click",()=>authPanel("registerPanel"));
  $("forgotPasswordBtn").addEventListener("click",()=>{
    $("resetEmail").value=$("loginEmail").value||"";
    authPanel("resetPanel");
  });
  $("backToLoginBtn").addEventListener("click",()=>authPanel("loginPanel"));
  window.MY_GYM_UI_READY = true;
})();