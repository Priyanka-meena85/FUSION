const { z } = require('zod');

const PACKAGE_CATALOG = {
  'HD Bridal': { price: 25000, advance: 10000 },
  'Airbrush Bridal': { price: 35000, advance: 10000 },
  Engagement: { price: 15000, advance: 5000 },
  'Party Makeup': { price: 5000, advance: 1500 },
  'Groom Package': { price: 8000, advance: 2500 },
};

const CITY_TRAVEL_CATALOG = {
  Ajmer: 0,
  Kishangarh: 1500,
  Pushkar: 1500,
  Jaipur: 3500,
  Udaipur: 5000,
};

const UPSELL_CATALOG = {
  'Pre-Bridal Hydra Facial': 1499,
  'Saree / Dupatta Draping Artist': 1200,
};

const loginSchema = z.object({
  pin: z.string().min(4).max(32),
});

const createBookingSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(24),
  city: z.string().trim().min(2).max(60),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid event_date format (YYYY-MM-DD)'),
  package_name: z.string().trim().min(2).max(100),
  makeup_type: z.string().trim().max(300).optional().default('HD'),
  lehenga_colour: z.string().trim().max(60).optional().default('Red'),
  jewellery: z.string().trim().max(60).optional().default('Kundan'),
  artist_name: z.string().trim().min(2).max(80).optional().default('Riya Sen'),
  mode: z.enum(['pay', 'hold', 'token']).optional().default('pay'),
});

const rescheduleSchema = z.object({
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid new_date format (YYYY-MM-DD)'),
});

const upsellSchema = z.object({
  item_name: z.string().trim().min(2).max(100),
});

const waitlistSchema = z.object({
  date_str: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bride_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(24),
  package_name: z.string().trim().min(2).max(100),
});

const prepFormSchema = z.object({
  lehenga_colour: z.string().trim().min(1).max(100),
  blouse_note: z.string().trim().max(200).optional().default(''),
  jewellery: z.string().trim().min(1).max(120),
  lens_needed: z.string().trim().max(100).optional().default(''),
  extension_needed: z.string().trim().max(100).optional().default(''),
});

const reviewSchema = z.object({
  bride_name: z.string().trim().min(2).max(80),
  city: z.string().trim().max(60).optional().default('Ajmer'),
  look_type: z.string().trim().max(80).optional().default('Bridal Look'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(4).max(500),
});

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(24),
  source: z.string().trim().min(2).max(40).optional().default('Website'),
  city: z.string().trim().max(60).optional().default('Ajmer'),
  event_date: z.string().trim().max(30).optional().default(''),
  makeup_type: z.string().trim().max(80).optional().default('HD Bridal'),
  status: z.string().trim().max(40).optional().default('New'),
  notes: z.string().trim().max(400).optional().default(''),
});

const campaignToggleSchema = z.object({
  enabled: z.boolean(),
});

const verifyPaymentSchema = z.object({
  booking_id: z.number().int().positive(),
  orderId: z.string().min(3),
  paymentId: z.string().min(3),
  signature: z.string().min(6),
});

function validateImageMagicBytes(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const isWebp =
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return isJpeg || isPng || isWebp;
}

module.exports = {
  PACKAGE_CATALOG,
  CITY_TRAVEL_CATALOG,
  UPSELL_CATALOG,
  loginSchema,
  createBookingSchema,
  rescheduleSchema,
  upsellSchema,
  waitlistSchema,
  prepFormSchema,
  reviewSchema,
  leadSchema,
  campaignToggleSchema,
  verifyPaymentSchema,
  validateImageMagicBytes,
};
