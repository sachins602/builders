import { api } from "~/trpc/server";

export default async function LikesPage() {
  const responses = await api.community.getUserLikedResponses();

  return (
    <div>
      <h1>Likes</h1>
      <div>
        {responses.map((response) => (
          <div key={response?.id}>
            <p>{response?.title}</p>
            <p>{response?.description}</p>
            <p>{response?.responseId}</p>
            <p>{response?.sharedById}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
