export const API_BASE = "http://127.0.0.1:8000";

export function formatNumber(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return number.toLocaleString("en-IN");
}

export function formatDecimal(value, digits = 1) {
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return number.toFixed(digits);
}

export function formatCurrency(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return number.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export function formatCrores(amountInRupees) {
  const number = Number(amountInRupees);
  if (Number.isNaN(number)) return "—";
  const crores = number / 10000000;
  return `₹ ${crores.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Cr`;
}

export function exportToCSV(data, filename = "mplads_audit_export.csv") {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers
      .map((header) => {
        const val = item[header] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
