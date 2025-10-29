import { AppHeader } from "../components/AppHeader";
import { MainContainer } from "../components/MainContainer";
import { useNavigateBack } from "../hooks/useNavigateBack";
import { HiOutlineArrowLeft } from "react-icons/hi2";

interface InnerPageLayoutProps {
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const InnerPageLayout = ({
  title,
  children,
  className,
}: InnerPageLayoutProps) => {
  const navigateBack = useNavigateBack();
  return (
    <div className="flex flex-col min-h-dvh">
      <AppHeader
        leftContent={
          <AppHeader.Button onClick={() => navigateBack()}>
            <HiOutlineArrowLeft className="size-6 text-neutral-400" />
          </AppHeader.Button>
        }
        middleContent={
          <h1 className="text-center font-bold flex justify-center items-center gap-2">
            {title}
          </h1>
        }
      />

      {/* Main content area */}
      <MainContainer className={className}>{children}</MainContainer>
    </div>
  );
};

export { InnerPageLayout };
