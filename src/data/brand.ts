export const BRAND = {
  name: 'Bubaé',
  tagline: 'Modern fashion within your budget',
  subtitle: 'Discover stylish, feminine and everyday-ready pieces designed to fit your style — and your budget.',
  phoneRaw: '01345599300',
  phoneDisplay: '+880 1345-599300',
  whatsappNumber: '8801345599300',
  whatsappNumberFormatted: '+880 1345-599300',
  whatsappUrl: 'https://wa.me/8801345599300',
  facebook: 'https://www.facebook.com/share/1Pc1irn6j1/',
  instagram: 'https://www.instagram.com/bubae_3',
  tiktok: 'https://www.tiktok.com/@bubae_3',
  social: {
    facebook: 'https://www.facebook.com/share/1Pc1irn6j1/',
    instagram: 'https://www.instagram.com/bubae_3',
    tiktok: 'https://www.tiktok.com/@bubae_3',
  },
  policies: {
    payment: 'Cash on Delivery (COD) only. No advance product payment or advance delivery fee required. Pay when your order arrives.',
    noReturn: 'Bubaé does NOT accept product returns once an order is placed and delivered.',
    noExchange: 'Bubaé does NOT offer product exchange. Please review sizes and color options carefully before ordering.',
    warningNotice: 'Please note: Bubaé currently offers Cash on Delivery only. We do not accept returns or exchanges. Please make sure you select the correct product, size and color before placing your order.',
    deliveryNote: 'Delivery charges: Inside Sylhet Main Town ৳80, Outside Sylhet Main Town ৳115, Sunamganj & Maulvibazar ৳135, Outside Sylhet ৳155. Cash on delivery nationwide.',
  },
  deliveryZones: [
    { name: 'Inside Sylhet Main Town', charge: 80, feeText: '৳80 (Pay on delivery)', estDays: '1 - 2 business days' },
    { name: 'Outside Sylhet Main Town', charge: 115, feeText: '৳115 (Pay on delivery)', estDays: '2 - 3 business days' },
    { name: 'Sunamganj & Maulvibazar', charge: 135, feeText: '৳135 (Pay on delivery)', estDays: '2 - 3 business days' },
    { name: 'Outside Sylhet', charge: 155, feeText: '৳155 (Pay on delivery)', estDays: '3 - 5 business days' },
  ],
  story: `Bubaé is a modern girls' fashion brand based in Sylhet, Bangladesh, focused on bringing stylish, feminine and trend-conscious clothing within an accessible budget. From everyday outfits to statement looks, Bubaé makes it easier to find fashion that feels like you.`
};

export interface DeliveryZoneOption {
  name: string;
  charge: number;
  feeText: string;
  estDays: string;
}

export const DELIVERY_ZONES: DeliveryZoneOption[] = [
  { name: 'Inside Sylhet Main Town', charge: 80, feeText: '৳80', estDays: '1 - 2 business days' },
  { name: 'Outside Sylhet Main Town', charge: 115, feeText: '৳115', estDays: '2 - 3 business days' },
  { name: 'Sunamganj & Maulvibazar', charge: 135, feeText: '৳135', estDays: '2 - 3 business days' },
  { name: 'Outside Sylhet', charge: 155, feeText: '৳155', estDays: '3 - 5 business days' },
];

export const DEFAULT_DELIVERY_ZONE = DELIVERY_ZONES[0];
