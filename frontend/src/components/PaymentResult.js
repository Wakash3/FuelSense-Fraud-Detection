import React, { useEffect, useState } from 'react';

function PaymentResult({ darkMode }) {
  const [status, setStatus] = useState('processing');
  const [countdown, setCountdown] = useState(5);

  const colors = {
    text: darkMode ? '#e0e0e0' : '#1a1a2e',
    subtext: darkMode ? '#888' : '#666',
    card: darkMode ? '#1e1e2e' : '#ffffff',
    border: darkMode ? '#2a2a3e' : '#e0e0e0',
  };

  useEffect(() => {
    // Get status from URL params or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    let paymentStatus = urlParams.get('status');
    let orderTrackingId = urlParams.get('OrderTrackingId');
    
    // If not in URL, check sessionStorage
    if (!paymentStatus) {
      paymentStatus = sessionStorage.getItem('paymentStatus');
      orderTrackingId = sessionStorage.getItem('orderTrackingId');
    }
    
    console.log('[PaymentResult] Status:', paymentStatus);
    console.log('[PaymentResult] OrderTrackingId:', orderTrackingId);

    if (paymentStatus === 'Completed') {
      setStatus('success');
    } else if (paymentStatus === 'Failed' || paymentStatus === 'Cancelled' || paymentStatus === 'Error') {
      setStatus('failed');
    } else {
      setStatus('processing');
    }

    // Clear sessionStorage after reading
    sessionStorage.removeItem('paymentStatus');
    sessionStorage.removeItem('orderTrackingId');

    // Auto-redirect to billing after 5 seconds on success/failure
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/?tab=billing';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const containerStyle = {
    maxWidth: '500px',
    margin: '50px auto',
    padding: '40px',
    background: colors.card,
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: `1px solid ${colors.border}`,
  };

  const buttonStyle = {
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px',
  };

  const goToBilling = () => {
    window.location.href = '/?tab=billing';
  };

  if (status === 'processing') {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
        <h2 style={{ color: colors.text, marginBottom: '10px' }}>Processing Payment...</h2>
        <p style={{ color: colors.subtext }}>
          Please wait while we confirm your payment.
        </p>
        <p style={{ color: colors.subtext, fontSize: '12px', marginTop: '20px' }}>
          Do not close this page.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
        <h2 style={{ color: '#27ae60', marginBottom: '10px' }}>Payment Successful!</h2>
        <p style={{ color: colors.text, marginBottom: '5px' }}>
          Your subscription has been activated successfully.
        </p>
        <p style={{ color: colors.subtext, fontSize: '14px', marginTop: '20px' }}>
          Redirecting to billing page in {countdown} seconds...
        </p>
        <button style={buttonStyle} onClick={goToBilling}>
          Go to Billing Now
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
      <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>Payment Failed</h2>
      <p style={{ color: colors.text, marginBottom: '5px' }}>
        Your payment could not be processed.
      </p>
      <p style={{ color: colors.subtext, fontSize: '14px', marginBottom: '20px' }}>
        Please try again or contact support.
      </p>
      <p style={{ color: colors.subtext, fontSize: '12px', marginBottom: '20px' }}>
        Redirecting in {countdown} seconds...
      </p>
      <button style={buttonStyle} onClick={goToBilling}>
        Back to Billing
      </button>
    </div>
  );
}

export default PaymentResult;