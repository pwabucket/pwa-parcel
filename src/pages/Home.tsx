import AppIcon from "../assets/icon.svg";
import { Container } from "../components/Container";
import { Button } from "../components/Button";
import { AiOutlineMerge, AiOutlineSplitCells } from "react-icons/ai";
import { Link } from "react-router";

const Home = () => {
  return (
    <div className="flex flex-col min-h-dvh w-full items-center justify-center ">
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

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link to="/split">
              <AiOutlineSplitCells className="size-6" /> Split
            </Link>
          </Button>

          <Button asChild variant={"secondary"}>
            <Link to="/merge">
              <AiOutlineMerge className="size-6" /> Merge
            </Link>
          </Button>
        </div>
      </Container>
    </div>
  );
};

export { Home };
