"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Eye,
  User,
  Globe,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Avatar } from "../ui/avatar";
import { Input } from "../ui/input";
import { cn } from "~/lib/utils";
import { getImageUrl } from "~/lib/image-utils";

type SimplePost = {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: Date;
  sharedBy: { id: string; name?: string | null; image?: string | null };
  heroImageUrl: string;
  sourceImage?: { id: number; url: string; address?: string | null } | null;
  prompt?: string | null;
  stats: { views: number; likes: number; comments: number };
  likedByMe: boolean;
};

interface FeedPostProps {
  post: SimplePost;
  disableInteractions?: boolean;
  chainItems?: Array<
    | {
        id: string;
        type: "source";
        prompt: null;
        url: string;
      }
    | {
        id: number | string;
        type: "response";
        prompt: string | null;
        url: string;
        step?: number;
      }
  >;
}

export function BuildChainComponent({
  post,
  disableInteractions = false,
  chainItems,
}: FeedPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [likeCount, setLikeCount] = useState<number>(
    Number(post.stats.likes ?? 0),
  );
  const [liked, setLiked] = useState(post.likedByMe);

  // Cache invalidation utilities
  const utils = api.useUtils();

  const toggleLike = api.community.toggleLike.useMutation({
    onSuccess: (data) => {
      setLiked(data.liked);
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
    },
  });

  const addComment = api.community.addComment.useMutation({
    onSuccess: () => {
      setNewComment("");
      void utils.community.getFeedSimple.invalidate();
    },
  });

  const handleLike = () => toggleLike.mutate({ sharedChainId: post.id });
  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content) return;
    addComment.mutate({ sharedChainId: post.id, content });
  };

  const heroUrl = useMemo(
    () => getImageUrl(post.heroImageUrl),
    [post.heroImageUrl],
  );

  // If chain not provided, attempt to fetch it from the source image id
  const { data: chainsForImage } =
    api.response.getResponseChainsByImageId.useQuery(
      { imageId: post.sourceImage?.id ?? -1 },
      { enabled: Boolean(post.sourceImage?.id) },
    );

  const fetchedFrames = useMemo(() => {
    if (!chainsForImage || !post.sourceImage?.id) return null;
    const chains = chainsForImage as Array<
      Array<{ id: number; prompt: string | null; url: string }>
    >;
    if (!chains.length) return null;
    const normalizedHero = post.heroImageUrl;
    // Prefer the chain whose last url matches the hero image url; fallback to longest
    const chainByHero = chains.find(
      (c) => c[c.length - 1]?.url === normalizedHero,
    );
    const selected =
      chainByHero ?? chains.reduce((a, b) => (a.length >= b.length ? a : b));
    const sourceFrame = {
      id: `source-${post.sourceImage.id}`,
      type: "source" as const,
      prompt: null,
      url: getImageUrl(post.sourceImage?.url ?? post.heroImageUrl),
    };
    const responseFrames = selected
      .filter((r) => Boolean(r?.url))
      .map((r) => ({
        id: r.id,
        type: "response" as const,
        prompt: r.prompt ?? null,
        url: getImageUrl(r.url ?? ""),
      }));
    return [sourceFrame, ...responseFrames];
  }, [
    chainsForImage,
    post.sourceImage?.id,
    post.sourceImage?.url,
    post.heroImageUrl,
  ]);

  // Build frames from chain if provided; otherwise fallback to single hero image
  const frames = useMemo(
    () =>
      (chainItems && chainItems.length > 0
        ? chainItems
        : fetchedFrames && fetchedFrames.length > 0
          ? fetchedFrames
          : [
              {
                id: "hero",
                type: "response" as const,
                prompt: post.prompt ?? null,
                url: post.heroImageUrl,
              },
            ]
      ).map((item) => ({
        id: item.id,
        type: item.type,
        prompt: item.type === "response" ? (item.prompt ?? null) : null,
        url: getImageUrl(item.url ?? ""),
      })),
    [chainItems, fetchedFrames, post.heroImageUrl, post.prompt],
  );

  const [activeIndex, setActiveIndex] = useState(() =>
    frames.length > 0 ? frames.length - 1 : 0,
  );

  useEffect(() => {
    setActiveIndex((i) => {
      if (frames.length === 0) return 0;
      if (i > frames.length - 1) return frames.length - 1;
      if (i < 0) return 0;
      return i;
    });
  }, [frames.length]);

  // Keep active index in bounds when frames change
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < frames.length - 1;
  const goPrev = () => setActiveIndex((i) => (i > 0 ? i - 1 : i));
  const goNext = () =>
    setActiveIndex((i) => (i < frames.length - 1 ? i + 1 : i));

  const activeFrame = frames[activeIndex];

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center space-x-3">
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
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {post.sharedBy.name ?? "Anonymous"}
            </p>
            {post.isPublic ? (
              <Globe className="h-5 w-5 text-blue-500" />
            ) : (
              <Lock className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {post.sourceImage?.address && (
          <p className="text-muted-foreground text-xs">
            Location: {post.sourceImage.address}
          </p>
        )}
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={activeFrame?.url ?? heroUrl}
            alt={post.title}
            className="h-96 w-full object-fill"
          />
          {/* Navigation overlays and buttons */}
          {frames.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={!canGoPrev}
                className={cn(
                  "absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 disabled:opacity-40",
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className={cn(
                  "absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 disabled:opacity-40",
                )}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              {/* Large click areas for easier navigation */}
              <div
                aria-hidden
                onClick={() => canGoPrev && goPrev()}
                className="absolute inset-y-0 left-0 z-0 w-1/2 cursor-pointer"
              />
              <div
                aria-hidden
                onClick={() => canGoNext && goNext()}
                className="absolute inset-y-0 right-0 z-0 w-1/2 cursor-pointer"
              />
              <div
                className={cn(
                  "absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white",
                )}
              >
                {Math.min(activeIndex + 1, frames.length)} / {frames.length}
              </div>
            </>
          )}
        </div>
        {activeFrame?.type === "response" && activeFrame?.prompt && (
          <p className="text-muted-foreground mt-1 text-sm">
            {activeFrame.prompt}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex-col items-start">
        <div className="flex w-full items-center space-x-4">
          {!disableInteractions && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={toggleLike.isPending}
                className={cn(
                  "flex items-center space-x-1",
                  liked && "text-red-500",
                )}
              >
                <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                <span>{likeCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-1"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{post.stats.comments}</span>
              </Button>
            </>
          )}

          <div className="text-muted-foreground ml-auto flex items-center space-x-1 text-sm">
            <Eye className="h-4 w-4" />
            <span>{post.stats.views}</span>
          </div>
        </div>

        {showComments && !disableInteractions && (
          <form onSubmit={handleComment} className="flex w-full space-x-2">
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
        )}
      </CardFooter>
    </Card>
  );
}
