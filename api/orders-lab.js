let orders = {
    "5001": {
      id: "5001",
      item: "Apple AirPods Pro (2nd Gen)",
      price: "₹10,000",
      customer: "Akash Verma",
      phone: "+91 98765 43210",
      address: "123 Tech Park, HSR Layout, Bangalore, KA",
      status: "Shipped",
      payment: "UPI (Paid)",
      tracking: "AWB84732993",
      courier: "BlueDart Express",
      eta: "Tomorrow, by 9 PM",
      timeline: ["Packed", "Shipped"],
      tags: []
    },
    "5002": {
      id: "5002",
      item: "Apple MacBook Pro M3 Max (64GB RAM)",
      price: "₹3,19,900",
      customer: "Rahul Sharma",
      phone: "+91 99887 77665",
      address: "Sea View Apartments, Bandra West, Mumbai, MH",
      status: "Processing",
      payment: "Credit Card (Paid)",
      tracking: "DEL99283746",
      courier: "Delhivery Surface",
      eta: "Oct 12, 2026",
      timeline: ["Packed", "Processing"],
      tags: ["⭐ AppleCare+ Included", "⚡ Express Delivery", "🏢 Corporate Purchase", "🛡️ Priority Support"]
    }
  };
  
  let labProgress = {
    viewedVictim: false,
    cancelledVictim: false
  };
  
  export default async function handler(req, res) {
    // Network realism delay
    await new Promise(resolve => setTimeout(resolve, 600));
  
    const { id, action } = req.query;
  
    // VERIFICATION ENDPOINT
    if (action === "check") {
      if (labProgress.viewedVictim && labProgress.cancelledVictim) {
        return res.status(200).json({ complete: true, flag: "FLAG{idor_hunter_completed_day6}" });
      }
      return res.status(200).json({ complete: false });
    }
  
    // WRITE IDOR ENDPOINT (POST /api/orders/cancel)
    if (action === "cancel") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      
      // Read the order_id from the JSON body (Highly realistic API pattern)
      const orderId = String(req.body.order_id);
      
      //  Intentionally vulnerable: No ownership check before modifying object state.
      if (orders[orderId]) {
        if (orders[orderId].status !== "Cancelled") {
          orders[orderId].status = "Cancelled";
          orders[orderId].timeline.push("Cancelled by customer");
          
          if (orderId === "5002") labProgress.cancelledVictim = true;
        }
        return res.status(200).json({ success: true, cancelled_id: orderId });
      }
      return res.status(404).json({ error: "Order not found" });
    }
  
    // READ IDOR ENDPOINT (GET /api/orders/:id)
    if (req.method === "GET") {
      //  Intentionally vulnerable: No ownership check before returning object data.
      if (orders[id]) {
        if (id === "5002") labProgress.viewedVictim = true;
        return res.status(200).json(orders[id]);
      }
      return res.status(404).json({ error: "Order not found" });
    }
  
    return res.status(400).json({ error: "Bad Request" });
  }