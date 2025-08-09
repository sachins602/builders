import { BuildChainComponent } from "~/app/_components/BuildChainComponent/BuildChainComponent";
import { api, HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";

export default async function Popular() {
  // Get current user session
  const session = await auth();

  if (!session?.user.id) {
    return <div>You must be logged in to view this page</div>;
  }

  // Fetch popular posts (simplified feed)
  const popularPosts = await api.community.getFeedSimple({
    limit: 10,
    sort: "popular",
  });

  return (
    <HydrateClient>
      <div className="flex h-full w-full flex-col">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {popularPosts.items.map((post) => (
            <BuildChainComponent key={post.id} post={post as any} />
          ))}
        </div>
      </div>
    </HydrateClient>
  );
}
