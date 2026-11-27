const crypto = require('node:crypto');

const ALLOWED_SLOTS = new Map([
  ['logo.jpg', 'logo'],
  ['bride-red.jpg', 'bride-red'],
  ['bride-pastel.jpg', 'bride-pastel'],
  ['engagement.jpg', 'engagement'],
  ['groom.jpg', 'groom'],
  ['nails.jpg', 'nails'],
]);

function getCloudinaryConfig() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();
  const configured = Boolean(cloudName && apiKey && apiSecret);
  const validCloudName = /^[a-zA-Z0-9_-]+$/.test(cloudName);
  return {
    configured: configured && validCloudName,
    cloudName: validCloudName ? cloudName : '',
    apiKey,
    apiSecret,
  };
}

function getSlotPublicId(slot) {
  return ALLOWED_SLOTS.get(slot) || null;
}

function buildCloudinaryUrl(slot) {
  const publicId = getSlotPublicId(slot);
  const { cloudName } = getCloudinaryConfig();
  if (!publicId || !cloudName) return null;
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/fusion-salon/${publicId}`;
}

function signCloudinaryParams(params, apiSecret) {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');
}

async function uploadToCloudinary({ slot, dataUrl }) {
  const publicId = getSlotPublicId(slot);
  if (!publicId) {
    throw new Error('Invalid image slot');
  }

  const { configured, cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  if (!configured) {
    throw new Error('Cloudinary credentials are not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder: 'fusion-salon',
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp: String(timestamp),
  };
  const signature = signCloudinaryParams(paramsToSign, apiSecret);

  const form = new URLSearchParams();
  form.set('file', dataUrl);
  form.set('api_key', apiKey);
  form.set('timestamp', String(timestamp));
  form.set('signature', signature);
  form.set('folder', 'fusion-salon');
  form.set('public_id', publicId);
  form.set('overwrite', 'true');
  form.set('invalidate', 'true');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url || !data.public_id) {
    throw new Error('Cloudinary upload failed');
  }

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
  };
}

module.exports = {
  ALLOWED_SLOTS,
  getCloudinaryConfig,
  getSlotPublicId,
  buildCloudinaryUrl,
  uploadToCloudinary,
};
