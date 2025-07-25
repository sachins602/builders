import { Rocket, Trash2 } from "lucide-react";
import { ShareDialog } from "../ShareDialog";

export default function ResponseAction({
  onDelete,
  responseId,
  isGenerating,
  canGenerate,
}: {
  onDelete: () => void;
  responseId: number | null;
  isGenerating: boolean;
  canGenerate: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
      className="flex flex-col items-center rounded bg-red-500 p-1 text-white hover:bg-red-600"
      onClick={onDelete}
      >
      <Trash2 className="m-1 inline-block h-4 w-4" />
      <span>Delete</span>
      </button>
      <p className="text-gray-500">
      {isGenerating ? "Generating..." : canGenerate ? "" : "Select an image"}
      </p>
      {responseId ? (
      <ShareDialog responseId={responseId}>
        <button className="flex flex-col items-center rounded bg-green-500 p-1 text-white hover:bg-green-600">
        <Rocket className="m-1 inline-block h-4 w-4" />
        <span className="text-sm">Publish</span>
        </button>
      </ShareDialog>
      ) : (
      // Invisible placeholder to maintain alignment
      <div className="w-[72px] h-[40px] invisible" />
      )}
    </div>
  );
}
