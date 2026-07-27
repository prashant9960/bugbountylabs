import { graphql, buildSchema, parse } from 'graphql';

// Ensure shared memory is initialized
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

// 2. The Exploding Hardcoded Payload
const rootValue = {
  me: () => ({
    name: "Akash Verma",
    email: "akash.verma@example.com",
    membership: "AppleKart Premium",
    orderHistory: ["ORD-5001", "ORD-4922", "ORD-4109"],
    savedCards: [
      { last4: "4242", brand: "Visa", exp: "12/28" }
    ],
    adminDiscountTier: "TIER_1_MAX_RETENTION",
    warehouseOverride: "FORCE_EXPRESS_NODE_B",
    internalRiskScore: 0.04,
    fraudScore: 12,
    customerLifetimeValue: "₹8,45,000",
    supportEscalation: true,
    preferredWarehouse: "BLR-WH-04",
    marketingSegments: ["HIGH_INCOME", "CHURN_RISK"],
    accountFlags: ["BYPASS_CAPTCHA", "AUTO_APPROVE_REFUNDS"],
    supportTickets: [
      { id: "TCK-9921", issue: "Refund delayed", status: "Resolved" }
    ]
  })
};

// Target fields that prove the learner understood the concept
const SENSITIVE_FIELDS = [
  "adminDiscountTier", "warehouseOverride", "internalRiskScore", 
  "fraudScore", "customerLifetimeValue", "supportEscalation", 
  "marketingSegments", "accountFlags", "savedCards"
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await new Promise(resolve => setTimeout(resolve, 600)); // Suspense delay

  const query = req.body.query;
  if (!query) return res.status(400).json({ error: "GraphQL query required." });

  let leakedFields = [];

  // 🚨 AST PARSING: Strictly detect if they asked for our highly sensitive business data
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
  } catch (err) {}

  try {
    const response = await graphql({ schema, source: query, rootValue });
    
    // Echo the exact query & the fields they successfully leaked for the UI glow effect
    response.extensions = { 
      providedQuery: query,
      leakedFields: leakedFields
    };
    
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ error: "GraphQL Execution Error" });
  }
}