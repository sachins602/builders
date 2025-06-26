"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { X, Search, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./ui/command";

interface ShareDialogProps {
  responseId: number;
  children: React.ReactNode;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export function ShareDialog({ responseId, children }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced user search
  const { data: searchResults = [], isLoading: isSearching } =
    api.community.searchUsers.useQuery(
      { query: searchQuery },
      {
        enabled: searchQuery.length >= 2 && !isPublic,
        staleTime: 30000,
      },
    );

  const shareResponse = api.community.shareResponse.useMutation({
    onSuccess: () => {
      setOpen(false);
      setTitle("");
      setDescription("");
      setIsPublic(true);
      setSelectedUsers([]);
      setSearchQuery("");
      setShowUserSearch(false);
      // You could add a toast notification here
    },
  });

  const handleShare = () => {
    if (!title.trim()) return;

    shareResponse.mutate({
      responseId,
      title: title.trim(),
      description: description.trim() || undefined,
      isPublic,
      selectedUserIds: selectedUsers.map((user) => user.id),
    });
  };

  const handlePublicToggle = (checked: boolean) => {
    setIsPublic(checked);
    if (checked) {
      setSelectedUsers([]);
      setSearchQuery("");
      setShowUserSearch(false);
    }
  };

  const addUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery("");
    setShowUserSearch(false);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setShowUserSearch(value.length >= 2);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Your Creation</DialogTitle>
          <DialogDescription>
            Share your generated image with the community. Choose whether to
            make it public or keep it private.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your creation a title"
              maxLength={100}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your creation or the process..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="public"
                checked={isPublic}
                onCheckedChange={handlePublicToggle}
              />
              <Label htmlFor="public" className="text-sm font-normal">
                Make this public (everyone can see it)
              </Label>
            </div>

            {!isPublic && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Private shares are only visible to you and users you select
                  below.
                </p>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <Badge
                        key={user.id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={user.image ?? ""} />
                          <AvatarFallback className="text-xs">
                            {user.name?.[0]?.toUpperCase() ?? (
                              <User className="h-2 w-2" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">
                          {user.name ?? user.email}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0.5"
                          onClick={() => removeUser(user.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* User Search */}
                <div className="relative">
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="Search users to share with..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {showUserSearch && searchQuery.length >= 2 && (
                    <div className="bg-popover absolute z-50 mt-1 w-full rounded-md border shadow-md">
                      <Command>
                        <CommandList className="max-h-[200px]">
                          {isSearching ? (
                            <div className="text-muted-foreground p-4 text-center text-sm">
                              Searching...
                            </div>
                          ) : searchResults.length === 0 ? (
                            <CommandEmpty>No users found.</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {searchResults
                                .filter(
                                  (user) =>
                                    !selectedUsers.find(
                                      (u) => u.id === user.id,
                                    ),
                                )
                                .map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    onSelect={() => addUser(user)}
                                    className="flex cursor-pointer items-center gap-2"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={user.image ?? ""} />
                                      <AvatarFallback className="text-xs">
                                        {user.name?.[0]?.toUpperCase() ?? (
                                          <User className="h-3 w-3" />
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="text-sm">
                                        {user.name ?? "Unknown User"}
                                      </span>
                                      {user.email && (
                                        <span className="text-muted-foreground text-xs">
                                          {user.email}
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={
              !title.trim() ||
              shareResponse.isPending ||
              (!isPublic && selectedUsers.length === 0)
            }
          >
            {shareResponse.isPending ? "Sharing..." : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
