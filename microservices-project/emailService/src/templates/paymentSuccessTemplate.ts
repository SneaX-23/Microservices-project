export const paymentSuccessTemplate = ({
  reservationId,
  amount,
  timestamp,
}: {
  reservationId: string;
  amount: number;
  timestamp: string;
}) => `
  <div style="font-family: Arial; padding: 20px;">
    <h2 style="color: green;">Payment Successful</h2>

    <p>Your payment has been <b>successfully processed</b>.</p>

    <h3>Order Details:</h3>
    <ul>
      <li><b>Order ID:</b> ${reservationId}</li>
      <li><b>Amount Paid:</b> ₹${amount}</li>
      <li><b>Timestamp:</b> ${timestamp}</li>
    </ul>

    <p>Thank you for your purchase!</p>
  </div>
`;