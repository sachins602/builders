import { notFound } from "next/navigation";
import { CommunityPost } from "~/app/_components/CommunityPost/CommunityPost";
import { HydrateClient } from "~/trpc/server";
import { api } from "~/trpc/server";
import { ShareButton } from "~/app/_components/ShareButton";

interface BuildPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BuildPage({ params }: BuildPageProps) {
  const resolvedParams = await params;
  const post = await api.user.getUserResponseById({
    responseId: parseInt(resolvedParams.id),
  });

  if (!post) return notFound();

  return (
    <HydrateClient>
      <div className="flex flex-row justify-center gap-4">
        <div className="max-w-2xl">
          <CommunityPost post={post} />
        </div>
        <ShareButton />
      </div>
    </HydrateClient>
  );
}
