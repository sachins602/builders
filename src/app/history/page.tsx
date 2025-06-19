import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function History() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  const chatData = await api.response.getChatData();
  if (!chatData) {
    return <div>No history found.</div>;
  }
  const { responseHistory } = chatData;

  return (
    <div className="container mx-auto py-8 text-white">
      <h1>History</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {responseHistory.map((response) => (
          <div
            key={response.id}
            className="group relative overflow-hidden rounded-lg"
          >
            <img
              alt="Generated Art"
              className="h-60 w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              src={`/${response.url}`}
              style={{
                aspectRatio: "400/400",
                objectFit: "cover",
              }}
            />
            <div className="absolute inset-0 bg-black/70 p-4 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100">
              <h3 className="text-lg font-semibold text-white">
                {response.prompt}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
