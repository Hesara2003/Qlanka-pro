import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Utility to export data to CSV format
 * @param data Array of objects to export
 * @param columns Configuration for columns (header name and data key)
 * @param fileName Name of the file to download
 */
export const exportToCsv = (
  data: any[],
  columns: { header: string; key: string | ((item: any) => string) }[],
  fileName: string
) => {
  const headers = columns.map((col) => col.header).join(",");
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let val = typeof col.key === "function" ? col.key(item) : item[col.key];
        // Escape quotes and wrap in quotes if contains comma
        val = val === null || val === undefined ? "" : String(val);
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(",");
  });

  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", fileName.endsWith(".csv") ? fileName : `${fileName}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Utility to export data to PDF format using jsPDF and autoTable
 * @param data Array of objects to export
 * @param columns Configuration for columns
 * @param title Title of the report
 * @param fileName Name of the file to download
 */
export const exportToPdf = (
  data: any[],
  columns: { header: string; key: string | ((item: any) => string) }[],
  title: string,
  fileName: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  // Prepare data for autoTable
  const tableHeaders = columns.map((col) => col.header);
  const tableRows = data.map((item) => 
    columns.map((col) => 
      typeof col.key === "function" ? col.key(item) : item[col.key] ?? ""
    )
  );

  autoTable(doc, {
    startY: 35,
    head: [tableHeaders],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255] }, // Match brand colors (gray-900)
    styles: { fontSize: 9, cellPadding: 3 },
  });

  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
};
