import { Rocket, Trash2 } from "lucide-react";

export default function ResponseAction({
  onDelete,
  onPublish,
  isGenerating,
  canGenerate,
}: {
  onDelete: () => void;
  onPublish: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
}) {
  return (
    <div className="flex justify-between border-t bg-gray-100">
      <button
        className="flex flex-col items-center rounded bg-red-500 p-2 text-white hover:bg-red-600"
        onClick={onDelete}
      >
        <Trash2 className="m-2 inline-block h-4 w-4" />
        <span>Delete</span>
      </button>
      <p className="text-xs text-gray-500">
        {isGenerating
          ? "Generating..."
          : canGenerate
            ? "Ready"
            : "Select an image"}
      </p>
      <button
        className="flex flex-col items-center rounded bg-green-500 p-2 text-white hover:bg-green-600"
        onClick={onPublish}
      >
        <Rocket className="m-2 inline-block h-4 w-4" />
        <span>Publish</span>
      </button>
    </div>
  );
}
