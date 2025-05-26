import dynamic from "next/dynamic";
import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import MapWrapper from "./_components/mapwrapper";
import { Avatar, AvatarFallback, AvatarImage } from "./_components/ui/avatar";
import { Button } from "./_components/ui/button";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex h-full flex-col">
        <div className="container flex flex-col">
          <MapWrapper />
        </div>
      </main>
    </HydrateClient>
  );
}
