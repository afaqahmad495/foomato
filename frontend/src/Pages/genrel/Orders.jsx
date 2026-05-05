import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/orders/my');
        if (!mounted) return;
        setOrders(res?.data?.orders || []);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          navigate('/user/login?next=/orders', { replace: true });
          return;
        }
        if (mounted) setError(err?.response?.data?.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const cancelOrder = async (o) => {
    const id = o?._id || o?.orderId;
    if (!id) return;
    if (!window.confirm(`Cancel order ${o.orderId || ''}?`)) return;

    setCancellingId(String(id));
    setError('');
    try {
      const res = await api.patch(`/api/orders/${id}/cancel`);
      const updated = res?.data?.order;
      setOrders(prev => prev.map(x => (
        (String(x?._id || '') === String(id) || String(x?.orderId || '') === String(o?.orderId || ''))
          ? (updated || { ...x, status: 'CANCELLED' })
          : x
      )));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="orders-wrap">
      <div className="orders-card">
        <div className="orders-header">
          <button className="orders-back" onClick={() => navigate(-1)}>Back</button>
          <h2>My Orders</h2>
          <div style={{ width: 60 }} />
        </div>

        {loading ? (
          <div className="empty">Loading...</div>
        ) : error ? (
          <div className="empty">{error}</div>
        ) : !orders.length ? (
          <div className="empty">No orders yet.</div>
        ) : (
          orders.map(o => (
            <div className="order-item" key={o._id || o.orderId}>
              <video src={o.itemSnapshot?.video} muted playsInline />
              <div className="order-meta">
                <p className="order-title">{o.itemSnapshot?.name || 'Order'}</p>
                <p className="order-sub">Order ID: {o.orderId}</p>
                <div className="row">
                  <span className="badge">{o.status || 'PLACED'}</span>
                  <span className="badge">{o.deliveryMode}</span>
                  <span className="badge">Qty {o.quantity}</span>
                </div>
                <div className="row">
                  <span className="badge">Total Rs {o.total ?? '--'}</span>
                  <span className="badge">COD</span>
                </div>
                {['PLACED', 'ACCEPTED'].includes(o.status) && (
                  <div className="orders-actions">
                    <button
                      className="orders-cancel"
                      disabled={String(cancellingId) === String(o._id || o.orderId)}
                      onClick={() => cancelOrder(o)}
                    >
                      {String(cancellingId) === String(o._id || o.orderId) ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
