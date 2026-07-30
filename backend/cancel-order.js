export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    // Network realism delay
    await new Promise(resolve => setTimeout(resolve, 700));
  
    const { order_id } = req.body;
  
    // ❌ Intentionally vulnerable.
    // Missing ownership validation. Any user can cancel any order ID.
    
    if (String(order_id) === "5001" || String(order_id) === "5002") {
      return res.status(200).json({
        success: true,
        cancelled_id: String(order_id),
        message: `Order #${order_id} has been successfully cancelled.`
      });
    }
  
    return res.status(404).json({ error: "Order not found or already cancelled." });
  }