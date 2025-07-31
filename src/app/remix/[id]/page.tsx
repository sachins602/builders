import { api } from "~/trpc/server";

interface RemixPageProps {
  params: Promise<{
    id: string;
  }>;
}
export default async function RemixPage({ params }: RemixPageProps) {
  const resolvedParams = await params;
  console.log(resolvedParams);
  return <div>RemixPage {resolvedParams.id}</div>;
}
