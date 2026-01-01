export const paymentFailedTemplate = ({
  reservationId,
  amount,
  reason,
  timestamp,
}: {
  reservationId: string;
  amount: number;
  reason: string;
  timestamp: string;
}) => `
  <div style="font-family: Arial; padding: 20px;">
    <h2 style="color: red;">Payment Failed</h2>

    <p>Unfortunately, your payment could not be completed.</p>

    <h3>Attempt Details:</h3>
    <ul>
      <li><b>Order ID:</b> ${reservationId}</li>
      <li><b>Amount Attempted:</b> ₹${amount}</li>
      <li><b>Reason:</b> ${reason}</li>
      <li><b>Timestamp:</b> ${timestamp}</li>
    </ul>

    <p>Please try again or use a different payment method.</p>
  </div>
`;