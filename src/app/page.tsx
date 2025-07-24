import MapWrapper from "./_components/map/mapwrapper";
import { NavigationButtons } from "./_components/map/NavigationButtons";

export default async function Home() {
  return (
    <div className="flex h-full w-full flex-col">
      <MapWrapper />
      <NavigationButtons />
    </div>
  );
}
