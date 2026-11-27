let razorpayScriptPromise = null;

export function loadRazorpaySdk() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        if (window.Razorpay) resolve(window.Razorpay);
        else reject(new Error('Razorpay SDK unavailable after load.'));
      };
      script.onerror = () => {
        razorpayScriptPromise = null;
        reject(new Error('Failed to load Razorpay Checkout SDK.'));
      };
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
}

/**
 * Opens official Razorpay Checkout modal for live orders, or returns
 * the server-issued dev simulation payload when provider === 'local-simulation'.
 */
export async function openRazorpayCheckout({ payment, description, prefill }) {
  if (!payment || !payment.orderId) {
    throw new Error('Missing server-generated payment order.');
  }

  if (payment.provider === 'local-simulation') {
    return {
      razorpay_order_id: payment.orderId,
      razorpay_payment_id: payment.paymentId,
      razorpay_signature: payment.signature,
    };
  }

  if (!payment.keyId) {
    throw new Error('Missing Razorpay Key ID from server.');
  }

  const RazorpayConstructor = await loadRazorpaySdk();

  return new Promise((resolve, reject) => {
    const rzp = new RazorpayConstructor({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency || 'INR',
      name: 'FUSION — The Magical Mirror',
      description,
      order_id: payment.orderId,
      prefill: {
        name: prefill?.name || '',
        contact: prefill?.contact || '',
      },
      theme: { color: '#9E1B2B' },
      handler(response) {
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss() {
          const err = new Error('Checkout cancelled. Your temporary hold remains active for 48 hours.');
          err.code = 'CHECKOUT_CANCELLED';
          reject(err);
        },
      },
    });

    rzp.on('payment.failed', (resp) => {
      const err = new Error(resp?.error?.description || 'Payment failed. Please retry.');
      err.code = 'PAYMENT_FAILED';
      reject(err);
    });

    rzp.open();
  });
}
