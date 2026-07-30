export default async function handler(req, res) {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    // Network realism delay
    await new Promise(resolve => setTimeout(resolve, 600));
  
    const { id } = req.query;
  
    // Intentionally vulnerable.
    // Missing ownership validation. The server trusts the ID provided by the client.
    // Educational purpose only.
  
    if (id === "5001") {
      return res.status(200).json({
        id: "5001",
        item: "Apple AirPods Pro (2nd Gen)",
        price: "₹10,000",
        customer: "Guest User",
        address: "123 Tech Park, HSR Layout, Bangalore, KA",
        status: "Shipped",
        courier: "BlueDart Express",
        eta: "Tomorrow, by 9 PM",
        isVictim: false
      });
    } 
    
    if (id === "5002") {
      return res.status(200).json({
        id: "5002",
        item: "Apple MacBook Pro M3 Max (64GB RAM)",
        price: "₹3,19,900",
        customer: "Rahul Sharma",
        address: "Sea View Apartments, Bandra West, Mumbai, MH",
        status: "Processing",
        courier: "Delhivery Surface",
        eta: "Oct 12, 2026",
        isVictim: true
      });
    }
  
    return res.status(404).json({ error: "Order not found" });
  }