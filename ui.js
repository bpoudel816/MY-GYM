(() => {
  const $ = id => document.getElementById(id);

  function showAuthPanel(name) {
    ["loginPanel","registerPanel","resetPanel"].forEach(id => $(id).classList.remove("active"));
    $(name).classList.add("active");
    $("loginTab").classList.toggle("active", name === "loginPanel");
    $("registerTab").classList.toggle("active", name === "registerPanel");
    $("authMessage").textContent = "";
  }

  $("loginTab").addEventListener("click", () => showAuthPanel("loginPanel"));
  $("registerTab").addEventListener("click", () => showAuthPanel("registerPanel"));
  $("forgotPasswordBtn").addEventListener("click", () => {
    $("resetEmail").value = $("loginEmail").value || "";
    showAuthPanel("resetPanel");
  });
  $("backToLoginBtn").addEventListener("click", () => showAuthPanel("loginPanel"));

  window.MY_GYM_UI_READY = true;
})();