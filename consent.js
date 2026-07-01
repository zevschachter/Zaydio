(function () {
  var STORAGE_KEY = "zaydio_consent";
  var GA_ID = "G-MKN3YL860F";

  function getConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (_e) {
      /* ignore */
    }
  }

  function loadScript(src, callback) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    if (callback) s.onload = callback;
    document.head.appendChild(s);
  }

  function initAnalytics() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("config", GA_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    loadScript("analytics.js?v=7.3");
  }

  function enableAnalytics() {
    setConsent("accepted");
    hideBanner();
    loadScript("https://www.googletagmanager.com/gtag/js?id=" + GA_ID, initAnalytics);
  }

  function essentialOnly() {
    setConsent("essential");
    hideBanner();
  }

  function hideBanner() {
    var banner = document.getElementById("consent-banner");
    if (banner) banner.remove();
  }

  function showBanner() {
    if (document.getElementById("consent-banner")) return;

    var banner = document.createElement("div");
    banner.id = "consent-banner";
    banner.className = "consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie preferences");
    banner.innerHTML =
      '<p class="consent-banner__text">We use privacy-friendly analytics to improve Zaydio for families. No ads. <a href="/privacy.html">Privacy Policy</a></p>' +
      '<div class="consent-banner__actions">' +
      '<button type="button" class="consent-banner__btn consent-banner__btn--primary" id="consent-accept">Accept</button>' +
      '<button type="button" class="consent-banner__btn" id="consent-essential">Essential only</button>' +
      "</div>";

    document.body.appendChild(banner);
    document.getElementById("consent-accept").addEventListener("click", enableAnalytics);
    document.getElementById("consent-essential").addEventListener("click", essentialOnly);
  }

  window.zaydioConsent = { enableAnalytics: enableAnalytics, essentialOnly: essentialOnly };

  var consent = getConsent();
  if (consent === "accepted") {
    loadScript("https://www.googletagmanager.com/gtag/js?id=" + GA_ID, initAnalytics);
  } else if (consent !== "essential") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", showBanner);
    } else {
      showBanner();
    }
  }
})();
