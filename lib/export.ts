// Utility functions for exporting data

export interface ExportExpense {
  date: string;
  description: string;
  amount: number;
  category: string;
  paid_by: string;
  status: string;
}

/**
 * Export expenses to CSV format
 */
export function exportToCSV(expenses: ExportExpense[]): void {
  // Create CSV header
  const headers = ['Date', 'Description', 'Amount', 'Category', 'Paid By', 'Status'];
  
  // Create CSV rows
  const rows = expenses.map(expense => [
    expense.date,
    `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes
    expense.amount.toFixed(2),
    expense.category,
    expense.paid_by,
    expense.status,
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export expenses to PDF (using browser print)
 */
export function exportToPDF(expenses: ExportExpense[]): void {
  // Create a printable HTML table
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to export to PDF');
    return;
  }
  
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>PayUp Expenses Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 40px;
            color: #333;
          }
          h1 {
            color: #FF6B35;
            margin-bottom: 10px;
          }
          .meta {
            color: #666;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
          }
          tr:hover {
            background-color: #f8f9fa;
          }
          .amount {
            text-align: right;
            font-weight: 500;
          }
          .total {
            text-align: right;
            font-size: 18px;
            font-weight: 600;
            margin-top: 20px;
          }
          .category {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }
          .category-food { background-color: #d4edda; color: #155724; }
          .category-printing { background-color: #d1ecf1; color: #0c5460; }
          .category-supplies { background-color: #e7d4f0; color: #6f42c1; }
          .category-other { background-color: #e2e3e5; color: #383d41; }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>PayUp Expenses Report</h1>
        <div class="meta">Generated on ${new Date().toLocaleString()}</div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Paid By</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(expense => `
              <tr>
                <td>${expense.date}</td>
                <td>${expense.description}</td>
                <td><span class="category category-${expense.category}">${expense.category}</span></td>
                <td>${expense.paid_by}</td>
                <td class="amount">$${expense.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          Total: $${totalAmount.toFixed(2)}
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

