import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, serverTimestamp, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- Interfaces ---

export interface TransactionData {
    id?: string;
    type: 'credit' | 'debit';
    category: 'R&D' | 'Hardware' | 'Salaries' | 'Cloud' | 'Legal' | 'Marketing' | 'Ops' | 'Grant' | 'Investment' | 'Other';
    amount: number;
    date: any; // Timestamp
    description: string;
    paymentMode: string;
    status: 'pending' | 'cleared' | 'rejected';
    invoiceUrl?: string;
    projectId?: string; // Linked to a budget
    createdBy: string;
    approvedBy?: string;
}

export interface BudgetData {
    id?: string;
    name: string; // e.g., "Mars Rover Prototype"
    type: 'project' | 'team';
    allocated: number;
    spent: number;
    startDate: any;
    endDate: any;
    status: 'active' | 'closed';
    description?: string;
}

export interface InvestorData {
    id?: string;
    name: string;
    type: 'Angel' | 'VC' | 'Grant';
    committedAmount: number;
    receivedAmount: number;
    contactInfo: {
        email: string;
        phone?: string;
        representative?: string;
    };
    status: 'active' | 'prospect' | 'closed';
    notes?: string;
}

export interface AssetData {
    id?: string;
    name: string;
    category: 'Equipment' | 'Component' | 'Tool' | 'Software';
    cost: number;
    purchaseDate: any;
    assignedTo?: string; // userId or teamId
    status: 'active' | 'deprecated' | 'maintenance' | 'disposed';
    serialNumber?: string;
}

// --- Transactions Service ---

export const addTransaction = async (transaction: Omit<TransactionData, 'id' | 'status'>): Promise<string> => {
    const docRef = await addDoc(collection(db, "transactions"), {
        ...transaction,
        status: 'pending', // Default status
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getTransactions = async (): Promise<TransactionData[]> => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TransactionData);
};

export const updateTransactionStatus = async (transactionId: string, status: 'cleared' | 'rejected', approvedBy?: string) => {
    const updates: any = { status };
    if (approvedBy) updates.approvedBy = approvedBy;

    await updateDoc(doc(db, "transactions", transactionId), updates);
};

// --- Budgets Service ---

export const createBudget = async (budget: Omit<BudgetData, 'id' | 'spent'>): Promise<string> => {
    const docRef = await addDoc(collection(db, "budgets"), {
        ...budget,
        spent: 0,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getBudgets = async (): Promise<BudgetData[]> => {
    const q = query(collection(db, "budgets"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as BudgetData);
};

export const updateBudgetSpending = async (budgetId: string, amount: number) => {
    // This should ideally be a transaction or cloud function to ensure atomicity
    // For now, we'll just update the doc
    const budgetDoc = await getDocs(query(collection(db, "budgets"), where("__name__", "==", budgetId)));
    if (!budgetDoc.empty) {
        const currentSpent = budgetDoc.docs[0].data().spent || 0;
        await updateDoc(doc(db, "budgets", budgetId), {
            spent: currentSpent + amount
        });
    }
};

// --- Investors Service ---

export const addInvestor = async (investor: Omit<InvestorData, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, "investors"), {
        ...investor,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getInvestors = async (): Promise<InvestorData[]> => {
    const q = query(collection(db, "investors"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as InvestorData);
};

export const updateInvestorFunding = async (investorId: string, received: number) => {
    const docRef = doc(db, "investors", investorId);
    // In a real app, fetch current and add, assuming purely additive for now or handle via UI
    await updateDoc(docRef, { receivedAmount: received });
};

// --- Assets Service ---

export const addAsset = async (asset: Omit<AssetData, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, "assets"), {
        ...asset,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getAssets = async (): Promise<AssetData[]> => {
    const q = query(collection(db, "assets"), orderBy("purchaseDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AssetData);
};

// --- Dashboard Computations ---

export const getFinancialSummary = async () => {
    // This is a client-side aggregation for now. In production, use Cloud Functions or aggregation queries.
    const transactions = await getTransactions();

    let totalRevenue = 0;
    let totalExpenses = 0;
    let monthlyExpenses: Record<string, number> = {};

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;

    transactions.forEach(t => {
        if (t.status === 'rejected') return;

        if (t.type === 'credit') {
            totalRevenue += Number(t.amount);
        } else {
            totalExpenses += Number(t.amount);

            // For burn rate (simple approximation based on transaction date)
            const tDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
            const key = `${tDate.getFullYear()}-${tDate.getMonth()}`;
            monthlyExpenses[key] = (monthlyExpenses[key] || 0) + Number(t.amount);
        }
    });

    const balance = totalRevenue - totalExpenses;

    // Calculate average burn rate (last 3 months usually, strictly using available data here)
    const expenseMonths = Object.keys(monthlyExpenses).length;
    const burnRate = expenseMonths > 0 ? totalExpenses / expenseMonths : 0;

    const runway = burnRate > 0 ? balance / burnRate : 0;

    return {
        totalRevenue,
        totalExpenses,
        balance,
        burnRate,
        runway
    };
};
