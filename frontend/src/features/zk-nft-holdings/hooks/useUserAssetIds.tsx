import axios from "axios";
import useSWR from "swr";

export const useUserAssetIds = (publicKey: string | undefined) => {
  const swr = useSWR(
    !publicKey ? null : ["userAssetIds", publicKey],
    ([, publicKey]) =>
      axios
        .get<
          { assetId: string }[]
        >(`${process.env.NEXT_PUBLIC_WORKER_BASE_URL!}/${publicKey}`)
        .then((res) => res.data),
    {
      refreshInterval: 5000,
    }
  );

  return swr;
};
