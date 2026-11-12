// Everything you are likely to change lives here.
export const config = {
  // The address Google should treat as the real one. Every canonical tag and sitemap entry uses it.
  siteUrl: 'https://sellmywarehousedirect.com',
  brand: 'Sell Your Warehouse Direct',
  brandShort: 'Sell Your Warehouse',
  phone: '361-537-7255',
  phoneTel: '+13615377255',
  email: 'info@sellyourwarehousedirect.com',
  city: 'Houston',
  region: 'TX',
  postalCode: '77008',

  // Where the offer form sends leads.
  formEndpoint: 'https://formspree.io/f/mzdqpegr',

  // Tracking. Leave blank to ship with no tracking; fill in to switch it on.
  ga4Id: '', // e.g. 'G-XXXXXXXXXX'
  googleAdsId: '', // e.g. 'AW-123456789'
  googleAdsLeadLabel: '', // conversion label for a submitted form, e.g. 'AbCdEfGhIj'
  googleAdsCallLabel: '', // conversion label for a tap on the phone number

  // Seller quotes on the home page. Only real, verifiable sellers belong here. Set to false to hide them.
  showTestimonials: true,

  // Social image used when a page is shared.
  ogImage:
    'https://static.wixstatic.com/media/41e014_befb8d0330ae433f8bd6d64294e17d00~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_80,enc_avif,quality_auto/41e014_befb8d0330ae433f8bd6d64294e17d00~mv2.jpg',

  // Real company profiles only (Facebook, LinkedIn, Google Business). Used in structured data.
  sameAs: [],

  // Metro pages featured on the home page, in this order.
  featuredMetros: [
    'houston-tx', 'dallas-fort-worth-tx', 'san-antonio-tx', 'austin-tx', 'atlanta-ga', 'chicago-il',
    'los-angeles-ca', 'inland-empire-ca', 'phoenix-az', 'northern-new-jersey', 'miami-fl', 'memphis-tn',
    'indianapolis-in', 'columbus-oh', 'nashville-tn', 'charlotte-nc',
  ],
};
