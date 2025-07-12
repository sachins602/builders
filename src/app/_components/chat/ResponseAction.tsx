import { Rocket, Trash2 } from "lucide-react";

export default function ResponseAction({
  onDelete,
  onPublish,
}: {
  onDelete: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="flex justify-between border-t bg-gray-100 p-4">
      <button
        className="flex flex-col items-center rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        onClick={onDelete}
      >
        <Trash2 className="m-2 inline-block h-4 w-4" />
        <span>Delete</span>
      </button>
      <button
        className="flex flex-col items-center rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        onClick={onPublish}
      >
        <Rocket className="m-2 inline-block h-4 w-4" />
        <span>Publish</span>
      </button>
    </div>
  );
}
