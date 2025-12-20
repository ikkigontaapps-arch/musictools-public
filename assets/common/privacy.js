(() => {
  const STORAGE_KEY = "ukulele-tools:cookie-consent";
  const GA_MEASUREMENT_ID = "G-F3TLQM3DW2";
  const ADSENSE_CLIENT_ID = ""; // Optional: ca-pub-xxxxxxxxxxxxxxxx

  const banner = document.getElementById("cookie-banner");
  if (!banner) return;

  const quickActions = document.getElementById("cookie-quick-actions");
  const preferencesPanel = document.getElementById("cookie-preferences");
  const openPreferencesButton = document.getElementById("cookie-open-preferences");
  const preferencesBackButton = document.getElementById("cookie-preferences-back");
  const analyticsToggle = document.getElementById("consent-analytics");
  const adsToggle = document.getElementById("consent-ads");
  const saveButton = document.getElementById("cookie-accept-selected");
  const acceptAllButtons = document.querySelectorAll(
    '[data-cookie-action="accept-all"]'
  );
  const rejectAllButtons = document.querySelectorAll(
    '[data-cookie-action="reject-all"]'
  );

  let analyticsLoaded = false;
  let adsLoaded = false;

  const existingConsent = readConsent();
  if (existingConsent) {
    syncToggles(existingConsent);
    applyConsent(existingConsent);
  } else {
    banner.hidden = false;
    showView("quick");
  }

  saveButton?.addEventListener("click", () => {
    const consent = {
      analytics: !!analyticsToggle?.checked,
      ads: !!adsToggle?.checked,
      timestamp: new Date().toISOString(),
    };
    persistConsent(consent);
    hideBanner();
    applyConsent(consent);
  });

  acceptAllButtons.forEach((button) =>
    button.addEventListener("click", () => {
      const consent = {
        analytics: true,
        ads: true,
        timestamp: new Date().toISOString(),
      };
      syncToggles(consent);
      persistConsent(consent);
      hideBanner();
      applyConsent(consent);
    })
  );

  rejectAllButtons.forEach((button) =>
    button.addEventListener("click", () => {
      const consent = {
        analytics: false,
        ads: false,
        timestamp: new Date().toISOString(),
      };
      syncToggles(consent);
      persistConsent(consent);
      disableAnalytics();
      hideBanner();
    })
  );

  openPreferencesButton?.addEventListener("click", () => {
    showView("preferences");
  });

  preferencesBackButton?.addEventListener("click", () => {
    showView("quick");
  });

  window.cookieConsent = {
    showPreferences: () => {
      banner.hidden = false;
      const consent = readConsent();
      if (consent) {
        syncToggles(consent);
      }
      showView("preferences");
    },
    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      if (analyticsToggle) analyticsToggle.checked = true;
      if (adsToggle) adsToggle.checked = false;
      showView("quick");
      banner.hidden = false;
    },
  };

  function applyConsent(consent) {
    if (!consent) return;
    if (consent.analytics) {
      enableAnalytics();
    } else {
      disableAnalytics();
    }
    if (consent.ads) {
      enableAds();
    }
  }

  function syncToggles(consent) {
    if (!consent) return;
    if (analyticsToggle) analyticsToggle.checked = !!consent.analytics;
    if (adsToggle) adsToggle.checked = !!consent.ads;
  }

  function showView(view) {
    if (!quickActions || !preferencesPanel) return;
    const showPreferences = view === "preferences";
    quickActions.hidden = showPreferences;
    preferencesPanel.hidden = !showPreferences;
  }

  function hideBanner() {
    banner.hidden = true;
    showView("quick");
  }

  function enableAnalytics() {
    if (!isValidId(GA_MEASUREMENT_ID)) {
      return;
    }

    window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;

    if (analyticsLoaded) {
      if (typeof window.gtag === "function") {
        window.gtag("config", GA_MEASUREMENT_ID, {
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
      }
      return;
    }

    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };

    loadScript(
      `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`,
      { async: true }
    ).then(() => {
      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    });
  }

  function disableAnalytics() {
    if (!isValidId(GA_MEASUREMENT_ID)) return;
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  }

  function enableAds() {
    if (adsLoaded || !isValidId(ADSENSE_CLIENT_ID)) {
      return;
    }

    adsLoaded = true;
    loadScript(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        ADSENSE_CLIENT_ID
      )}`,
      { async: true, crossorigin: "anonymous" }
    );
  }

  function readConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("Failed to parse cookie consent:", error);
      return null;
    }
  }

  function persistConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn("Failed to persist cookie consent:", error);
    }
  }

  function isValidId(id) {
    return typeof id === "string" && id.trim() !== "" && !/X{5,}/i.test(id);
  }

  function loadScript(src, attributes = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      Object.entries(attributes).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        if (key === "async") {
          script.async = !!value;
          return;
        }
        script.setAttribute(key, value);
      });

      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });
  }
})();
