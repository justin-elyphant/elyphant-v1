
export interface ElephantCreditTransaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  type: "return_credit" | "manual_credit" | "redemption" | "expired";
  source: string;
  date: string;
  status: "active" | "used" | "expired";
  notes?: string;
}

export interface ElephantCreditBalance {
  userId: string;
  availableCredit: number;
  lifetime: {
    earned: number;
    spent: number;
    expired: number;
  };
  lastUpdated: string;
}

export const calculateAvailableCredit = (transactions: ElephantCreditTransaction[], userId: string): number => {
  return transactions
    .filter(tx => tx.userId === userId && tx.status === "active")
    .reduce((total, tx) => {
      if (tx.type === "return_credit" || tx.type === "manual_credit") {
        return total + tx.amount;
      }
      return total;
    }, 0);
};

export const getUserCreditHistory = (transactions: ElephantCreditTransaction[], userId: string): ElephantCreditTransaction[] => {
  return transactions
    .filter(tx => tx.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getUserCreditBalance = (transactions: ElephantCreditTransaction[], userId: string): ElephantCreditBalance => {
  const userTransactions = transactions.filter(tx => tx.userId === userId);
  
  const earned = userTransactions
    .filter(tx => tx.type === "return_credit" || tx.type === "manual_credit")
    .reduce((total, tx) => total + tx.amount, 0);
    
  const spent = userTransactions
    .filter(tx => tx.type === "redemption")
    .reduce((total, tx) => total + tx.amount, 0);
    
  const expired = userTransactions
    .filter(tx => tx.type === "expired")
    .reduce((total, tx) => total + tx.amount, 0);
    
  return {
    userId,
    availableCredit: calculateAvailableCredit(transactions, userId),
    lifetime: {
      earned,
      spent,
      expired
    },
    lastUpdated: new Date().toISOString()
  };
};
