import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { HistoryItem } from "./HistoryItem";

export default async function History() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please sign in to view your generation history.
          </p>
        </div>
      </div>
    );
  }

  const chatData = await api.response.getChatData();
  if (!chatData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            No History Found
          </h2>
          <p className="text-gray-600">
            Start generating images to see them here!
          </p>
        </div>
      </div>
    );
  }

  const { responseHistory } = chatData;

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Generation History</h1>
        <p className="text-gray-600">View your previously generated images</p>
      </div>

      {responseHistory.length === 0 ? (
        <div className="py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-600">
            No generations yet
          </h2>
          <p className="text-gray-500">
            Start creating images to see them here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {responseHistory.map((response) => (
            <HistoryItem key={response.id} response={response} />
          ))}
        </div>
      )}
    </div>
  );
}
