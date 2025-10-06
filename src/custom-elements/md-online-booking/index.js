import { defineCustomElement } from "vue";
import MdOnlineBooking from "../../components/MdOnlineBooking/MdOnlineBooking.vue";

const VITE_PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL;
const cssHref = `${VITE_PUBLIC_URL}/wix-online-booking.css`;

const VueElement = defineCustomElement(MdOnlineBooking);

class MdOnlineBookingCustomElement extends VueElement {
  static get observedAttributes() {
    return ["data"];
  }

  connectedCallback() {
    super.connectedCallback();
    // this.renderBookingComponent();
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === "data" && newValue) {
      const data = JSON.parse(newValue);
      console.log("md-online-booking: ", data, this);
      if (data && this._instance) {
        this._instance.props.title = data.title || "";
        this._instance.props.token = data.token || "";
        this._instance.props.baseUrl = data.baseUrl || "";
        this._instance.props.siteKey = data.gRecaptchaSiteKey || "";
        this.renderBookingComponent(data);
      }
    }
  }

  renderBookingComponent(data) {
    console.log("renderBookingComponent: ", data)
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
      console.log("renderRecaptcha: ", siteKey)
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
