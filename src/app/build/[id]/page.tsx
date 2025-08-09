import { notFound } from "next/navigation";
import { HydrateClient } from "~/trpc/server";
import { api } from "~/trpc/server";
import { ShareButton } from "~/app/_components/ShareButton";
import { BuildChainComponent } from "~/app/_components/BuildChainComponent/BuildChainComponent";

interface BuildPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Local types mirroring API response items
type SourceItem = {
  id: string;
  type: "source";
  prompt: null;
  url: string;
  sourceImage: { id: number; url: string; address?: string | null } | null;
};
type ResponseItem = {
  id: number;
  type: "response";
  prompt: string;
  url: string;
  step: number;
};
type ChainItem = SourceItem | ResponseItem;

type SimplePostLike = {
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

export default async function BuildPage({ params }: BuildPageProps) {
  const resolvedParams = await params;
  const data = await api.user.getUserResponseById({
    responseId: parseInt(resolvedParams.id),
  });

  if (!data) return notFound();

  // Map API response to BuildChainComponent's expected post shape
  const responses = (data.chain.responses ?? []) as ChainItem[];
  const responseItems = responses.filter(
    (r): r is ResponseItem => r.type === "response",
  );
  const lastResponse =
    responseItems.length > 0
      ? responseItems[responseItems.length - 1]
      : undefined;
  const sourceItem = responses.find(
    (r): r is SourceItem => r.type === "source",
  );

  const heroImageUrl =
    lastResponse?.url ?? data.chain.rootImage?.url ?? sourceItem?.url ?? "";

  const componentPost: SimplePostLike = {
    id: data.share.id,
    title: data.share.title || "Untitled build",
    isPublic: data.share.visibility === "PUBLIC",
    createdAt: data.share.createdAt,
    sharedBy: data.share.sharedBy,
    heroImageUrl,
    sourceImage: data.chain.rootImage
      ? {
          id: data.chain.rootImage.id,
          url: data.chain.rootImage.url,
          address: data.chain.rootImage.address ?? null,
        }
      : null,
    prompt: lastResponse?.prompt ?? null,
    stats: {
      views: 0,
      likes: Number(data.share._count?.likes ?? 0),
      comments: Number(data.share._count?.comments ?? 0),
    },
    likedByMe: false,
  };

  const disableInteractions = componentPost.id.startsWith("unshared-");

  return (
    <HydrateClient>
      <div className="flex flex-row justify-center gap-4">
        <div className="max-w-2xl">
          <BuildChainComponent
            post={componentPost}
            disableInteractions={disableInteractions}
          />
        </div>
        <ShareButton />
      </div>
    </HydrateClient>
  );
}
