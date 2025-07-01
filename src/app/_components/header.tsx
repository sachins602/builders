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
    <header className="flex flex-row items-center justify-between text-black p-1">
      <div className="flex flex-row items-center justify-between w-26">
      <NavigationMenu className="z-[10000]">
          <NavigationMenuList>
            <NavigationMenuItem>

              {/* Hamburger Menu Icon*/}
              <NavigationMenuTrigger>
                <Bars4Icon className="h-full" />
              </NavigationMenuTrigger>

              <NavigationMenuContent className="w-[300px]">

                {/* Navigation Links */}
                <NavigationMenuLink className="w-[300px]">My Builds & Remixes</NavigationMenuLink>
                <NavigationMenuLink>My Likes</NavigationMenuLink>
                <NavigationMenuLink>Manage Community Organizations</NavigationMenuLink>

                {/*Check for user status - user profile*/}
                {session && (
                    <NavigationMenuLink href="/profile">
                        Edit Profile
                    </NavigationMenuLink>
                )}

                {/* Check for user status - login/logout */}
                <NavigationMenuLink href={session ? "/api/auth/signout" : "/api/auth/signin"}>
                  {session ? (
                      "Logout - " + session.user.name
                  ) : (
                      "Log in"
                  )}

                </NavigationMenuLink>
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
          <Image src="/omm-logo.png" alt="Our Missing Middle Logo" width="50" height="50" className="h-10 w-10"/>
        </Link>
      </div>
    </header>
  );
}
