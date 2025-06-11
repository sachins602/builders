// Google Avatar Component
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";

// Auth
import { auth } from "~/server/auth";

export default async function UserIcon() {

    {/* Fetch user session */}
    const session = await auth();

    {/* Render the user icon if they are logged in - grayscale filter*/}
    return(
    <div>
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
    );}