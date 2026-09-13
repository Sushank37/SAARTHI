export const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return number.toLocaleString("en-IN");
}

export function formatDecimal(value, digits = 1) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return number.toFixed(digits);
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return number.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export function formatCrores(amountInRupees) {
  if (amountInRupees === null || amountInRupees === undefined || amountInRupees === "") return "—";
  const number = Number(amountInRupees);
  if (Number.isNaN(number) || !Number.isFinite(number)) return "—";
  if (number === 0) return "₹0";

  const isNegative = number < 0;
  const absNum = Math.abs(number);
  const sign = isNegative ? "-" : "";

  if (absNum >= 10000000) {
    const crores = absNum / 10000000;
    return `${sign}₹${crores.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Cr`;
  }

  if (absNum >= 100000) {
    const lakhs = absNum / 100000;
    return `${sign}₹${lakhs.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} L`;
  }

  return `${sign}₹${absNum.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
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
