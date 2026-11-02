const PATHS = {
  left: "M12.5 4.5 7 10l5.5 5.5",
  right: "M7.5 4.5 13 10l-5.5 5.5",
  down: "M4.5 7.5 10 13l5.5-5.5",
};

export default function Chevron({
  direction,
}: {
  direction: keyof typeof PATHS;
}) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d={PATHS[direction]}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
