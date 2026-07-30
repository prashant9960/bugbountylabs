// Shared memory for serverless (resets on cold start, perfect for free-tier labs)
global.raceLabState = global.raceLabState || { 
    seatAvailable: true, 
    bookings: [], 
    doubleBooked: false 
  };
  
  export default async function handler(req, res) {
    // Reset the lab
    if (req.method === 'DELETE') {
      global.raceLabState = { seatAvailable: true, bookings: [], doubleBooked: false };
      return res.status(200).json({ success: true, message: "Lab Reset" });
    }
  
    // Get current state (for UI)
    if (req.method === 'GET') {
      return res.status(200).json(global.raceLabState);
    }
  
    // Book a seat
    if (req.method === 'POST') {
      const { user } = req.body;
  
      //  INTENTIONALLY VULNERABLE: Not atomic.
      // The server checks if the seat is available, but does not lock it.
      if (global.raceLabState.seatAvailable) {
        
        // Artificial processing delay. This creates the "race window".
        // If two requests arrive at the exact same time, they both pass the 
        // 'if' check above before this delay finishes and the seat is marked false.
        await new Promise(resolve => setTimeout(resolve, 800)); 
        
        // State Update
        global.raceLabState.seatAvailable = false;
        global.raceLabState.bookings.push(user);
        
        // Detection: If more than 1 user booked the 1 available seat, it's a Race Condition!
        if (global.raceLabState.bookings.length > 1) {
          global.raceLabState.doubleBooked = true;
        }
        
        return res.status(200).json({ success: true, message: "Seat A12 Confirmed", user });
      } else {
        // If the seat is already marked unavailable, the request fails.
        return res.status(400).json({ success: false, message: "Seat Unavailable", user });
      }
    }
  
    return res.status(405).json({ error: "Method not allowed" });
  }