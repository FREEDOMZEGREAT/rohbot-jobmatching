export type PackageTier = "Basic" | "Silver" | "Gold";
import { daysAgo } from "@/lib/date";

export type PaymentStatus = "Pending" | "Successful" | "Failed" | "Refunded" | "Disputed";

export interface SubscriptionPackage {
  tier: PackageTier;
  priceETB: number;
  durationMonths: number;
  candidateViewLimit: number | "Unlimited";
  interviewRequestLimit: number | "Unlimited";
  features: string[];
}

export interface Transaction {
  id: string;
  referenceNumber: string;
  employerName: string;
  packageTier: PackageTier;
  amount: number;
  date: string;
  status: PaymentStatus;
}

// Configurable packages (as per the requirements, these are subject to Rohobot approval)
export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    tier: "Basic",
    priceETB: 500,
    durationMonths: 1,
    candidateViewLimit: 10,
    interviewRequestLimit: 3,
    features: ["10 Candidate Profile Views", "3 Interview Requests / mo", "Standard Support"],
  },
  {
    tier: "Silver",
    priceETB: 1500,
    durationMonths: 1,
    candidateViewLimit: 50,
    interviewRequestLimit: 15,
    features: ["50 Candidate Profile Views", "15 Interview Requests / mo", "Priority Support", "Standard Verification"],
  },
  {
    tier: "Gold",
    priceETB: 3000,
    durationMonths: 1,
    candidateViewLimit: "Unlimited",
    interviewRequestLimit: "Unlimited",
    features: ["Unlimited Candidate Views", "Unlimited Interview Requests", "Dedicated Account Manager", "Featured Employer Badge"],
  },
];

export const paymentService = {
  // 1. Initiate Payment (Frontend calls this to get a checkout URL)
  initiatePayment: async (tier: PackageTier): Promise<{ checkoutUrl: string; transactionId: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In production, this returns a URL to Chapa, Telebirr, or Stripe
    return { 
      checkoutUrl: "https://mock-payment-gateway.com/checkout/session_12345", 
      transactionId: `TXN-${Date.now()}` 
    };
  },

  // 2. Verify Payment (Frontend polls this after returning from the gateway)
  // NOTE: This simulates the backend checking the payment provider's webhook/API.
  verifyPaymentStatus: async (transactionId: string): Promise<PaymentStatus> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Simulate: 80% chance of success for this demo
    const isSuccess = Math.random() > 0.2; 
    return isSuccess ? "Successful" : "Failed";
  },

  // 3. Admin: Get all transactions
  getAllTransactions: async (): Promise<Transaction[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return [
      { id: "1", referenceNumber: "TXN-90812", employerName: "St. Gabriel Hospital", packageTier: "Gold", amount: 3000, date: daysAgo(1), status: "Successful" },
      { id: "2", referenceNumber: "TXN-90813", employerName: "Rohobot Home Care", packageTier: "Silver", amount: 1500, date: daysAgo(2), status: "Pending" },
      { id: "3", referenceNumber: "TXN-90814", employerName: "Bethel Clinic", packageTier: "Basic", amount: 500, date: daysAgo(5), status: "Failed" },
      { id: "4", referenceNumber: "TXN-90815", employerName: "Zewditu Hospital", packageTier: "Gold", amount: 3000, date: daysAgo(8), status: "Refunded" },
    ];
  }
};