import AppIcon from "../assets/icon.svg";
import { Container } from "../components/Container";
import { ActionCard } from "../components/ActionCard";
import { AiOutlineMerge, AiOutlineSplitCells } from "react-icons/ai";

const Home = () => {
  return (
    <div className="flex flex-col min-h-dvh w-full items-center justify-center py-10">
      <Container className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 justify-center items-center">
          <img src={AppIcon} alt="App Icon" className="size-28 mx-auto" />
          <h1 className="text-5xl text-center font-display text-purple-300">
            Parcel
          </h1>
          <p className="text-center font-mono text-green-300">
            Token Splitter / Merger
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          <ActionCard
            to="/split"
            icon={<AiOutlineSplitCells className="size-8 text-purple-300" />}
            title="Split Tokens"
            description="Distribute tokens to multiple addresses"
            variant="purple"
          />

          <ActionCard
            to="/merge"
            icon={<AiOutlineMerge className="size-8 text-green-300" />}
            title="Merge Tokens"
            description="Combine tokens from multiple sources"
            variant="green"
          />
        </div>
      </Container>
    </div>
  );
};

export { Home };
