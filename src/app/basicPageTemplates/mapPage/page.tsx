import MapTestWrapper from "~/app/_components/maptest2/maptestwrapper"
// Update the import path below to the correct location of your Button component
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { Search } from "lucide-react";


export default function MapPage() {
    return (
        <main>
            {/* Map Container */}
            <div className="border-solid border-2 border-black min-h-[50vh] m-2 w-full">
                <MapTestWrapper />
            </div>

            {/* Search bar */}
            <div className="bg-red-300 h-15 w-full m-2">
                <Input type="text" placeholder="Address" />
                <Button variant="secondary" size="icon" className="size-8">
                    <Search />
                </Button>
            </div>

            {/* Controls div*/}
            <div className="bg-blue-300 h-15 w-full m-2">

                {/*Hero Icon Search */}
            </div>

            {/*Remixes bar*/}
            <div className="bg-green-400 h-30 w-full m-2">

            </div>

            {/* Popular and Connect */}
            <div className="bg-orange-300 h-15 w-full m-2">

            </div>
        </main>
    )
}