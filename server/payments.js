const crypto = require('node:crypto');
const { timingSafeMatch } = require('./middleware/auth');

/**
 * Production Integration Adapters (Razorpay + WhatsApp Business API)
 * Fails closed in production if Razorpay secrets are missing.
 */

async function createPaymentOrder({ amountInInr, receiptCode, customerName }) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!keyId || !keySecret) {
    if (isProd) {
      throw new Error('Razorpay credentials are not configured in production.');
    }
    return {
      provider: 'local-simulation',
      orderId: `sim_order_${receiptCode}`,
      paymentId: `sim_pay_${receiptCode}`,
      signature: `sim_sig_${receiptCode}`,
      amount: Number(amountInInr) * 100,
      currency: 'INR',
      status: 'created',
    };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Number(amountInInr) * 100,
      currency: 'INR',
      receipt: receiptCode,
      notes: { customerName },
    }),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order creation failed with status ${res.status}`);
  }
  const data = await res.json();
  return { provider: 'razorpay', orderId: data.id, ...data };
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!keySecret) {
    if (isProd) {
      return false; // Fail closed in production
    }
    return typeof signature === 'string' && signature.startsWith('sim_sig_');
  }

  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return timingSafeMatch(expected, signature);
}

async function sendWhatsAppTemplate({ phone, templateName, params = [] }) {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  if (!apiUrl || !apiToken) {
    return {
      delivered: true,
      provider: 'local-simulation',
      phone,
      templateName,
      params,
    };
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, templateName, params }),
  });
  return { delivered: res.ok, provider: 'whatsapp-business-api' };
}

module.exports = { createPaymentOrder, verifyRazorpaySignature, sendWhatsAppTemplate };
