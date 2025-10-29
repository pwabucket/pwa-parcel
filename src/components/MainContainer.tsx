import { cn } from "../lib/utils";
import { Container } from "./Container";

const MainContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <main className="flex flex-col grow min-w-0 min-h-0">
      <Container
        className={cn("flex flex-col grow min-w-0 min-h-0 p-4", className)}
      >
        {children}
      </Container>
    </main>
  );
};

export { MainContainer };
