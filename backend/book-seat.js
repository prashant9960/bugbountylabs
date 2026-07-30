// Shared memory for serverless
global.raceLabState = global.raceLabState || { 
  seatAvailable: true, 
  bookings: [], 
  doubleBooked: false 
};

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    global.raceLabState = { seatAvailable: true, bookings: [], doubleBooked: false };
    return res.status(200).json({ success: true, message: "Lab Reset" });
  }

  if (req.method === 'GET') {
    return res.status(200).json(global.raceLabState);
  }

  if (req.method === 'POST') {
    const { user } = req.body;

    if (global.raceLabState.seatAvailable) {
      
      // 🔥 FIX 3: 1500ms delay. This guarantees the race window stays open 
      // long enough for both requests to enter this block.
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      global.raceLabState.seatAvailable = false;
      global.raceLabState.bookings.push(user);
      
      if (global.raceLabState.bookings.length > 1) {
        global.raceLabState.doubleBooked = true;
      }
      
      return res.status(200).json({ success: true, message: "Seat A12 Confirmed", user });
    } else {
      return res.status(400).json({ success: false, message: "Seat Unavailable", user });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}