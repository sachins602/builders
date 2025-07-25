import { CommunityPost } from "~/app/_components/CommunityPost/CommunityPost";
import { api, HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";

export default async function Popular() {
  // Get current user session
  const session = await auth();

  if (!session?.user.id) {
    return <div>You must be logged in to view this page</div>;
  }

  // Fetch popular posts
  const popularPosts = await api.community.getSharedPopularPosts({
    limit: 10,
  });

  const userLikes = await api.community.getUserLikes({
    sharedChainIds: popularPosts.items.map((post) => post.id),
  });

  const filteredUserLikes = userLikes.filter((like) => like !== null);

  return (
    <HydrateClient>
      <div className="flex h-full w-full flex-col">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {popularPosts.items.map((post) => (
            <CommunityPost
              key={post.id}
              post={post}
              userLikes={filteredUserLikes}
              currentUserId={session.user.id}
            />
          ))}
        </div>
      </div>
    </HydrateClient>
  );
}
