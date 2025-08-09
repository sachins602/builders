"use client";

import { useState, useMemo } from "react";
import { Heart, MessageCircle, Eye, User, Globe, Lock } from "lucide-react";
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
}

export function BuildChainComponent({
  post,
  disableInteractions = false,
}: FeedPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [likeCount, setLikeCount] = useState(post.stats.likes);
  const [liked, setLiked] = useState(post.likedByMe);

  // Optional cache invalidation after comment
  const utils = api.useUtils ? api.useUtils() : undefined;

  const toggleLike = api.community.toggleLike.useMutation({
    onSuccess: (data) => {
      setLiked(data.liked);
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
    },
  });

  const addComment = api.community.addComment.useMutation({
    onSuccess: () => {
      setNewComment("");
      void utils?.community.getFeedSimple.invalidate();
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
                <Globe className="h-3 w-3 text-blue-500" />
              ) : (
                <Lock className="h-3 w-3 text-amber-500" />
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">{post.title}</h3>
            {post.prompt && (
              <p className="text-muted-foreground mt-1 text-sm">
                {post.prompt}
              </p>
            )}
          </div>

          <div className="relative overflow-hidden rounded-lg">
            <img
              src={heroUrl}
              alt={post.title}
              className="h-[500px] w-full object-cover"
            />
          </div>

          {post.sourceImage?.address && (
            <p className="text-muted-foreground text-xs">
              Location: {post.sourceImage.address}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start space-y-3 pt-0">
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
