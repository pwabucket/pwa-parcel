import { CustomTokenForm } from "../../components/CustomTokenForm";
import { TonApiClient } from "../../parcels/TONParcel";
import type { Token } from "../../types";

const getTokenDetails = async (
  address: string
): Promise<Partial<Token> | null> => {
  try {
    const data = await new TonApiClient(import.meta.env.PROD).getJettonInfo(
      address
    );

    return {
      name: data.name,
      symbol: data.symbol,
      decimals: data.decimals,
      icon: data.image,
    };
  } catch (error) {
    console.error("Error fetching token details:", error);
    return null;
  }
};

const TONCustomTokenForm = ({
  onSubmit,
}: {
  onSubmit: (token: Token) => void;
}) => {
  return (
    <CustomTokenForm onSubmit={onSubmit} getTokenDetails={getTokenDetails} />
  );
};

export { TONCustomTokenForm };
