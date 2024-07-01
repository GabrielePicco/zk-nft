import { useWallet } from "@solana/wallet-adapter-react";
import { useUserAssetIds } from "../hooks/useUserAssetIds";
import { ZkNft } from "./ZkNft";
import { Skeleton } from "@/shadcn/components/ui/skeleton";

export const ZkNfts = () => {
  const { publicKey } = useWallet();
  const { data } = useUserAssetIds(publicKey?.toBase58());

  return (
    <div className="pt-4 flex-1 flex flex-col">
      <h1 className="text-4xl mb-2 font-semibold">Your zkNFTs</h1>
      <span className="mb-4 text-gray-500">Newly minted zkNFTs can take up to a few minutes to appear here.</span>
      {data?.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center">
            No zkNFTs found. You can mint some via the mint button above!
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap">
          {!data
            ? Array.from({ length: 3 }).map((_, i) => (
                <div className="w-full sm:w-1/2 lg:w-1/3 p-2" key={i}>
                  <div className="flex flex-col space-y-4">
                    <Skeleton className="h-[256px] rounded-xl" />
                    <div className="space-y-3">
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                    </div>
                  </div>
                </div>
              ))
            : data.map(({ assetId }) => (
                <ZkNft key={assetId} assetId={assetId} />
              ))}
        </div>
      )}
    </div>
  );
};
