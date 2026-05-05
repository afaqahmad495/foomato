import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import './PartnerOrders.css';

const PartnerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/orders/partner');
        if (!mounted) return;
        setOrders(res?.data?.orders || []);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          navigate('/foodpartner/login', { replace: true });
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
      const res = await api.patch(`/api/orders/partner/${id}/cancel`);
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
    <div className="porders-wrap">
      <div className="porders-card">
        <div className="porders-header">
          <button className="porders-back" onClick={() => navigate(-1)}>Back</button>
          <h2>Incoming Orders</h2>
          <div style={{ width: 60 }} />
        </div>

        {loading ? (
          <div className="pempty">Loading...</div>
        ) : error ? (
          <div className="pempty">{error}</div>
        ) : !orders.length ? (
          <div className="pempty">No orders yet.</div>
        ) : (
          orders.map(o => (
            <div className="porder-item" key={o._id || o.orderId}>
              <video src={o.itemSnapshot?.video} muted playsInline />
              <div className="pmeta">
                <p className="ptitle">{o.itemSnapshot?.name || 'Order'}</p>
                <p className="psub">Order ID: {o.orderId}</p>
                <div className="prow">
                  <span className="pbadge">{o.status || 'PLACED'}</span>
                  <span className="pbadge">{o.deliveryMode}</span>
                  <span className="pbadge">Qty {o.quantity}</span>
                </div>
                <div className="prow">
                  <span className="pbadge">Total Rs {o.total ?? '--'}</span>
                  <span className="pbadge">COD</span>
                </div>
                {['PLACED', 'ACCEPTED'].includes(o.status) && (
                  <div className="pactions">
                    <button
                      className="pcancel"
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

export default PartnerOrders;
