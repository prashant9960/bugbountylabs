//Shared memory for serverless (resets on cold start, but perfect for a quick free-tier lab)
global.graphqlLabProgress = global.graphqlLabProgress || { excessiveDataExposed: false };

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (global.graphqlLabProgress.excessiveDataExposed) {
    return res.status(200).json({ complete: true, flag: "FLAG{graphql_excessive_data_exposure}" });
  }
  
  return res.status(200).json({ complete: false });
}