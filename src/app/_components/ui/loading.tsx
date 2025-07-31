import { cn } from "~/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ className, size = "md" }: LoadingProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
      </div>

      {/* Water pulse rings */}
      <div className="absolute inset-0">
        {/* First ring */}
        <div className="absolute inset-0 animate-ping rounded-full border-2 border-gray-300 opacity-75"></div>

        {/* Second ring */}
        <div
          className="absolute inset-0 animate-ping rounded-full border-2 border-gray-300 opacity-50"
          style={{ animationDelay: "0.5s" }}
        ></div>

        {/* Third ring */}
        <div
          className="absolute inset-0 animate-ping rounded-full border-2 border-gray-300 opacity-25"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Fourth ring */}
        <div
          className="absolute inset-0 animate-ping rounded-full border-2 border-gray-300 opacity-10"
          style={{ animationDelay: "1.5s" }}
        ></div>
      </div>
    </div>
  );
}

export default Loading;
