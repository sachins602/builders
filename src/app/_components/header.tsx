// External libraries
import Image from "next/image";
import Link from "next/link";

// Internal modules
import { auth } from "~/server/auth";

// UI components
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { Bars4Icon } from "@heroicons/react/24/outline";

export default async function Header() {
  const session = await auth();
  return (
    <header className="flex flex-row items-center justify-between p-1 text-black">
      <div className="flex flex-row items-center justify-between">
        <NavigationMenu className="z-[10000]">
          <NavigationMenuList>
            <NavigationMenuItem>
              {/* Hamburger Menu Icon*/}
              <NavigationMenuTrigger>
                <Bars4Icon className="h-full" />
              </NavigationMenuTrigger>

              <NavigationMenuContent>
                {/* Navigation Links */}
                <Link
                  href="/create"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Create AI Image
                </Link>
                <Link
                  href="/history"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  My Builds & Remixes
                </Link>
                <Link
                  href="/likes"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  My Likes
                </Link>
                <Link
                  href="/community"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Community
                </Link>
                <Link
                  href="/communities"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Manage Community Organizations
                </Link>
                <Link
                  href="/about"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  About
                </Link>

                {/* Check for user status - login/logout */}
                <Link
                  href={session ? "/api/auth/signout" : "/api/auth/signin"}
                  className="block bg-red-500 px-4 py-2 text-sm hover:bg-red-400"
                >
                  {session ? "Logout - " + session.user.name : "Log in"}
                </Link>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        {/*User Icon*/}
        {session && (
          <Avatar>
            <AvatarImage
              src={session.user.image ?? undefined}
              style={{ filter: "grayscale(100%)" }}
            />
            <AvatarFallback>img</AvatarFallback>
          </Avatar>
        )}
      </div>

      {/*Logo*/}
      <div>
        <Link href="/">
          <Image
            src="/omm-logo.png"
            alt="Our Missing Middle Logo"
            width="50"
            height="50"
            className="h-10 w-10"
          />
        </Link>
      </div>
    </header>
  );
}
