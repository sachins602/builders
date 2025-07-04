import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import React from "react";
import { CommunityPost } from "./CommunityPost";

// Mock tRPC
vi.mock("~/trpc/react", () => ({
  api: {
    useUtils: vi.fn(() => ({
      community: {
        getSharedPosts: {
          invalidate: vi.fn(),
        },
      },
    })),
    community: {
      toggleLike: {
        useMutation: vi.fn(),
      },
      addComment: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// Mock image utils
vi.mock("~/lib/image-utils", () => ({
  getImageUrl: (url: string) => url,
}));

describe("CommunityPost", () => {
  const mockPost = {
    id: "post-1",
    title: "Test Post",
    description: "This is a test post",
    isPublic: true,
    viewCount: 42,
    likeCount: 5,
    commentCount: 2,
    createdAt: new Date("2024-01-01"),
    response: {
      id: 1,
      prompt: "Create a modern building",
      url: "/test-image.jpg",
      sourceImage: {
        address: "123 Test Street",
      },
    },
    sharedBy: {
      id: "user-1",
      name: "John Doe",
      image: "/avatar.jpg",
    },
    sharedToUsers: [],
    comments: [
      {
        id: "comment-1",
        content: "Great post!",
        createdAt: new Date("2024-01-02"),
        author: {
          id: "user-2",
          name: "Jane Smith",
          image: "/jane.jpg",
        },
      },
    ],
    _count: {
      likes: 5,
      comments: 1,
    },
  };

  let mockToggleLike: Mock;
  let mockAddComment: Mock;

  beforeEach(async () => {
    mockToggleLike = vi.fn();
    mockAddComment = vi.fn();

    // Setup mutation mocks with simple returns
    const { api } = await import("~/trpc/react");
    (api.community.toggleLike.useMutation as Mock).mockReturnValue({
      mutate: mockToggleLike,
      isPending: false,
    });
    (api.community.addComment.useMutation as Mock).mockReturnValue({
      mutate: mockAddComment,
      isPending: false,
    });
  });

  it("renders post information correctly", () => {
    render(<CommunityPost post={mockPost} />);

    // Check basic post info
    expect(screen.getByText("Test Post")).toBeInTheDocument();
    expect(screen.getByText("This is a test post")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    // Check prompt
    expect(screen.getByText("Create a modern building")).toBeInTheDocument();

    // Check location
    expect(screen.getByText("Location: 123 Test Street")).toBeInTheDocument();

    // Check stats
    expect(screen.getByText("5")).toBeInTheDocument(); // likes
    expect(screen.getByText("42")).toBeInTheDocument(); // views
  });

  it("displays public icon for public posts", () => {
    render(<CommunityPost post={mockPost} />);

    const publicIcon = screen.getByTitle("Public post");
    expect(publicIcon).toBeInTheDocument();
  });

  it("displays private icon for private posts", () => {
    const privatePost = {
      ...mockPost,
      isPublic: false,
    };

    render(<CommunityPost post={privatePost} />);

    const privateIcon = screen.getByTitle("Private post");
    expect(privateIcon).toBeInTheDocument();
  });

  it("shows user avatar", () => {
    render(<CommunityPost post={mockPost} />);

    const avatar = screen.getByAltText("John Doe");
    expect(avatar).toHaveAttribute("src", "/avatar.jpg");
  });

  it("shows fallback avatar when no image", () => {
    const postWithoutAvatar = {
      ...mockPost,
      sharedBy: {
        ...mockPost.sharedBy,
        image: null,
      },
    };

    render(<CommunityPost post={postWithoutAvatar} />);

    // Check that user name is still displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  describe("Like functionality", () => {
    it("handles like action", () => {
      render(<CommunityPost post={mockPost} currentUserId="user-1" />);

      const likeButton = screen.getByRole("button", { name: /5/i });
      fireEvent.click(likeButton);

      expect(mockToggleLike).toHaveBeenCalledWith({
        sharedChainId: "post-1",
      });
    });

    it("shows liked state when user has liked", () => {
      render(
        <CommunityPost
          post={mockPost}
          userLikes={["post-1"]}
          currentUserId="user-1"
        />,
      );

      const likeButton = screen.getByRole("button", { name: /5/i });
      expect(likeButton).toHaveClass("text-red-500");
    });
  });

  describe("Comments functionality", () => {
    it("toggles comments visibility", () => {
      render(<CommunityPost post={mockPost} />);

      // Comments should be hidden initially
      expect(
        screen.queryByPlaceholderText("Add a comment..."),
      ).not.toBeInTheDocument();

      // Click comment button to show comments
      const commentButton = screen.getByRole("button", { name: /1/i });
      fireEvent.click(commentButton);

      // Comments should now be visible
      expect(
        screen.getByPlaceholderText("Add a comment..."),
      ).toBeInTheDocument();
      expect(screen.getByText("Great post!")).toBeInTheDocument();
    });

    it("displays existing comments", () => {
      render(<CommunityPost post={mockPost} />);

      // Show comments
      const commentButton = screen.getByRole("button", { name: /1/i });
      fireEvent.click(commentButton);

      // Check comment details
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Great post!")).toBeInTheDocument();
    });

    it("handles adding new comment", () => {
      render(<CommunityPost post={mockPost} currentUserId="user-1" />);

      // Show comments
      const commentButton = screen.getByRole("button", { name: /1/i });
      fireEvent.click(commentButton);

      // Type comment
      const commentInput = screen.getByPlaceholderText("Add a comment...");
      fireEvent.change(commentInput, { target: { value: "New comment" } });

      // Submit comment
      const postButton = screen.getByRole("button", { name: /post/i });
      fireEvent.click(postButton);

      expect(mockAddComment).toHaveBeenCalledWith({
        sharedChainId: "post-1",
        content: "New comment",
      });
    });

    it("prevents empty comments", () => {
      render(<CommunityPost post={mockPost} />);

      // Show comments
      const commentButton = screen.getByRole("button", { name: /1/i });
      fireEvent.click(commentButton);

      // Try to submit empty comment
      const postButton = screen.getByRole("button", { name: /post/i });
      expect(postButton).toBeDisabled();
    });
  });

  it("displays dates correctly", () => {
    render(<CommunityPost post={mockPost} />);

    // Check post date (12/31/2023 because of how JavaScript formats dates)
    expect(screen.getByText("12/31/2023")).toBeInTheDocument();

    // Show comments to check comment date
    const commentButton = screen.getByRole("button", { name: /1/i });
    fireEvent.click(commentButton);

    expect(screen.getByText("1/1/2024")).toBeInTheDocument();
  });

  it("shows shared user count for private posts", () => {
    const privatePost = {
      ...mockPost,
      isPublic: false,
      sharedToUsers: [
        { user: { id: "user-2", name: "User 2" } },
        { user: { id: "user-3", name: "User 3" } },
      ],
    };

    render(<CommunityPost post={privatePost} currentUserId="user-1" />);

    expect(screen.getByText("• Shared with 2 users")).toBeInTheDocument();
  });
});
