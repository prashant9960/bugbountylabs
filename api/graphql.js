import { graphql, buildSchema, parse } from 'graphql';

global.graphqlLabProgress = global.graphqlLabProgress || { excessiveDataExposed: false };

// 1. The Curated, High-Impact Schema
const schema = buildSchema(`
  type SavedCard {
    last4: String
    brand: String
    exp: String
  }

  type SupportTicket {
    id: String
    issue: String
    status: String
  }

  type User {
    name: String
    email: String
    membership: String
    orderHistory: [String]
    savedCards: [SavedCard]
    adminDiscountTier: String
    warehouseOverride: String
    internalRiskScore: Float
    fraudScore: Int
    customerLifetimeValue: String
    supportEscalation: Boolean
    preferredWarehouse: String
    marketingSegments: [String]
    accountFlags: [String]
    supportTickets: [SupportTicket]
  }

  type Query {
    me: User
  }
`);

// 2. The Vertically Expanded Hardcoded Payload
const rootValue = {
  me: () => ({
    name: "Akash Verma",
    email: "akash.verma@example.com",
    membership: "AppleKart Premium",
    orderHistory: [
      "ORD-5001 (AirPods Pro)", 
      "ORD-4922 (MacBook Air M2)", 
      "ORD-4109 (iPhone 15 Pro Max)",
      "ORD-3811 (Magic Keyboard)"
    ],
    savedCards: [
      { last4: "4242", brand: "Visa", exp: "12/28" },
      { last4: "8899", brand: "MasterCard", exp: "08/26" },
      { last4: "1109", brand: "Amex", exp: "11/25" }
    ],
    adminDiscountTier: "TIER_1_MAX_RETENTION",
    warehouseOverride: "FORCE_EXPRESS_NODE_B",
    internalRiskScore: 0.04,
    fraudScore: 12,
    customerLifetimeValue: "₹8,45,000",
    supportEscalation: true,
    preferredWarehouse: "BLR-WH-04",
    marketingSegments: ["HIGH_INCOME", "CHURN_RISK", "TECH_EARLY_ADOPTER"],
    accountFlags: ["BYPASS_CAPTCHA", "AUTO_APPROVE_REFUNDS", "NO_PROMO_LIMIT"],
    supportTickets: [
      { id: "TCK-9921", issue: "Refund delayed", status: "Resolved" },
      { id: "TCK-1024", issue: "Address change", status: "Closed" },
      { id: "TCK-4410", issue: "Missing AirPods delivery", status: "Investigating" }
    ]
  })
};

const SENSITIVE_FIELDS = [
  "adminDiscountTier", "warehouseOverride", "internalRiskScore", 
  "fraudScore", "customerLifetimeValue", "supportEscalation", 
  "marketingSegments", "accountFlags", "savedCards", "supportTickets"
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await new Promise(resolve => setTimeout(resolve, 600)); 

  const query = req.body.query;
  if (!query) return res.status(400).json({ error: "GraphQL query required." });

  let leakedFields = [];

  // AST PARSING
  try {
    const ast = parse(query);
    ast.definitions.forEach(def => {
      if (def.kind === 'OperationDefinition') {
        def.selectionSet.selections.forEach(sel => {
          if (sel.name && sel.name.value === 'me') {
            sel.selectionSet.selections.forEach(subSel => {
              const fieldName = subSel.name.value;
              if (SENSITIVE_FIELDS.includes(fieldName)) {
                leakedFields.push(fieldName);
                global.graphqlLabProgress.excessiveDataExposed = true;
              }
            });
          }
        });
      }
    });
  } catch (err) {
    // If AST fails (e.g., syntax typo), we let the GraphQL engine handle and return the raw error.
  }

  try {
    const response = await graphql({ schema, source: query, rootValue });
    
    // Echo the exact query & fields for the UI glow effect
    response.extensions = { 
      providedQuery: query,
      leakedFields: leakedFields
    };
    
    // Always return 200 OK with the response (even if it contains validation errors)
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ error: "GraphQL Execution Error" });
  }
}