import { useLightRpc } from "@/common/hooks/useLightRpc";
import {
  defaultTestStateTreeAccounts,
  deriveAddress,
  rpcRequest,
} from "@lightprotocol/stateless.js";
import { sha256 } from "@noble/hashes/sha256";
import { PublicKey } from "@solana/web3.js";
import useSWR from "swr";
import { BorshCoder } from "@coral-xyz/anchor";
import { ZkNft, idl } from "@zk-nft/program";
import bs58 from "bs58";

export const useAsset = (assetId: string | undefined) => {
  const compressionApiEndpoint = useLightRpc()?.compressionApiEndpoint;

  const swr = useSWR(
    !assetId || !compressionApiEndpoint
      ? null
      : ["asset", compressionApiEndpoint, assetId],
    async ([, compressionApiEndpoint, assetId]) => {
      const blobSeed = sha256(
        Buffer.concat([Buffer.from("blob"), new PublicKey(assetId).toBuffer()])
      );
      const addressTree = defaultTestStateTreeAccounts().addressTree;
      const blobAddress = await deriveAddress(blobSeed, addressTree);

      const blobData: { data: { data: string } | null } = await rpcRequest(
        compressionApiEndpoint,
        "getCompressedAccount",
        {
          address: blobAddress.toBase58(),
        }
      ).then((res) => res.result.value);

      if (!blobData?.data) {
        return null;
      }

      const data = Buffer.from(blobData.data.data, "base64");
      const borshCoder = new BorshCoder(idl as unknown as ZkNft);
      const blob = borshCoder.types.decode("Blob", data);

      const asset = {
        assetId,
        blob: {
          contentType: blob.contentType,
          txSig: bs58.encode(Uint8Array.from(blob.txSig)),
        },
      };

      return asset;
    }
  );

  return swr;
};
