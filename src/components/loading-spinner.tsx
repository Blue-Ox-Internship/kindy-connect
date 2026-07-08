import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", text, className }: LoadingSpinnerProps) {
  const sizes = {
    sm: "h-6 w-6 border-2",
    md: "h-10 w-10 border-3",
    lg: "h-16 w-16 border-4",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          sizes[size],
          "rounded-full border-primary border-t-transparent animate-spin"
        )}
      />
      {text && (
        <p className={cn(textSizes[size], "font-medium text-muted-foreground animate-pulse")}>
          {text}
        </p>
      )}
    </div>
  );
}

interface PageLoadingProps {
  text?: string;
}

export function PageLoading({ text = "Loading page..." }: PageLoadingProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

interface InlineLoadingProps {
  text?: string;
}

export function InlineLoading({ text = "Loading..." }: InlineLoadingProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}
