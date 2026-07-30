global.raceLabState = global.raceLabState || { seatAvailable: true, bookings: [], doubleBooked: false };

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (global.raceLabState.doubleBooked) {
    return res.status(200).json({ complete: true, flag: "FLAG{race_condition_double_booking}" });
  }
  
  return res.status(200).json({ complete: false });
}