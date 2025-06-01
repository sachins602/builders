import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import MapWrapper from "./_components/mapwrapper";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.response.getLatest.prefetch();
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
