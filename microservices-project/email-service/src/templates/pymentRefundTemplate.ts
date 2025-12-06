export const paymentRefundTemplate = ({
  reservationId,
  amount,
  reason,
}: {
  reservationId: string;
  amount: number;
  reason: string;
}) => `
  <div style="font-family: Arial; padding: 20px;">
    <h2 style="color: #d67f00;">Refund Initiated</h2>

    <p>A refund has been initiated for your recent payment.</p>

    <h3>Refund Details:</h3>
    <ul>
      <li><b>Order ID:</b> ${reservationId}</li>
      <li><b>Refund Amount:</b> ₹${amount}</li>
      <li><b>Reason:</b> ${reason}</li>
    </ul>

    <p>The refund will be processed back to your original payment method within 3–5 business days.</p>
  </div>
`;