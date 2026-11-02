"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

function NavProgress() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden className="nav-progress" /> : null;
}

/**
 * Pages are rendered per user, so a tap can wait on the server. This shows the
 * tap landed: a bar runs along the top and the link stays highlighted.
 */
export default function NavLink({
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <NavProgress />
    </Link>
  );
}
