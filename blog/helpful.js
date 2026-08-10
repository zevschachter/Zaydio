(function () {
  var COUNT_THRESHOLD = 5;
  var STORAGE_PREFIX = "zaydio-helpful:";
  // Site palette, from the --color-* custom properties in zaydio.css.
  var CONFETTI_COLORS = [
    "#4ECDC4",
    "#FFD93D",
    "#FF6B6B",
    "#C084FC",
    "#6BCB77",
    "#FF8C42",
    "#38B2AC",
  ];

  function slugFromPath() {
    var path = window.location.pathname.replace(/\/+$/, "");
    if (path.charAt(0) === "/") path = path.slice(1);
    return path;
  }

  function storageKey(slug) {
    return STORAGE_PREFIX + slug;
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
      return false;
    }
  }

  function setThanks(root, lang) {
    var btn = root.querySelector(".blog-helpful-btn");
    var label = root.querySelector(".blog-helpful-label");
    if (!btn) return;
    btn.disabled = true;
    btn.setAttribute("aria-disabled", "true");
    root.classList.add("is-thanks");
    var text = lang === "es" ? "¡Gracias!" : "Thanks!";
    if (label) label.textContent = text;
    btn.setAttribute("aria-label", text);
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

  function celebrate(root) {
    if (prefersReducedMotion()) return;
    root.classList.add("is-popping");
    window.setTimeout(function () {
      root.classList.remove("is-popping");
    }, 600);
    confetti(root.querySelector(".blog-helpful-confetti"));
  }

  function confetti(canvas) {
    if (!canvas || typeof canvas.getContext !== "function") return;
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if (!width || !height) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    canvas.classList.add("is-firing");

    var parts = [];
    for (var i = 0; i < 34; i++) {
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * 2;
      var speed = 5 + Math.random() * 7;
      parts.push({
        x: width / 2,
        y: height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        life: 0,
        ttl: 55 + Math.random() * 25,
      });
    }

    (function frame() {
      ctx.clearRect(0, 0, width, height);
      var alive = 0;
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        p.life++;
        if (p.life > p.ttl) continue;
        alive++;
        p.vy += 0.3;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.ttl);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) {
        window.requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
        canvas.classList.remove("is-firing");
      }
    })();
  }

  function bindClick(root, btn, slug, lang, state) {
    btn.addEventListener("click", function onClick() {
      if (btn.disabled) return;
      state.voted = true;

      // Celebrate first and never take it back: a storage outage must not
      // turn a thank-you into a broken-looking control.
      try {
        window.localStorage.setItem(storageKey(slug), "1");
      } catch (_) {
        /* ignore quota / private mode */
      }
      setThanks(root, lang);
      celebrate(root);
      root.classList.add("is-filled");

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
          if (typeof data.count === "number") {
            state.count = data.count;
            state.confirmed = true;
          } else {
            state.count += 1;
          }
          showCount(root, state.count, lang);
        })
        .catch(function () {
          /* count stays as-is; the vote still reads as received */
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

    var state = { count: 0, voted: false, confirmed: false };

    if (already) {
      // Restored state, not a fresh vote: no pop, no confetti.
      setThanks(root, lang);
      root.classList.add("is-filled");
    } else {
      bindClick(root, btn, slug, lang, state);
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
        if (state.confirmed) return;
        var server = typeof data.count === "number" ? data.count : 0;
        // A vote landing before this response isn't reflected in it yet.
        state.count = state.voted ? server + 1 : server;
        showCount(root, state.count, lang);
      })
      .catch(function () {
        // KV unavailable: hide the count, keep the button usable.
        showCount(root, 0, lang);
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
