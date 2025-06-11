import { HydrateClient } from "~/trpc/server";
import MapWrapper from "./_components/map/mapwrapper";

export default async function Home() {
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
