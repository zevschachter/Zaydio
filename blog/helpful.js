(function () {
  var COUNT_THRESHOLD = 5;
  var STORAGE_PREFIX = "zaydio-helpful:";

  function slugFromPath() {
    var path = window.location.pathname.replace(/\/+$/, "");
    if (path.charAt(0) === "/") path = path.slice(1);
    return path;
  }

  function storageKey(slug) {
    return STORAGE_PREFIX + slug;
  }

  function setThanks(root, lang) {
    var btn = root.querySelector(".blog-helpful-btn");
    var label = root.querySelector(".blog-helpful-label");
    if (!btn || !label) return;
    btn.disabled = true;
    btn.setAttribute("aria-disabled", "true");
    root.classList.add("is-thanks");
    label.textContent = lang === "es" ? "¡Gracias!" : "Thanks!";
    btn.setAttribute("aria-label", label.textContent);
  }

  function showCount(root, count, lang) {
    var el = root.querySelector(".blog-helpful-count");
    if (!el) return;
    if (typeof count !== "number" || count < COUNT_THRESHOLD) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent =
      lang === "es"
        ? "A " + count + " familias les ayudó esto"
        : count + " parents found this helpful";
  }

  function bindClick(root, btn, slug, lang, getCount) {
    btn.addEventListener("click", function onClick() {
      if (btn.disabled) return;
      btn.disabled = true;
      root.classList.add("is-popping");

      fetch("/api/helpful", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ slug: slug }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("bad status");
          return res.json();
        })
        .then(function (data) {
          var next =
            typeof data.count === "number" ? data.count : getCount() + 1;
          try {
            window.localStorage.setItem(storageKey(slug), "1");
          } catch (_) {
            /* ignore quota / private mode */
          }
          setThanks(root, lang);
          showCount(root, next, lang);
          window.setTimeout(function () {
            root.classList.remove("is-popping");
            root.classList.add("is-filled");
          }, 280);
        })
        .catch(function () {
          root.classList.remove("is-popping");
          btn.disabled = false;
        });
    });
  }

  function initOne(root) {
    var lang = root.getAttribute("data-lang") === "es" ? "es" : "en";
    var slug = root.getAttribute("data-slug") || slugFromPath();
    if (!slug) {
      root.hidden = true;
      return;
    }

    var btn = root.querySelector(".blog-helpful-btn");
    if (!btn) {
      root.hidden = true;
      return;
    }

    // Always show the control; storage outages must not hide it.
    root.hidden = false;

    var already = false;
    try {
      already = window.localStorage.getItem(storageKey(slug)) === "1";
    } catch (_) {
      already = false;
    }

    var count = 0;
    if (already) {
      setThanks(root, lang);
    }

    fetch("/api/helpful?slug=" + encodeURIComponent(slug), {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    })
      .then(function (res) {
        if (!res.ok) throw new Error("bad status");
        return res.json();
      })
      .then(function (data) {
        count = typeof data.count === "number" ? data.count : 0;
        showCount(root, count, lang);
        if (already) {
          setThanks(root, lang);
          return;
        }
        bindClick(root, btn, slug, lang, function () {
          return count;
        });
      })
      .catch(function () {
        showCount(root, 0, lang);
        if (already) return;
        // Still allow clicks; POST may succeed once KV is linked.
        bindClick(root, btn, slug, lang, function () {
          return count;
        });
      });
  }

  function bootHelpful() {
    var nodes = document.querySelectorAll("[data-helpful]");
    for (var i = 0; i < nodes.length; i++) initOne(nodes[i]);
  }

  function bootSignup() {
    if (window.location.search.indexOf("signedup=1") === -1) return;
    var boxes = document.querySelectorAll(".blog-signup");
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var success = box.querySelector(".blog-signup-success");
      if (success) success.hidden = false;
      box.classList.add("is-success");
    }
  }

  function boot() {
    bootHelpful();
    bootSignup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
