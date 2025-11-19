class MdOnlineBookingCustomElement extends HTMLElement {
  static get observedAttributes() {
    return ["data"];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    // If no `data` attribute is provided, render with defaults.
    if (!this.hasAttribute("data")) {
      this.renderBookingComponent();
    }
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === "data" && newValue) {
      try {
        this.renderBookingComponent(JSON.parse(newValue));
      } catch (err) {
        console.warn("md-online-booking: failed to parse data attribute", err);
      }
      this.renderBookingComponent();
    }
  }

  renderBookingComponent(data = {}) {
    const base = `${
      data.baseUrl ?? "https://test.mechanicdesk.com.au"
    }/online-booking/index.html`;
    const token = data.token ?? "33c80969233e57bc7ada47858f05323f019dfa08";
    const backgroundColor = data.backgroundColor || "#FFFFFF";
    const textColor = data.textColor || "#000000";
    const buttonBackgroundColor = data.buttonBackgroundColor || "#1677ff";
    const buttonTextColor = data.buttonTextColor || "#FFFFFF";

    try {
      const params = new URLSearchParams();
      params.set("token", token);
      params.set("backgroundColor", backgroundColor);
      params.set("textColor", textColor);
      params.set("buttonBackgroundColor", buttonBackgroundColor);
      params.set("buttonTextColor", buttonTextColor);
      const src = `${base}?${params.toString()}`;
      this.renderIframe(src);
    } catch (err) {
      console.error(
        "md-online-booking: failed to build iframe src, using default",
        err
      );
    }
  }

  renderIframe(src) {
    this.innerHTML = "";

    // inject styles for spinner if not already present
    if (!document.getElementById("md-online-booking-styles")) {
      const style = document.createElement("style");
      style.id = "md-online-booking-styles";
      style.textContent = `
        @keyframes md-rotate { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .md-ob-loader-spinner { width:40px; height:40px; border:4px solid #ddd; border-top-color:gray; border-radius:50%; animation: md-rotate 1s linear infinite; }
      `;
      document.head.appendChild(style);
    }

    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.maxWidth = "100%";
    container.style.minHeight = "1080px";
    container.style.boxSizing = "border-box";
    container.style.position = "relative";

    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.setAttribute("title", "Online Booking");
    iframe.setAttribute("loading", "lazy");

    // Loader overlay
    const loader = document.createElement("div");
    loader.style.position = "absolute";
    loader.style.top = "0";
    loader.style.left = "0";
    loader.style.right = "0";
    loader.style.bottom = "0";
    loader.style.display = "flex";
    loader.style.alignItems = "center";
    loader.style.justifyContent = "center";
    loader.style.background = "rgba(255,255,255,0.9)";
    loader.style.zIndex = "999";

    const loaderContent = document.createElement("div");
    loaderContent.style.textAlign = "center";
    const spinner = document.createElement("div");
    spinner.className = "md-ob-loader-spinner";
    spinner.style.margin = "0 auto 12px";
    const label = document.createElement("div");
    label.textContent = "Loading booking...";
    label.style.fontSize = "14px";
    label.style.color = "#333";

    loaderContent.appendChild(spinner);
    loaderContent.appendChild(label);
    loader.appendChild(loaderContent);

    // Fallback container (hidden by default)
    const fallback = document.createElement("div");
    fallback.style.padding = "12px";
    fallback.style.display = "none";
    fallback.style.textAlign = "center";
    fallback.innerHTML = `If the booking frame is blocked, <a href="${src}" target="_blank" rel="noopener">open the booking page in a new tab</a>.`;

    container.appendChild(iframe);
    container.appendChild(loader);
    container.appendChild(fallback);
    this.appendChild(container);

    // Hide loader when iframe loads
    let settled = false;
    const clearAndHide = () => {
      if (settled) return;
      settled = true;
      if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
      if (fallback && fallback.style) fallback.style.display = "none";
    };

    iframe.addEventListener("load", () => {
      clearAndHide();
    });

    // Timeout: if iframe doesn't load in time (blocked by X-Frame-Options), show fallback link
    const timeoutMs = 8000;
    const t = setTimeout(() => {
      if (settled) return;
      // remove loader and show fallback message
      settled = true;
      if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
      if (fallback) fallback.style.display = "block";
    }, timeoutMs);

    // Clean up timer when element is removed
    const observer = new MutationObserver(() => {
      if (!document.contains(this)) {
        clearTimeout(t);
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
}

customElements.define("md-online-booking", MdOnlineBookingCustomElement);
