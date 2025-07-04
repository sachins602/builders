"use client";

import { useState } from "react";
import { Heart, MessageCircle, Eye, User, Lock, Globe } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Avatar } from "../ui/avatar";
import { Input } from "../ui/input";
import { cn } from "~/lib/utils";
import { getImageUrl } from "~/lib/image-utils";

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

  const utils = api.useUtils();

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

          <div className="relative overflow-hidden rounded-lg">
            <img
              src={getImageUrl(post.response.url)}
              alt={post.title}
              className="h-64 w-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Prompt:</p>
            <p className="text-muted-foreground rounded-lg bg-gray-50 p-3 text-sm">
              {post.response.prompt}
            </p>
            {post.response.sourceImage?.address && (
              <p className="text-muted-foreground text-xs">
                Location: {post.response.sourceImage.address}
              </p>
            )}
          </div>
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
