import { HydrateClient } from "~/trpc/server";
import MapWrapper from "./_components/map/mapwrapper";

export default async function Home() {
  return (
    <HydrateClient>
      <MapWrapper />
    </HydrateClient>
  );
}
