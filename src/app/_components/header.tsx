// External libraries
import Link from "next/link";
import Image from "next/image";

// Internal modules
import { auth } from "~/server/auth";

// UI components
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import NavMenu from "./navMenu";
import UserIcon from "./userIcon";


export default async function Header() {


  return (
    <header className="flex flex-row items-center justify-between text-black p-1">
      <div className="flex flex-row items-center justify-between w-26">
        {/*Navigation Menu*/}
        {NavMenu()}

        {/*User Icon*/}
        {UserIcon()}
      </div>

      {/*Logo*/}
      <div>
        <Image src="/omm-logo.png" alt="Our Missing Middle Logo" width="50" height="50" className="h-10 w-10"/>
      </div>
    </header>
  );
}
