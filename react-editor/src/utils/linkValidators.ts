// Funciones de validación de enlaces de pago para evitar phishing.

export function isValidPaypalLink(url: string): boolean {
  if (!url) return true; // Si está vacío, es válido (opcional)
  try {
    const u = new URL(url);
    const validDomains = ["paypal.com", "www.paypal.com", "paypal.me"];

    // El protocolo debe ser HTTPS
    if (u.protocol !== "https:") return false;

    // El dominio debe ser uno de los válidos
    const hostname = u.hostname.toLowerCase();
    if (!validDomains.includes(hostname)) return false;

    return true;
  } catch (e) {
    return false; // URL mal formada
  }
}

export function isValidStripeLink(url: string): boolean {
  if (!url) return true; // Si está vacío, es válido (opcional)
  try {
    const u = new URL(url);

    const validDomains = [
      "buy.stripe.com",
      "checkout.stripe.com",
      "billing.stripe.com",
      "connect.stripe.com",
      "dashboard.stripe.com",
      "link.stripe.com",
    ];

    // El protocolo debe ser HTTPS
    if (u.protocol !== "https:") return false;

    // El dominio debe ser uno de los válidos
    const hostname = u.hostname.toLowerCase();
    if (!validDomains.includes(hostname)) return false;

    return true;
  } catch (e) {
    return false;
  }
}
