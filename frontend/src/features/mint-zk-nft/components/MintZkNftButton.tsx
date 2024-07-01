import { Button } from "@/shadcn/components/ui/button";
import { useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Loader2 } from "lucide-react";
import axios, { isAxiosError } from "axios";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { toast } from "sonner";

interface MintZkNftButtonProps {
  isHcaptchaLoading: boolean;
  setIsHcaptchaLoading: (isHcaptchaLoading: boolean) => void;
}

export const MintZkNftButton = ({
  isHcaptchaLoading,
  setIsHcaptchaLoading,
}: MintZkNftButtonProps) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isMinting, setIsMinting] = useState(false);
  const [customButtonText, setCustomButtonText] = useState<string | null>(null);
  const isLoading = isHcaptchaLoading || isMinting;
  const captchaRef = useRef<HCaptcha | null>(null);
  const onClick = async () => {
    if (!captchaRef.current) {
      return;
    }
    setIsMinting(true);

    try {
      await captchaRef.current.execute({
        async: true,
      });
    } catch {
      setIsMinting(false);
    }
  };

  return (
    <>
      <Button
        size="lg"
        className="text-lg font-bold"
        disabled={isLoading}
        onClick={onClick}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {customButtonText ?? (!isMinting ? "Mint your zkNFT" : "Minting...")}
      </Button>
      <div className="invisible">
        <HCaptcha
          sitekey="a7342826-a2ca-495a-9e92-bb8284a282e4"
          onLoad={() => {
            setIsHcaptchaLoading(false);
          }}
          onVerify={async (token) => {
            try {
              const { data } = await axios.post<{
                base64EncodedTx: string;
                blockhash: string;
                lastValidBlockHeight: number;
              }>("https://mint-vfpktw6ouq-uc.a.run.app", {
                token,
                recipient: publicKey?.toBase58(),
              });

              const txSig = await connection.sendTransaction(
                VersionedTransaction.deserialize(
                  Buffer.from(data.base64EncodedTx, "base64")
                )
              );
              await connection.confirmTransaction({
                blockhash: data.blockhash,
                lastValidBlockHeight: data.lastValidBlockHeight,
                signature: txSig,
              });

              setCustomButtonText("Mint success!");
              setTimeout(() => {
                setCustomButtonText(null);
              }, 3000);
            } catch (e) {
              if (isAxiosError(e)) {
                toast.error(e.response?.data.message);
              } else if (e instanceof Error) {
                toast.error(e.message);
              }
            } finally {
              setIsMinting(false);
            }
          }}
          ref={captchaRef}
        />
      </div>
    </>
  );
};
