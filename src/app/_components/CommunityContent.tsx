"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { CommunityPost } from "../_components/CommunityPost";
import { Button } from "../_components/ui/button";
import { Loader2 } from "lucide-react";
type SharedPost = {
  id: string;
  title: string;
  description?: string | null;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  response: {
    id: number;
    prompt: string;
    url: string;
    sourceImage?: {
      address?: string | null;
    } | null;
  };
  sharedBy: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
  sharedToUsers?: Array<{
    user: {
      id: string;
      name?: string | null;
    };
  }>;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      name?: string | null;
      image?: string | null;
    };
  }>;
  _count: {
    likes: number;
    comments: number;
  };
};

export default function CommunityPageContent({
  session,
}: {
  session: { user: { id: string } };
}) {
  const [posts, setPosts] = useState<SharedPost[]>([]);
  const [userLikes, setUserLikes] = useState<string[]>([]);

  const {
    data: postsData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.community.getSharedPosts.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Get user likes for all visible posts
  const { data: likes } = api.community.getUserLikes.useQuery(
    { sharedChainIds: posts.map((post) => post.id) },
    { enabled: posts.length > 0 && !!session },
  );

  useEffect(() => {
    if (postsData) {
      const allPosts = postsData.pages.flatMap((page) => page.items);
      setPosts(allPosts);
    }
  }, [postsData]);

  useEffect(() => {
    if (likes) {
      setUserLikes(likes.filter((like): like is string => like !== null));
    }
  }, [likes]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">Community</h1>
          <p className="text-gray-600">
            Discover amazing AI-generated images shared by our community
          </p>
        </div>

        {!posts || posts.length === 0 ? (
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
                userLikes={userLikes}
                currentUserId={session.user?.id}
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
                      <Loader2 className="h-4 w-4 animate-spin" />
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
