(function () {
  if (typeof gtag !== "function") return;
  if (window.zaydioAnalyticsReady) return;
  window.zaydioAnalyticsReady = true;

  function track(eventName, params) {
    gtag("event", eventName, params || {});
  }

  document.addEventListener("click", function (e) {
    var el = e.target;
    while (el && el !== document) {
      var href = el.getAttribute && el.getAttribute("href");
      if (href) {
        if (href.indexOf("open.spotify.com") !== -1) {
          track("stream_click", { platform: "spotify", link_url: href });
          return;
        }
        if (href.indexOf("music.apple.com") !== -1) {
          track("stream_click", { platform: "apple_music", link_url: href });
          return;
        }
        if (href.indexOf("music.amazon.com") !== -1) {
          track("stream_click", { platform: "amazon_music", link_url: href });
          return;
        }
        if (href.indexOf("youtube.com") !== -1 || href.indexOf("youtu.be") !== -1) {
          track("video_click", { platform: "youtube", link_url: href });
          return;
        }
        if (href.indexOf("parents.html") !== -1) {
          track("parents_page_click", { link_url: href });
          return;
        }
        if (href.indexOf("privacy.html") !== -1) {
          track("privacy_page_click", { link_url: href });
          return;
        }
      }
      if (el.classList && el.classList.contains("share-copy")) {
        track("share_click", { method: "copy_link" });
        return;
      }
      if (el.classList && (el.classList.contains("share-whatsapp") || el.classList.contains("share-facebook") || el.classList.contains("share-x"))) {
        track("share_click", { method: el.className.split(" ").pop() });
        return;
      }
      el = el.parentElement;
    }
  });

  var path = document.location.pathname;
  if (path.indexOf("parents.html") !== -1) track("parents_page_view");
  if (path.indexOf("privacy.html") !== -1) track("privacy_page_view");
})();
