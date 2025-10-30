import { Link } from "react-router";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

interface ActionCardProps {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  variant: "purple" | "green";
  className?: string;
}

const variantStyles = {
  purple: {
    border: "border-purple-500/20 hover:border-purple-400/40",
    background: "bg-linear-to-br from-purple-900/20 to-purple-800/10",
    iconBg: "bg-purple-500/20 group-hover:bg-purple-500/30",
    title: "text-purple-200 group-hover:text-purple-100",
    description: "text-purple-300/70",
  },
  green: {
    border: "border-green-500/20 hover:border-green-400/40",
    background: "bg-linear-to-br from-green-900/20 to-green-800/10",
    iconBg: "bg-green-500/20 group-hover:bg-green-500/30",
    title: "text-green-200 group-hover:text-green-100",
    description: "text-green-300/70",
  },
};

const ActionCard = ({
  to,
  icon,
  title,
  description,
  variant,
  className,
}: ActionCardProps) => {
  const styles = variantStyles[variant];

  return (
    <Link
      to={to}
      className={cn(
        "group relative overflow-hidden rounded-lg p-6 transition-all duration-300 hover:scale-105",
        styles.border,
        styles.background,
        className
      )}
    >
      <div className="flex flex-row md:flex-col items-center gap-3 text-left md:text-center">
        <div
          className={cn(
            "p-3 rounded-full transition-colors shrink-0",
            styles.iconBg
          )}
        >
          {icon}
        </div>
        <div>
          <h3
            className={cn("text-xl font-bold transition-colors", styles.title)}
          >
            {title}
          </h3>
          <p className={cn("text-sm font-mono mt-1", styles.description)}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

export { ActionCard };
