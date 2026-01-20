import { Helmet } from "react-helmet";
import InvestorPitchDeck from "@/components/investors/InvestorPitchDeck";

const Investors = () => {
  return (
    <>
      <Helmet>
        <title>Investors | Elyphant - AI-Powered Gifting Platform</title>
        <meta 
          name="description" 
          content="Discover how Elyphant is revolutionizing the $250B gifting market with AI-powered automation and smart wishlists." 
        />
      </Helmet>
      <InvestorPitchDeck />
    </>
  );
};

export default Investors;
