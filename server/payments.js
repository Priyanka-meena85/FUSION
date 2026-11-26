const crypto = require('node:crypto');

/**
 * Production Integration Adapters (Razorpay + WhatsApp Business API)
 * Automatically uses live APIs when environment variables are configured,
 * and falls back cleanly to local simulation mode during development.
 */

async function createPaymentOrder({ amountInInr, receiptCode, customerName }) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      provider: 'local-simulation',
      orderId: `sim_order_${receiptCode}`,
      amount: amountInInr * 100,
      currency: 'INR',
      status: 'paid',
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
  const data = await res.json();
  return { provider: 'razorpay', ...data };
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return true; // Local simulation mode
  }
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
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
