export const LICENSE_PORTAL_URLS: Record<string, string> = {
  FSSAI: 'https://foodlicenseportal.org/Home/renew?gad_source=1&gad_campaignid=23038392925&gbraid=0AAAAACzocouD9ojWtNfBiCtpWM2iev4Kp&gclid=Cj0KCQjw_7PRBhDcARIsAMjV7jnDkAkl_H_guWUD_Spud_xBdQ1LIoXh2ZWCh0R9HprCRjXePuHlHIcaAj4YEALw_wcB',
  GST: 'https://services.gst.gov.in/services/login',
  'Trade License': 'https://bbmp.gov.in',
  'Shop & Establishment': 'https://ekarmika.karnataka.gov.in/',
  'Fire NOC': 'https://kfireservices.gov.in/',
  'Drug License': 'https://cdsco.gov.in/',
  'Factory License': 'https://labour.gov.in/',
  'Pollution Consent': 'https://kspcb.karnataka.gov.in/',
  'Clinical Establishment License': 'https://clinicalestablishments.gov.in/',
  'Education Board Affiliation': 'https://cbse.gov.in/',
};

export const LICENSE_AUTHORITIES: Record<string, string> = {
  FSSAI: 'Food Safety and Standards Authority of India (FSSAI)',
  GST: 'Central Board of Indirect Taxes and Customs (CBIC)',
  'Trade License': 'Municipal Corporation / GHMC',
  'Shop & Establishment': 'State Labour Department',
  'Fire NOC': 'State Fire Services Department',
  'Drug License': 'Drug Control Department',
  'Factory License': 'Labour & Factory Inspectorate',
  'Pollution Consent': 'State Pollution Control Board',
  'Clinical Establishment License': 'Clinical Establishments Registry',
  'Education Board Affiliation': 'Education Board / CBSE',
};

export function getLicensePortalUrl(type: string): string {
  return LICENSE_PORTAL_URLS[type] || 'https://india.gov.in';
}

export function getLicenseAuthority(type: string): string {
  return LICENSE_AUTHORITIES[type] || 'Government Regulatory Authority';
}
