export interface DeliveryCalculation {
  zone: string;
  charge: number;
  estDays: string;
  description: string;
}

export const BANGLADESH_DISTRICTS = [
  'Sylhet',
  'Sunamganj',
  'Maulvibazar',
  'Habiganj',
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Gazipur',
  'Narayanganj',
  'Cumilla',
  'Cox\'s Bazar',
  'Bogura',
  'Jessore',
  'Other District',
] as const;

export const SYLHET_MAIN_TOWN_VALUE = 'Sylhet Main Town';

export const SYLHET_AREAS = [
  {
    value: 'Sylhet Main Town',
    label: 'Sylhet Main Town (City Corporation, Zindabazar, Ambarkhana, Shibganj, etc.)',
    isMainTown: true,
  },
  {
    value: 'Outside Main Town',
    label: 'Outside Sylhet Main Town (Suburbs & Other Upazilas)',
    isMainTown: false,
  },
  { value: 'Beanibazar', label: 'Beanibazar', isMainTown: false },
  { value: 'Biswanath', label: 'Biswanath', isMainTown: false },
  { value: 'Companiganj', label: 'Companiganj', isMainTown: false },
  { value: 'Fenchuganj', label: 'Fenchuganj', isMainTown: false },
  { value: 'Golapganj', label: 'Golapganj', isMainTown: false },
  { value: 'Gowainghat', label: 'Gowainghat', isMainTown: false },
  { value: 'Jaintiapur', label: 'Jaintiapur', isMainTown: false },
  { value: 'Kanaighat', label: 'Kanaighat', isMainTown: false },
  { value: 'Osmani Nagar', label: 'Osmani Nagar', isMainTown: false },
  { value: 'South Surma (Outside Town)', label: 'South Surma (Outside Town)', isMainTown: false },
  { value: 'Zakiganj', label: 'Zakiganj', isMainTown: false },
  { value: 'Other Sylhet Area', label: 'Other Sylhet Upazila / Area', isMainTown: false },
] as const;

/**
 * Authoritative delivery calculation function.
 * Determines the official delivery zone and charge strictly based on structured location.
 * Customers can never override or bypass this calculation.
 */
export function calculateDelivery(district: string, area?: string): DeliveryCalculation {
  const normDistrict = (district || '').trim().toLowerCase();
  const normArea = (area || '').trim().toLowerCase();

  // Rule 1 & 2: Sylhet District
  if (normDistrict === 'sylhet') {
    const isMainTown =
      normArea === 'sylhet main town' ||
      normArea === 'sylhet city' ||
      normArea === 'city corporation' ||
      normArea.includes('main town');

    if (isMainTown) {
      return {
        zone: 'Inside Sylhet Main Town',
        charge: 80,
        estDays: '1 - 2 business days',
        description: 'Inside Sylhet Main Town — ৳80',
      };
    }

    return {
      zone: 'Outside Sylhet Main Town',
      charge: 115,
      estDays: '2 - 3 business days',
      description: 'Outside Sylhet Main Town — ৳115',
    };
  }

  // Rule 3: Sunamganj or Maulvibazar
  if (
    normDistrict === 'sunamganj' ||
    normDistrict === 'maulvibazar' ||
    normDistrict === 'moulvibazar'
  ) {
    return {
      zone: 'Sunamganj & Maulvibazar',
      charge: 135,
      estDays: '2 - 3 business days',
      description: 'Sunamganj & Maulvibazar — ৳135',
    };
  }

  // Rule 4: Any other location outside Sylhet
  return {
    zone: 'Outside Sylhet',
    charge: 155,
    estDays: '3 - 5 business days',
    description: 'Outside Sylhet — ৳155',
  };
}
