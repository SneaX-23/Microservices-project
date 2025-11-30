import axios from "axios";

const INVENTORY_API = "http://localhost:3001/api/v1/inventory";
const PAYMENT_API = "http://localhost:3002";

// Helper for delays
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runZombieTest() {
  console.log("🧟 STARTING ZOMBIE TRANSACTION TEST 🧟\n");

  try {
    // 1. Create a Product
    console.log("Step 1: Creating Product...");
    const productRes = await axios.post(`${INVENTORY_API}/`, {
      sku: "ZOMBIE-ITEM-001",
      name: "Brain Freeze Ice Cream",
      price: 100,
      stock: 10,
    });
    const productId = productRes.data.id;
    console.log(`✅ Product Created: ID ${productId} (Stock: 10)`);

    // 2. Reserve the Item
    console.log("\nStep 2: Reserving Item...");
    const reserveRes = await axios.post(`${INVENTORY_API}/reserve`, {
      productId: productId,
      quantity: 1,
    }, {
      headers: { "x-user-id": "victim-user-123" }
    });
    const reservationId = reserveRes.data.reservationId;
    console.log(`✅ Reserved! ID: ${reservationId}`);
    console.log(`⏳ Status: PENDING. Waiting for expiration (15s buffer)...`);

    // 3. WAIT for Expiration (Simulating user distraction)
    // We wait 15 seconds to ensure the 5s expiry passes AND the 10s cron job runs
    for (let i = 15; i > 0; i--) {
      console.log(`Waiting: ${i}s... `);
      await sleep(1000);
    }
    console.log("\n\n⏰ Time is up! Cron job should have released the stock.");

    // 4. "Late" Payment (The Zombie Check)
    console.log("\nStep 3: Attempting Late Payment...");
    try {
      const payRes = await axios.post(`${PAYMENT_API}/pay`, {
        reservationId: reservationId,
        amount: 100
      });
      console.log(`✅ Payment Accepted by Gateway: ${payRes.data.message}`);
    } catch (err: any) {
      console.error("❌ Payment Request Failed:", err.message);
      return;
    }

    console.log("\n---------------------------------------------------");
    console.log("🕵️  VERIFICATION REQUIRED");
    console.log("---------------------------------------------------");
    console.log("Check your Docker Logs for the Inventory Service.");
    console.log("You should see the following sequence:");
    console.log("1. 'Reservation expired...' (Cron Job)");
    console.log("2. 'Reservation released. Stock returned to Redis.'");
    console.log("3. 'Payment Confirmed' (From Kafka)");
    console.log("4. '⚠️ [Zombie Check] ... Initiating Refund.' (The Fix worked!)");

  } catch (error: any) {
    console.error("Test Failed:", error.response ? error.response.data : error.message);
  }
}

runZombieTest();