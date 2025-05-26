import { auth } from "~/server/auth";
import { ProompInput } from "../_components/input";
import { HydrateClient } from "~/trpc/server";

export default async function Create() {
  const session = await auth();
  if (!session?.user) {
    return <div className="">Please sign in to use this feature</div>;
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-4 bg-gray-700 text-white">
        <div className="flex min-h-52 w-full">output</div>
        <ProompInput />
      </div>
    </HydrateClient>
  );
}
