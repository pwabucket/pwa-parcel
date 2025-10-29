import { cn } from "../lib/utils";

const Container = (props: React.ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className={cn("max-w-md mx-auto px-4 w-full", props.className)}
    />
  );
};

export { Container };
