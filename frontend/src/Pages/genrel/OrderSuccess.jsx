import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(location?.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (order) return;
    const params = new URLSearchParams(location.search || '');
    const id = params.get('orderId');
    if (!id) {
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/api/orders/${id}`);
        if (!mounted) return;
        setOrder(res?.data?.order || null);
      } catch {
        if (mounted) setOrder(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [location.search, order]);

  if (loading) {
    return (
      <div className="success-wrap">
        <div className="success-card">
          <h2 className="success-title">Order</h2>
          <p className="success-sub">Loading...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="success-wrap">
        <div className="success-card">
          <h2 className="success-title">Order</h2>
          <p className="success-sub">No order found.</p>
          <button className="success-cta" onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      </div>
    );
  }

  const pm = order.paymentMethod || 'COD';
  const ps = order.paymentStatus || (pm === 'STRIPE' ? 'PENDING' : 'UNPAID');
  const isStripe = pm === 'STRIPE';

  let subtitle = 'Cash on Delivery - we will notify the food partner.';
  if (isStripe) {
    if (ps === 'PAID') subtitle = 'Payment received - we will notify the food partner.';
    else if (ps === 'FAILED') subtitle = 'Payment failed - you can try again from checkout.';
    else subtitle = 'Payment processing - this may take a few seconds.';
  }

  return (
    <div className="success-wrap">
      <div className="success-card">
        <h2 className="success-title">{isStripe && ps !== 'PAID' ? 'Order Created' : 'Order Placed'}</h2>
        <p className="success-sub">{subtitle}</p>

        <div className="success-row">
          <div>Order ID</div>
          <div style={{ fontWeight: 900 }}>{order.orderId}</div>
        </div>
        <div className="success-row">
          <div>Payment</div>
          <div style={{ fontWeight: 700 }}>{isStripe ? `Stripe (${ps})` : 'Cash on Delivery'}</div>
        </div>
        <div className="success-row">
          <div>Item</div>
          <div style={{ fontWeight: 700 }}>{order.itemSnapshot?.name}</div>
        </div>
        <div className="success-row">
          <div>Qty</div>
          <div style={{ fontWeight: 700 }}>{order.quantity}</div>
        </div>
        <div className="success-row">
          <div>Mode</div>
          <div style={{ fontWeight: 700 }}>{order.deliveryMode}</div>
        </div>
        <div className="success-row">
          <div>Total</div>
          <div style={{ fontWeight: 900 }}>{order.total == null ? '--' : `Rs ${order.total}`}</div>
        </div>

        {isStripe && ps !== 'PAID' && (
          <button className="success-cta" onClick={() => window.location.reload()}>
            Refresh Status
          </button>
        )}

        <button className="success-cta" onClick={() => navigate('/home')}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;

