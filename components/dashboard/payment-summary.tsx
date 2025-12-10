import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";

interface Person {
    id: string;
    name: string;
    email: string;
}

interface PendingSettlement {
    id: string;
    amount: number;
    expense_description: string;
    expense_amount: number;
    expense_date: Date;
    category: string;
    person: Person;
}

interface GroupedDebt {
    personId: string;
    person: Person;
    totalAmount: number;
    settlements: PendingSettlement[];
}

interface PaymentSummaryProps {
    payables: GroupedDebt[];
    receivables: GroupedDebt[];
}

export function PaymentSummary({ payables, receivables }: PaymentSummaryProps) {
    const totalPayables = payables.reduce((sum, group) => sum + group.totalAmount, 0);
    const totalReceivables = receivables.reduce((sum, group) => sum + group.totalAmount, 0);
    const netBalance = totalReceivables - totalPayables;

    return (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        PHP {Math.abs(netBalance).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {netBalance >= 0 ? "Overall, you are owed money" : "Overall, you owe money"}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total I Owe</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                        PHP {totalPayables.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        To {payables.length} people
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Owed to Me</CardTitle>
                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        PHP {totalReceivables.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        From {receivables.length} people
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
