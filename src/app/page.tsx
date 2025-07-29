import MapWrapper from "./_components/map/mapwrapper";
import { NavigationButtons } from "./_components/map/NavigationButtons";
import ImageTapper from "./_components/imageTapper";

export default async function Home() {
  return (
    <div className="flex h-full w-full flex-col">
      <ImageTapper />
      <MapWrapper />
      <NavigationButtons />
    </div>
  );
}
