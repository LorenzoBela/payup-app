"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { exportToCSV, exportToPDF, ExportExpense } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonsProps {
  expenses: ExportExpense[];
}

export function ExportButtons({ expenses }: ExportButtonsProps) {
  const handleExportCSV = () => {
    exportToCSV(expenses);
  };

  const handleExportPDF = () => {
    exportToPDF(expenses);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

