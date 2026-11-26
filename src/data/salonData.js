export const HERO_LOOKS = [
  {
    id: 'red-bride',
    label: 'Red Lehenga Bride',
    packageName: 'HD Royal Bridal',
    price: 25000,
    artist: 'Riya Sen (Lead Bridal)',
    tagline: 'Signature crimson glam with 16-hr waterproof lock',
  },
  {
    id: 'pastel-bride',
    label: 'Pastel Bride',
    packageName: 'Airbrush Pastel Bridal',
    price: 35000,
    artist: 'Riya Sen (Lead Bridal)',
    tagline: 'Featherlight dewy airbrush for daytime pheras',
  },
  {
    id: 'engagement',
    label: 'Engagement Look',
    packageName: 'Shimmer Cocktail Glam',
    price: 15000,
    artist: 'Neha Kapoor',
    tagline: 'Soft smokey eyes & sculpted glass-skin radiance',
  },
  {
    id: 'groom',
    label: 'Groom Look',
    packageName: 'Royal Groom Package',
    price: 8000,
    artist: 'Arjun Mehta',
    tagline: 'Matte camera-ready skin, beard sculpting & hair',
  },
];

export const PACKAGES = [
  { id: 'hd-bridal', name: 'HD Bridal', price: 25000, advance: 10000, duration: '3.5 Hrs', tag: 'Most Booked' },
  { id: 'airbrush-bridal', name: 'Airbrush Bridal', price: 35000, advance: 10000, duration: '4 Hrs', tag: 'Luxury Matte' },
  { id: 'engagement', name: 'Engagement', price: 15000, advance: 5000, duration: '2.5 Hrs', tag: 'Cocktail Ready' },
  { id: 'party-makeup', name: 'Party Makeup', price: 5000, advance: 1500, duration: '90 Min', tag: 'Family & Friends' },
  { id: 'groom-package', name: 'Groom Package', price: 8000, advance: 2500, duration: '2 Hrs', tag: 'Dulha Special' },
];

export const SERVICES_DATA = {
  Hair: [
    { id: 'haircut', name: 'Signature Haircut & Blowdry', price: 499, duration: '45 min' },
    { id: 'hairspa', name: 'Moroccan Keratin Hair Spa', price: 999, duration: '60 min' },
    { id: 'haircolor', name: 'Global Gloss / Root Touch-up', price: 2499, duration: '90 min' },
  ],
  Skin: [
    { id: 'facial', name: 'Hydra-Glow Bridal Facial', price: 1499, duration: '60 min' },
    { id: 'cleanup', name: 'De-Tan & Diamond Clean-up', price: 799, duration: '40 min' },
    { id: 'dtan', name: 'Full Body Polish & Radiance', price: 2199, duration: '75 min' },
  ],
  Makeup: [
    { id: 'party-mu', name: 'HD Party Makeup + Draping', price: 5000, duration: '90 min' },
    { id: 'engage-mu', name: 'Engagement Shimmer Glam', price: 15000, duration: '2.5 hrs' },
    { id: 'hd-bridal-mu', name: 'HD Royal Bridal Makeup', price: 25000, duration: '3.5 hrs' },
  ],
  Groom: [
    { id: 'beard', name: 'Royal Beard Sculpt & Steam', price: 299, duration: '30 min' },
    { id: 'groom-glow', name: 'Groom Charcoal Facial + Hair', price: 1799, duration: '60 min' },
    { id: 'groom-pkg', name: 'Complete Groom HD Package', price: 8000, duration: '2 hrs' },
  ],
};

export const GALLERY_SLIDERS = [
  {
    id: 'look-1',
    title: 'Crimson Bridal Transformation',
    bride: 'Ananya Rathore · Jaipur',
    package: 'HD Bridal · Kundan Set',
    beforeVariant: 'pastel-bride',
    afterVariant: 'red-bride',
    beforeLabel: 'Bare Prep Skin',
    afterLabel: 'HD Royal Bridal',
  },
  {
    id: 'look-2',
    title: 'Daylight Pastel Airbrush',
    bride: 'Meera Jain · Ajmer',
    package: 'Airbrush Bridal · Polki',
    beforeVariant: 'engagement',
    afterVariant: 'pastel-bride',
    beforeLabel: 'Natural Tone',
    afterLabel: 'Dewy Airbrush',
  },
  {
    id: 'look-3',
    title: 'Royal Dulha Grooming',
    bride: 'Rohan Mathur · Ajmer',
    package: 'Groom HD + Beard Sculpt',
    beforeVariant: 'engagement',
    afterVariant: 'groom',
    beforeLabel: 'Pre-Styling',
    afterLabel: 'Safa & Matte HD',
  },
];

export const REAL_BRIDES = [
  { name: 'Ananya Rathore', city: 'Jaipur', look: 'Red Lehenga · HD Bridal', artist: 'Riya Sen', variant: 'red-bride' },
  { name: 'Meera Jain', city: 'Ajmer', look: 'Blush Pastel · Airbrush', artist: 'Riya Sen', variant: 'pastel-bride' },
  { name: 'Sana Sheikh', city: 'Ajmer', look: 'Lilac Shimmer · Engagement', artist: 'Neha Kapoor', variant: 'engagement' },
  { name: 'Rohan & Simran', city: 'Pushkar', look: 'Royal Groom + Bridal Duo', artist: 'Arjun & Riya', variant: 'groom' },
];
