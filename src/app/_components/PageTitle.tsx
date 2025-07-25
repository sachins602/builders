"use client";

import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/profile", label: "Profile" },
  { href: "/create", label: "Continue Build" },
  { href: "/history", label: "My Builds & Remixes" },
  { href: "/likes", label: "My Likes" },
  { href: "/mycommunity", label: "My Community" },
  { href: "/popular", label: "Popular" },
  { href: "/organizations", label: "Community Organizations" },
  { href: "/about", label: "About" },
];

export default function PageTitle() {
  const pathname = usePathname();
  const selectedIdx = navItems.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  const selectedItem = navItems[selectedIdx === -1 ? 0 : selectedIdx];

  return <span className="text-2xl font-bold text-shadow-lg/10 px-4 py-2 block flex-grow-0 items-center">{selectedItem?.label}</span>;
}
