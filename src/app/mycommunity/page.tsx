import { auth } from "~/server/auth";
import CommunityPageContent from "../_components/CommunityContent";

export default async function MyCommunityPage() {
  const session = await auth();
  if (!session) {
    return <div>not Authenticated</div>;
  }

  return <CommunityPageContent session={session} />;
}
