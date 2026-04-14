// ARCHIVO: page-transition.js
// DESCRIPCION: Logica y comportamiento de esta parte de ClanLedger.

(function () {
  const ENTER_CLASS = "pt-ready";
  const LOADING_CLASS = "pt-loading";
  const LEAVE_CLASS = "pt-leave";
  const FADE_MS = 140;

  const root = document.documentElement;
  root.classList.add(LOADING_CLASS);

  // FUNCION: isModifiedClick - explica su proposito, entradas y salida.
  function isModifiedClick(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  // FUNCION: shouldHandleLink - explica su proposito, entradas y salida.
  function shouldHandleLink(link, event) {
    if (!link || event.defaultPrevented) return false;
    if (event.button !== 0 || isModifiedClick(event)) return false;
    if (link.target && link.target.toLowerCase() !== "_self") return false;
    if (link.hasAttribute("download")) return false;

    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
      return false;
    }

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return false;

    const sameDocument =
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      url.hash;
    if (sameDocument) return false;

    return true;
  }

  let leaving = false;

  // FUNCION: navigateWithFade - explica su proposito, entradas y salida.
  function navigateWithFade(url) {
    if (leaving) return;
    leaving = true;
    root.classList.remove(ENTER_CLASS);
    root.classList.add(LEAVE_CLASS);

    window.setTimeout(function () {
      window.location.href = url;
    }, FADE_MS);
  }

  window.navigateWithFade = navigateWithFade;

  document.addEventListener("DOMContentLoaded", function () {
    window.requestAnimationFrame(function () {
      root.classList.remove(LOADING_CLASS);
      root.classList.add(ENTER_CLASS);
    });
  });

  document.addEventListener(
    "click",
    function (event) {
      const link = event.target.closest("a[href]");
      if (!shouldHandleLink(link, event)) return;

      event.preventDefault();
      navigateWithFade(link.href);
    },
    true,
  );
})();

