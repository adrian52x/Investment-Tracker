/** Remounts when the page changes, which replays the fade-in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
