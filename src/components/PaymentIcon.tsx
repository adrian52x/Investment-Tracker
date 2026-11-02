import type { PaymentMethod } from "@/lib/expenses";

export default function PaymentIcon({ method }: { method: PaymentMethod }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden
    >
      {method === "card" ? (
        <>
          <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
          <path d="M2.5 8.5h15M5.5 12.25h3" />
        </>
      ) : (
        <>
          <circle cx="7.5" cy="7.5" r="5.25" />
          <path d="M6.4 6h1.1v3.5" />
          <path d="M12.74 7.26A5.25 5.25 0 1 1 7.26 12.74" />
        </>
      )}
    </svg>
  );
}
