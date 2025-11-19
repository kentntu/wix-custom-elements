const STYLE_ELEMENT_ID = "md-custom-theme-styles";

const createStyle = (themeData) => {
  const cssVars = Object.entries(themeData)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");

  return `
    :root {
      ${cssVars}
    }
    #WIX_ADS { display: none !important; }
    .site-root { top: 0 !important; }
  `.trim();
};

const applyThemeStyle = (themeData) => {
  const existingStyle = document.getElementById(STYLE_ELEMENT_ID);
  existingStyle?.remove();

  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = createStyle(themeData);

  const siteContainer = document.getElementById("SITE_CONTAINER");
  if (siteContainer?.parentNode) {
    siteContainer.parentNode.insertBefore(style, siteContainer);
    console.log("[md-custom-theme-styles] Applied:", themeData);
  } else {
    console.warn("[md-custom-theme-styles] SITE_CONTAINER not found.");
  }
};

class WixCustomThemeStyles extends HTMLElement {
  static get observedAttributes() {
    return ["theme-data", "target"];
  }

  connectedCallback() {
    this.updateTheme();
  }

  disconnectedCallback() {
    // ✅ clear interval khi element bị remove khỏi DOM
    clearInterval(this.interval);
    console.log("Custom Element unmounted");

  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log("name: ", name, newValue);
    if (name === "theme-data" && oldValue !== newValue) {
      this.updateTheme();
    }

    if (name === "target") {
      // Notify parent frame (useful for editor or preview mode in Wix)
      window.parent?.postMessage?.(
        {
          key: "WIX_PAGE_URL",
          isAnchor: true,
          payload: newValue,
        },
        "*"
      );
    }
    // this.updateTheme();
  }

  updateTheme() {
    const raw = this.getAttribute("theme-data");
    if (!raw) return;

    try {
      const themeData = JSON.parse(raw);
      applyThemeStyle(themeData);

      console.log("try to change button style of contact form")
      this.interval = setInterval(() => {
        let buttonFound = false
        document.querySelectorAll('.contact-form button').forEach(btn => {
          const span = btn.querySelector('span');
          const text = span ? span.textContent : btn.textContent;
          if (text.trim().toLowerCase() === 'submit') {
            buttonFound = true;
            btn.style.backgroundColor = themeData['primary-color'];
            btn.style.color = themeData['text-color-on-primary'];
          }
        });

        if (buttonFound) {
          clearInterval(this.interval);
          console.log("✅ Found buttons, stopped interval");
        }
      }, 100);

      // 🔒 Dừng interval sau 2 phút nếu vẫn chưa clear
      setTimeout(() => {
        if (this.interval) {
          clearInterval(this.interval);
          console.warn("⏰ Timeout reached — stopped interval after 2 minutes");
        }
      }, 2 * 60 * 1000); // 120000 ms = 2 minutes
    } catch (err) {
      console.error("[md-custom-theme-styles] Invalid theme-data JSON:", err);
    }
  }
}

// Register only once
if (!customElements.get("md-custom-theme-styles")) {
  customElements.define("md-custom-theme-styles", WixCustomThemeStyles);
}