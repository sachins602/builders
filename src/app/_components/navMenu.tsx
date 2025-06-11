import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { auth } from "~/server/auth";

// UI components
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "./ui/navigation-menu";

// Icons
import { Bars4Icon } from "@heroicons/react/24/outline";

export default async function NavMenu() {

    {/* Fetch user session */}
    const session = await auth();

    {/* Render the navigation menu */}
    return (<div className="text-left">

        {/* Navigation Menu */}
        <NavigationMenu className="">
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
      </div>);
}