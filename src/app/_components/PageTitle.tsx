"use client";

import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/profile", label: "Profile" },
  { href: "/create", label: "Continue Remix" },
  { href: "/history", label: "My Builds & Remixes" },
  { href: "/likes", label: "My Likes" },
  { href: "/mycommunity", label: "My Community" },
  { href: "/popular", label: "Popular" },
  { href: "/communities", label: "Manage Community Organizations" },
  { href: "/about", label: "About" },
];

export default function PageTitle() {
  const pathname = usePathname();
  const selectedIdx = navItems.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  const selectedItem = navItems[selectedIdx === -1 ? 0 : selectedIdx];

  return <p className="text-xl font-bold">{selectedItem?.label}</p>;
}
