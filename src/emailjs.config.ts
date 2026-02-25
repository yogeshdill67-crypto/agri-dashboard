// EmailJS Configuration
// Sign up at https://www.emailjs.com/ and fill these in
export const EMAILJS_CONFIG = {
    SERVICE_ID: '',       // e.g. 'service_abc123'
    TEMPLATE_ID: '',      // e.g. 'template_xyz789'
    PUBLIC_KEY: '',       // e.g. 'user_XXXXXXXX'
};

export const isEmailJSConfigured = () =>
    !!(EMAILJS_CONFIG.SERVICE_ID && EMAILJS_CONFIG.TEMPLATE_ID && EMAILJS_CONFIG.PUBLIC_KEY);
