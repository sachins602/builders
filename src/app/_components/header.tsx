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
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { Bars4Icon } from "@heroicons/react/24/outline";

export default async function Header() {
  const session = await auth();
  return (
    <header className="flex flex-row items-center justify-between p-1 text-black">
      <div className="flex flex-row items-center justify-between space-x-6">
        <NavigationMenu className="z-[10000]">
          <NavigationMenuList>
            <NavigationMenuItem>
              {/* Hamburger Menu Icon*/}
              <NavigationMenuTrigger>
                <Bars4Icon className="h-full" />
              </NavigationMenuTrigger>

              <NavigationMenuContent className="w-64 md:w-64">
                {/* Navigation Links */}
                <Link
                  href="/"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Home
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Profile
                </Link>
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
                  href="/mycommunity"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  MyE Community
                </Link>
                <Link
                  href="/popular"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Popular
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
                  className={`block ${
                    session
                      ? "bg-red-500 hover:bg-red-400"
                      : "bg-green-500 hover:bg-green-400"
                  } px-4 py-2 text-sm`}
                >
                  {session ? "Log out" : "Log in"}
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
