import { defineCustomElement } from "vue";
import MdOnlineBooking from "../../components/MdOnlineBooking/MdOnlineBooking.vue";

const VITE_PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL;
const cssHref = `${VITE_PUBLIC_URL}/wix-online-booking.css`;

const VueElement = defineCustomElement(MdOnlineBooking);

class MdOnlineBookingCustomElement extends VueElement {
  static get observedAttributes() {
    return ["data"];
  }

  constructor() {
    super();
    this._pendingData = null;
  }

  connectedCallback() {
    super.connectedCallback(); // rất quan trọng
    // Nếu có dữ liệu pending, render sau khi instance sẵn sàng
    if (this._pendingData) {
      this.applyData(this._pendingData);
      this._pendingData = null;
    }
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === "data" && newValue) {
      const data = JSON.parse(newValue);
      if (this._instance) {
        this.applyData(data);
      } else {
        // lưu lại để xử lý sau khi mount xong
        this._pendingData = data;
      }
    }
  }


  applyData(data) {
    Object.assign(this._instance.props, {
      title: data.title || "",
      token: data.token || "",
      baseUrl: data.baseUrl || "",
      siteKey: data.gRecaptchaSiteKey || "",
    });
    this.renderBookingComponent(data);
  }

  renderBookingComponent(data) {
    this.addStyles(data?.publicUrl);
    this.renderRecaptcha(data?.gRecaptchaSiteKey);
  }

  addStyles(publicUrl) {

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = publicUrl ? `${publicUrl}/wix-online-booking.css` : cssHref;
    link.setAttribute("data-custom-css", "true");

    const container = document.getElementsByClassName(
      "online-booking-container"
    )[0];

    const existingLink = container?.querySelector(`link[data-custom-css]`);
    existingLink?.remove();
    container?.appendChild(link.cloneNode(true));

    const shadowExistingLink = this.shadowRoot?.querySelector(
      `link[data-custom-css]`
    );
    shadowExistingLink?.remove();
    this.shadowRoot?.appendChild(link.cloneNode(true));
  }

  renderRecaptcha(siteKey) {
    if (siteKey) {
      const container = document.getElementsByClassName(
        "online-booking-container"
      )[0];
      if (!container) return;

      // Avoid multiple mount
      if (!document.getElementById("g-recaptcha")) {
        const mount = document.createElement("div");
        mount.id = "g-recaptcha";
        mount.className = "g-recaptcha";
        mount.style = "position: absolute;bottom: calc(var(--spacing) * 26);";
        container.appendChild(mount);
      }

      const isCaptchaRendered = () => {
        const el = document.getElementById("g-recaptcha");
        return !!el && el.querySelector("iframe") !== null;
      };

      const checkAndRenderCaptcha = () => {
        if (isCaptchaRendered()) return;

        if (
          window.grecaptcha?.render &&
          document.getElementById("g-recaptcha")
        ) {
          try {
            window.grecaptcha.render("g-recaptcha", { sitekey: siteKey });
          } catch (err) {
            console.error("reCAPTCHA render error:", err);
          }
        } else {
          setTimeout(checkAndRenderCaptcha, 500);
        }
      };

      const scriptSrc =
        "https://www.google.com/recaptcha/api.js?render=explicit";
      if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
        const script = document.createElement("script");
        script.src = scriptSrc;
        script.async = true;
        script.defer = true;
        script.onload = checkAndRenderCaptcha;
        document.head.appendChild(script);
      } else {
        checkAndRenderCaptcha();
      }
    }
  }
}

customElements.define("md-online-booking", MdOnlineBookingCustomElement);
