"use client";

import { useState, useMemo } from "react";
import {
  Heart,
  MessageCircle,
  Eye,
  User,
  Lock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Avatar } from "../ui/avatar";
import { Input } from "../ui/input";
import { cn } from "~/lib/utils";
import { getImageUrl } from "~/lib/image-utils";
import { Skeleton } from "../ui/skeleton";

type ResponseChainItem = {
  id: string | number;
  type: "source" | "response";
  prompt: string | null;
  url: string;
  sourceImage?: {
    id: number;
    url: string;
    address?: string | null;
  } | null;
  previousResponseId?: number | null;
};

interface CommunityPostProps {
  post: {
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
        id: number;
        url: string;
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
    responseChain: ResponseChainItem[];
  };
  userLikes?: string[];
  currentUserId?: string;
}

export function CommunityPost({
  post,
  userLikes = [],
  currentUserId,
}: CommunityPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [showSourceImage, setShowSourceImage] = useState(false);

  const utils = api.useUtils();

  // Memoize computed values
  const isLiked = useMemo(
    () => userLikes.includes(post.id),
    [userLikes, post.id],
  );
  const currentResponse = useMemo(
    () => post.responseChain?.[currentResponseIndex],
    [post.responseChain, currentResponseIndex],
  );
  const hasMultipleImages = useMemo(
    () => post.responseChain?.length > 1,
    [post.responseChain],
  );
  const canNavigate = useMemo(
    () => ({
      prev: currentResponseIndex > 0,
      next: currentResponseIndex < (post.responseChain?.length || 0) - 1,
    }),
    [currentResponseIndex, post.responseChain],
  );

  const imageUrl = useMemo(() => {
    if (!currentResponse) return "";
    return showSourceImage
      ? getImageUrl(currentResponse.sourceImage?.url ?? "")
      : getImageUrl(currentResponse.url ?? "");
  }, [currentResponse, showSourceImage]);

  // API mutations
  const toggleLike = api.community.toggleLike.useMutation({
    onSuccess: (data) =>
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1)),
  });

  const addComment = api.community.addComment.useMutation({
    onSuccess: () => {
      setNewComment("");
      void utils.community.getSharedPosts.invalidate();
    },
  });

  // Event handlers
  const handleLike = () => toggleLike.mutate({ sharedChainId: post.id });

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content) return;
    addComment.mutate({ sharedChainId: post.id, content });
  };

  const handleNavigation = (direction: "prev" | "next") => {
    setShowSourceImage(false);
    setCurrentResponseIndex((prev) =>
      direction === "prev"
        ? Math.max(0, prev - 1)
        : Math.min((post.responseChain?.length || 0) - 1, prev + 1),
    );
  };

  // Determine sharing status for iconography
  const isPublic = post.isPublic;
  const isSharedByMe = !isPublic && post.sharedBy.id === currentUserId;
  const isSharedWithMe = !isPublic && post.sharedBy.id !== currentUserId;

  if (!post.responseChain?.length) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            {post.sharedBy.image ? (
              <img
                src={post.sharedBy.image}
                alt={post.sharedBy.name ?? "User"}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {post.sharedBy.name ?? "Anonymous"}
              </p>
              {/* Iconography for public/private/shared */}
              {isPublic ? (
                <div title="Public post">
                  <Globe className="h-3 w-3 text-blue-500" />
                </div>
              ) : isSharedByMe ? (
                <div title="Private post (shared by you)">
                  <Lock className="h-3 w-3 text-amber-500" />
                </div>
              ) : isSharedWithMe ? (
                <div
                  className="flex items-center gap-1"
                  title="Private post (shared with you)"
                >
                  <Lock className="h-3 w-3 text-amber-500" />
                  <UserCheck className="h-3 w-3 text-green-600" />
                </div>
              ) : null}
            </div>
            <p className="text-muted-foreground text-xs">
              {new Date(post.createdAt).toLocaleDateString()}
              {!post.isPublic &&
                post.sharedToUsers &&
                post.sharedBy.id === currentUserId && (
                  <span className="ml-2">
                    • Shared with {post.sharedToUsers.length} user
                    {post.sharedToUsers.length !== 1 ? "s" : ""}
                  </span>
                )}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">{post.title}</h3>
            {post.description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {post.description}
              </p>
            )}
          </div>

          {currentResponse && (
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={imageUrl}
                alt={
                  showSourceImage
                    ? `Source image for ${post.title}`
                    : post.title
                }
                className="h-[500px] w-full object-cover"
              />

              {/* Navigation Controls */}
              {hasMultipleImages && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleNavigation("prev")}
                    disabled={!canNavigate.prev}
                    className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/75 text-white hover:bg-black/90 disabled:opacity-50"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleNavigation("next")}
                    disabled={!canNavigate.next}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/75 text-white hover:bg-black/90 disabled:opacity-50"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                  <div className="absolute right-2 bottom-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                    {currentResponseIndex + 1} / {post.responseChain.length}
                  </div>
                </>
              )}

              {/* Source/Generated Toggle */}
              {currentResponse.sourceImage?.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSourceImage(!showSourceImage)}
                  className="absolute top-2 right-2 rounded-full bg-black/50 text-white hover:bg-black/75"
                  aria-label={
                    showSourceImage
                      ? "Show generated image"
                      : "Show source image"
                  }
                >
                  {showSourceImage ? (
                    <RefreshCw className="h-5 w-5" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          )}

          {currentResponse && (
            <div className="space-y-2">
              {currentResponse.type === "response" &&
                currentResponse.prompt && (
                  <>
                    <p className="text-sm font-medium">Prompt:</p>
                    <p className="text-muted-foreground rounded-lg bg-gray-50 p-3 text-sm">
                      {currentResponse.prompt}
                    </p>
                  </>
                )}
              {currentResponse.type === "source" && (
                <p className="text-sm font-medium text-blue-600">
                  Original Image
                </p>
              )}
              {currentResponse.sourceImage?.address && (
                <p className="text-muted-foreground text-xs">
                  Location: {currentResponse.sourceImage.address}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start space-y-3 pt-0">
        <div className="flex w-full items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={toggleLike.isPending}
            className={cn(
              "flex items-center space-x-1",
              isLiked && "text-red-500",
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            <span>{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post._count.comments}</span>
          </Button>

          <div className="text-muted-foreground ml-auto flex items-center space-x-1 text-sm">
            <Eye className="h-4 w-4" />
            <span>{post.viewCount}</span>
          </div>
        </div>

        {showComments && (
          <div className="w-full space-y-3">
            <form onSubmit={handleComment} className="flex space-x-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={1000}
                className="flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || addComment.isPending}
              >
                Post
              </Button>
            </form>

            {post.comments && post.comments.length > 0 && (
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <Avatar className="mt-1 h-6 w-6">
                      {comment.author.image ? (
                        <img
                          src={comment.author.image}
                          alt={comment.author.name ?? "User"}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200">
                          <User className="h-3 w-3 text-gray-500" />
                        </div>
                      )}
                    </Avatar>
                    <div className="flex-1 rounded-lg bg-gray-50 p-2">
                      <p className="text-xs font-medium">
                        {comment.author.name ?? "Anonymous"}
                      </p>
                      <p className="text-sm">{comment.content}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
