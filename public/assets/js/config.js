/* Edit this file on the server after deploy - it is deliberately NOT fingerprinted or cached.
 *
 * leadEndpoint  URL that accepts a JSON POST for every enquiry (your CRM / backend / Zapier / Make webhook).
 *               While it is empty, every form hands the enquiry to WhatsApp instead, so no lead is lost.
 * appStoreUrl / playStoreUrl  Real store links for the "Download for iOS / Android" buttons on the home page.
 *               While empty, those buttons are shown as "coming soon" and are not clickable.
 */
window.EMLEN_CONFIG = {
  leadEndpoint: '',
  whatsappNumber: '919814953954',
  appStoreUrl: '',
  playStoreUrl: ''
};
