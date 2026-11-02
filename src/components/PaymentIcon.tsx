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
          <rect x="1.8" y="5" width="16.4" height="10" rx="1.5" />
          <circle cx="10" cy="10" r="2.25" />
          <path d="M5 10h.01M15 10h.01" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}
