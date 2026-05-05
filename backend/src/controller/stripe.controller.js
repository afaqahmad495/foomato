const crypto = require('crypto');

const Order = require('../models/order.model');

function getEnv(name, fallback = '') {
  const v = process.env[name];
  return v == null ? fallback : String(v);
}

function toMinorUnits(amountMajor) {
  const n = Number(amountMajor);
  if (!Number.isFinite(n)) return null;
  // Treat our "Rs" amounts as whole currency units; Stripe expects minor units (e.g. 100 = 1.00)
  const minor = Math.round(n * 100);
  if (!Number.isFinite(minor) || minor < 0) return null;
  return minor;
}

async function stripePostForm(path, form) {
  const secretKey = getEnv('STRIPE_SECRET_KEY');
  if (!secretKey) {
    const err = new Error('Stripe is not configured (missing STRIPE_SECRET_KEY)');
    err.code = 'STRIPE_NOT_CONFIGURED';
    throw err;
  }

  const body = new URLSearchParams(form);
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secretKey}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = null; }

  if (!res.ok) {
    const msg = json?.error?.message || `Stripe request failed (${res.status})`;
    const err = new Error(msg);
    err.code = 'STRIPE_API_ERROR';
    err.status = res.status;
    err.details = json || text;
    throw err;
  }

  return json;
}

function parseStripeSignatureHeader(value) {
  const header = String(value || '');
  const parts = header.split(',').map(s => s.trim()).filter(Boolean);
  const map = new Map();
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    map.set(p.slice(0, idx), p.slice(idx + 1));
  }
  return {
    t: map.get('t') ? Number(map.get('t')) : null,
    v1: map.get('v1') || null,
  };
}

function safeEqualHex(a, b) {
  try {
    const ba = Buffer.from(String(a || ''), 'hex');
    const bb = Buffer.from(String(b || ''), 'hex');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function verifyStripeWebhook({ rawBody, signatureHeader, secret, toleranceSec = 300 }) {
  const { t, v1 } = parseStripeSignatureHeader(signatureHeader);
  if (!t || !v1) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - t) > toleranceSec) return false;

  const signedPayload = `${t}.${rawBody.toString('utf8')}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return safeEqualHex(expected, v1);
}

const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Please login first' });

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.paymentMethod !== 'STRIPE') {
      return res.status(400).json({ message: 'Order paymentMethod must be STRIPE' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({ message: 'Already paid', url: null, sessionId: order.stripeSessionId || null });
    }

    const currency = getEnv('STRIPE_CURRENCY', 'pkr').toLowerCase();
    const amount = toMinorUnits(order.total);
    if (amount == null || amount < 50) {
      // Stripe has minimum amounts; keep generic message
      return res.status(400).json({ message: 'Invalid order amount for Stripe' });
    }

    const frontendUrl = getEnv('FRONTEND_URL', 'http://localhost:5173').replace(/\/+$/, '');
    const successUrl = `${frontendUrl}/order-success?orderId=${encodeURIComponent(String(order._id))}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/checkout/${encodeURIComponent(String(order.foodId))}?stripe=cancelled&orderId=${encodeURIComponent(String(order._id))}`;

    const session = await stripePostForm('checkout/sessions', {
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: String(order._id),
      'metadata[orderId]': String(order._id),
      'metadata[orderPublicId]': String(order.orderId || ''),
      'metadata[userId]': String(order.userId),

      // One line item
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': currency,
      'line_items[0][price_data][unit_amount]': String(amount),
      'line_items[0][price_data][product_data][name]': order.itemSnapshot?.name || 'Order',
      'line_items[0][price_data][product_data][description]': `Order ${order.orderId || ''}`.trim(),
    });

    order.stripeSessionId = session.id;
    if (!order.paymentStatus) order.paymentStatus = 'PENDING';
    await order.save();

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    if (err?.code === 'STRIPE_NOT_CONFIGURED') {
      return res.status(501).json({ message: err.message });
    }
    console.error('createCheckoutSession error:', { code: err?.code, message: err?.message });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const stripeWebhook = async (req, res) => {
  try {
    const secret = getEnv('STRIPE_WEBHOOK_SECRET');
    if (!secret) return res.status(501).send('Stripe webhook not configured');

    const sig = req.headers['stripe-signature'];
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
    const ok = verifyStripeWebhook({ rawBody, signatureHeader: sig, secret });
    if (!ok) return res.status(400).send('Invalid signature');

    const event = JSON.parse(rawBody.toString('utf8'));
    const type = event?.type;
    const obj = event?.data?.object || {};

    if (type === 'checkout.session.completed') {
      const orderId = obj?.metadata?.orderId || obj?.client_reference_id;
      const sessionId = obj?.id;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentMethod = 'STRIPE';
          order.paymentStatus = 'PAID';
          order.paidAt = new Date();
          if (sessionId) order.stripeSessionId = sessionId;
          if (obj?.payment_intent) order.stripePaymentIntentId = String(obj.payment_intent);
          await order.save();
        }
      }
    } else if (type === 'checkout.session.expired') {
      const orderId = obj?.metadata?.orderId || obj?.client_reference_id;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && order.paymentStatus !== 'PAID') {
          order.paymentMethod = 'STRIPE';
          order.paymentStatus = 'FAILED';
          await order.save();
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('stripeWebhook error:', err);
    return res.status(400).send('Webhook error');
  }
};

module.exports = {
  createCheckoutSession,
  stripeWebhook,
};

