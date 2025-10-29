import { cn } from "../lib/utils";

const MainContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <main className="flex flex-col p-4 grow min-w-0 min-h-0">
      <div
        className={cn(
          "w-full max-w-md mx-auto flex flex-col grow min-w-0 min-h-0",
          className
        )}
      >
        {children}
      </div>
    </main>
  );
};

export { MainContainer };
