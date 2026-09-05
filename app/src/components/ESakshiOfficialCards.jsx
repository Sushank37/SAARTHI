import React from "react";
import { IndianRupee, FileCheck, CheckCircle2, TrendingDown } from "lucide-react";

export default function ESakshiOfficialCards({ summary, house }) {
  const isLokSabha = house === "Lok Sabha";

  const cards = [
    {
      title: "Total Fund Allocation",
      amount: isLokSabha ? "₹ 8,333.67 Cr" : "₹ 3,420.00 Cr",
      subtitle: "Annual Entitlement Limit",
      icon: IndianRupee,
      accent: "blue",
    },
    {
      title: "Recommended Works",
      amount: isLokSabha ? "106,896 Works" : "38,420 Works",
      subtitle: isLokSabha ? "₹ 5,723.01 Cr total value" : "₹ 2,140.80 Cr total value",
      icon: FileCheck,
      accent: "indigo",
    },
    {
      title: "Sanctioned Works",
      amount: isLokSabha ? "79,144 Works" : "29,110 Works",
      subtitle: isLokSabha ? "₹ 4,171.41 Cr sanctioned (74%)" : "₹ 1,590.20 Cr sanctioned (75%)",
      icon: CheckCircle2,
      accent: "teal",
    },
    {
      title: "Payments Released",
      amount: isLokSabha ? "₹ 2,775.15 Cr" : "₹ 980.75 Cr",
      subtitle: isLokSabha ? "34,339 completed projects" : "12,480 completed projects",
      icon: TrendingDown,
      accent: "green",
    },
  ];

  return (
    <div className="compact-kpi-grid">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className={`compact-kpi-card accent-${c.accent}`}>
            <div className="kpi-top">
              <span className="kpi-label">{c.title}</span>
              <div className="kpi-icon-wrap">
                <Icon size={18} />
              </div>
            </div>
            <div className="kpi-amount">{c.amount}</div>
            <div className="kpi-sub">{c.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
}
