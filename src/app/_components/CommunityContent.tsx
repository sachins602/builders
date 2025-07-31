"use client";

import { useMemo } from "react";
import { api } from "~/trpc/react";
import { Button } from "../_components/ui/button";
import { CommunityPost } from "./CommunityPost/CommunityPost";
import { Loading } from "./ui/loading";
interface CommunityContentProps {
  session: { user: { id: string } };
}

export default function CommunityPageContent({
  session,
}: CommunityContentProps) {
  const {
    data: postsData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.community.getSharedPosts.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  // Flatten all posts from paginated data
  const posts = useMemo(
    () => postsData?.pages.flatMap((page) => page.items) ?? [],
    [postsData],
  );

  // Get user likes for all posts
  const { data: userLikes = [] } = api.community.getUserLikes.useQuery(
    { sharedChainIds: posts.map((post) => post.id) },
    {
      enabled: posts.length > 0 && !!session,
      refetchOnWindowFocus: false,
    },
  );

  // Filter out null likes
  const filteredUserLikes = useMemo(
    () => userLikes.filter((like): like is string => like !== null),
    [userLikes],
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loading />
          <p className="text-muted-foreground">Loading community posts...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-800">
            Error Loading Posts
          </h2>
          <p className="text-gray-600">
            There was an issue loading community posts. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const isEmpty = posts.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">Community</h1>
          <p className="text-gray-600">
            Discover amazing AI-generated images shared by our community
          </p>
        </header>

        {isEmpty ? (
          <div className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-600">
              No posts yet
            </h2>
            <p className="text-gray-500">
              Be the first to share your amazing creations!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <CommunityPost
                key={post.id}
                post={post}
                userLikes={filteredUserLikes}
                currentUserId={session.user.id}
              />
            ))}

            {hasNextPage && (
              <div className="flex justify-center py-6">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loading />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <span>Load more posts</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
