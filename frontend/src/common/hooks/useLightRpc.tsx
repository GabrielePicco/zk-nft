import { createRpc } from "@lightprotocol/stateless.js";
import useSWRImmutable from "swr/immutable";

export const useLightRpc = () => {
  const swr = useSWRImmutable("lightRpc", () =>
    createRpc(
      process.env.NEXT_PUBLIC_RPC_ENDPOINT,
      process.env.NEXT_PUBLIC_ZK_COMPRESSION_ENDPOINT,
      process.env.NEXT_PUBLIC_PROVER_ENDPOINT
    )
  );

  return swr.data;
};
