"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Avatar } from "../ui/avatar";
import { Input } from "../ui/input";
import { cn } from "~/lib/utils";
import { getImageUrl } from "~/lib/image-utils";
import { Skeleton } from "../ui/skeleton";

type Response = {
  id: number;
  prompt: string;
  url: string;
  sourceImage?: {
    id: string;
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
        id: string;
        url: string;
        address?: string | null;
      } | null;
      images: {
        id: string;
        url: string;
      }[];
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
    responseChain: Response[];
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
  const [isLiked, setIsLiked] = useState(userLikes.includes(post.id));
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [showSourceImage, setShowSourceImage] = useState(false);

  const { responseChain } = post;
  const utils = api.useUtils();

  useEffect(() => {
    if (responseChain) {
      const initialIndex = responseChain.findIndex(
        (r) => r.id === post.response.id,
      );
      if (initialIndex !== -1) {
        setCurrentResponseIndex(initialIndex);
      }
    }
  }, [responseChain, post.response.id]);

  const currentResponse = responseChain?.[currentResponseIndex];

  const handlePrev = () => {
    setShowSourceImage(false); // Always show generated image on navigation
    setCurrentResponseIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setShowSourceImage(false); // Always show generated image on navigation
    if (responseChain) {
      setCurrentResponseIndex((prev) =>
        Math.min(responseChain.length - 1, prev + 1),
      );
    }
  };

  const toggleLike = api.community.toggleLike.useMutation({
    onSuccess: (data) => {
      setIsLiked(data.liked);
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
    },
  });

  const addComment = api.community.addComment.useMutation({
    onSuccess: () => {
      setNewComment("");
      void utils.community.getSharedPosts.invalidate();
    },
  });

  const handleLike = () => {
    toggleLike.mutate({ sharedChainId: post.id });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment.mutate({
      sharedChainId: post.id,
      content: newComment.trim(),
    });
  };

  const imageUrl = showSourceImage
    ? getImageUrl(currentResponse?.sourceImage?.url)
    : getImageUrl(currentResponse?.url);

  const imageAlt = showSourceImage
    ? `Source image for ${post.title}`
    : post.title;

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
              {post.isPublic ? (
                <div title="Public post">
                  <Globe className="h-3 w-3 text-blue-500" />
                </div>
              ) : (
                <div title="Private post">
                  <Lock className="h-3 w-3 text-amber-500" />
                </div>
              )}
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

          {!responseChain ? (
            <Skeleton className="h-64 w-full" />
          ) : currentResponse ? (
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={imageUrl}
                alt={imageAlt}
                className="h-64 w-full object-cover"
              />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 transform rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                {showSourceImage ? "Source Image" : "Generated Image"}
              </div>

              {/* Navigation Arrows */}
              {responseChain && responseChain.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrev}
                    disabled={currentResponseIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 transform rounded-full bg-black/75 text-white hover:bg-black/90"
                    aria-label="previous response"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={currentResponseIndex === responseChain.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded-full bg-black/75 text-white hover:bg-black/90"
                    aria-label="next response"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                  <div className="absolute bottom-2 right-2 transform rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                    {currentResponseIndex + 1} / {responseChain.length}
                  </div>
                </>
              )}

              {/* Toggle Source/Generated Image Button */}
              {currentResponse.sourceImage?.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSourceImage(!showSourceImage)}
                  className="absolute right-2 top-2 transform rounded-full bg-black/50 text-white hover:bg-black/75"
                  aria-label={showSourceImage ? "Show generated image" : "Show source image"}
                >
                  {showSourceImage ? (
                    <RefreshCw className="h-5 w-5" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          ) : null}

          {currentResponse && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Prompt:</p>
              <p className="text-muted-foreground rounded-lg bg-gray-50 p-3 text-sm">
                {currentResponse.prompt}
              </p>
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
