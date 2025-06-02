import { auth } from "~/server/auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Button } from "./ui/button";

export default async function Header() {
  const session = await auth();


  return (
    <header className="flex h-24 w-full items-center justify-between px-2 text-white">
      <div className="text-lg font-bold">The Missing Middle</div>
      <nav className="flex flex-col items-center">
        {session?.user.image && (
          <div className="place-items-center">
            <Avatar>
              <AvatarImage src={session.user.image} />
              <AvatarFallback>img</AvatarFallback>
            </Avatar>
            <span> {session.user?.name}</span>
          </div>
        )}
        <Link href={session ? "/api/auth/signout" : "/api/auth/signin"}>
          {session ? (
            <Button variant="destructive" size="sm">
              Sign out
            </Button>
          ) : (
            <Button className="bg-green-400" variant="default" size="sm">
              Sign in
            </Button>
          )}
        </Link>
      </nav>
    </header>
  );
}
