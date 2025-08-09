"use client";

import { api } from "~/trpc/react";
import { Button } from "../_components/ui/button";
import { BuildChainComponent } from "../_components/BuildChainComponent/BuildChainComponent";
import { Loading } from "../_components/ui/loading";
import { Heart } from "lucide-react";

export default function LikesPage() {
  const {
    data: likedPosts,
    isLoading,
    isError,
    refetch,
  } = api.community.getUserLikedResponses.useQuery();
  const posts = (likedPosts ?? []).map((s) => {
    const responses = s.chain.responses ?? [];
    const lastResponse = responses[responses.length - 1];
    return {
      id: s.id,
      title: s.title,
      isPublic: s.visibility === "PUBLIC",
      createdAt: s.createdAt,
      sharedBy: s.sharedBy,
      heroImageUrl: lastResponse?.url ?? s.chain.rootImage?.url ?? "",
      sourceImage: s.chain.rootImage
        ? {
            id: s.chain.rootImage.id,
            url: s.chain.rootImage.url,
            address: s.chain.rootImage.address,
          }
        : null,
      prompt: lastResponse?.prompt ?? null,
      stats: {
        views: s.viewCount,
        likes: s.likeCount,
        comments: s.commentCount,
      },
      likedByMe: true,
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Loading />
              <p className="text-muted-foreground">
                Loading your liked posts...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold text-gray-800">
                Error Loading Liked Posts
              </h2>
              <p className="mb-4 text-gray-600">
                There was an issue loading your liked posts. Please try again.
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Content */}
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 flex justify-center">
              <Heart className="h-16 w-16 text-gray-300" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-600">
              No liked posts yet
            </h2>
            <p className="mb-4 text-gray-500">
              Start exploring the community and like posts that inspire you!
            </p>
            <Button
              onClick={() => (window.location.href = "/mycommunity")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Explore Community
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Posts */}
            {posts.map((post) => (
              <BuildChainComponent key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
