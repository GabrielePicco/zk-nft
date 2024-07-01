import { DialogsContext } from "@/features/dialogs/providers/DialogsProvider";
import { Button } from "@/shadcn/components/ui/button";
import { useContext, useState } from "react";
import { Loader2 } from "lucide-react";
import { useZkNftProgram } from "@/common/hooks/useZkNftProgram";
import { useLightRpc } from "@/common/hooks/useLightRpc";
import {
  LightSystemProgram,
  NewAddressParams,
  bn,
  buildTx,
  defaultStaticAccountsStruct,
  packCompressedAccounts,
  packNewAddressParams,
  rpcRequest,
} from "@lightprotocol/stateless.js";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export const TransferButton = ({ assetId }: { assetId: string }) => {
  const { getRecipientPublicKey } = useContext(DialogsContext);
  const [loading, setLoading] = useState(false);
  const zkNftProgram = useZkNftProgram();
  const lightRpc = useLightRpc();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  return (
    <Button
      disabled={loading}
      variant="outline"
      className="w-full"
      onClick={async () => {
        if (!zkNftProgram || !lightRpc || !publicKey || !signTransaction) {
          return;
        }

        const recipientPublicKey = await getRecipientPublicKey();
        if (!recipientPublicKey) {
          return;
        }

        try {
          setLoading(true);

          const baseDataAddress = new PublicKey(assetId);
          const unsafeRes = await rpcRequest(
            lightRpc.compressionApiEndpoint,
            "getCompressedAccount",
            {
              address: baseDataAddress.toBase58(),
            }
          );
          const baseDataHash = bn(
            new PublicKey(unsafeRes.result.value.hash).toBytes()
          );
          const proof = await lightRpc.getValidityProof([baseDataHash]);
          const baseDataOutputCompressedAccounts =
            LightSystemProgram.createNewAddressOutputState(
              Array.from(baseDataAddress.toBytes()),
              zkNftProgram.programId
            );
          const baseDataAddressParams: NewAddressParams = {
            seed: Uint8Array.from([]), // we do not need to actually pass in the seed here
            addressMerkleTreeRootIndex:
              proof.rootIndices[proof.rootIndices.length - 1]!,
            addressMerkleTreePubkey:
              proof.merkleTrees[proof.merkleTrees.length - 1]!,
            addressQueuePubkey:
              proof.nullifierQueues[proof.nullifierQueues.length - 1]!,
          };
          const {
            remainingAccounts: _remainingAccounts,
            packedInputCompressedAccounts,
          } = packCompressedAccounts(
            [
              {
                address: Array.from(baseDataAddress.toBytes()),
                data: null,
                owner: zkNftProgram.programId,
                lamports: new BN(0),
                hash: [], // we do not need to actually pass in the hash here
                leafIndex: unsafeRes.result.value.leafIndex,
                merkleTree: new PublicKey(unsafeRes.result.value.tree),
                nullifierQueue:
                  proof.nullifierQueues[proof.nullifierQueues.length - 1]!,
              },
            ],
            proof.rootIndices,
            baseDataOutputCompressedAccounts
          );

          const { remainingAccounts } = packNewAddressParams(
            [baseDataAddressParams],
            _remainingAccounts
          );

          const {
            accountCompressionAuthority,
            noopProgram,
            registeredProgramPda,
            accountCompressionProgram,
          } = defaultStaticAccountsStruct();

          const baseData = await zkNftProgram.coder.types.decode(
            "BaseData",
            Buffer.from(unsafeRes.result.value.data.data, "base64")
          );

          const recipient = new PublicKey(recipientPublicKey);
          const ix = await zkNftProgram.methods
            .transfer(
              proof.compressedProof,
              Array.from(baseDataAddress.toBytes()),
              baseData,
              {
                merkleContext: packedInputCompressedAccounts[0]!.merkleContext,
                rootIndex: packedInputCompressedAccounts[0]!.rootIndex,
              }
            )
            .accounts({
              payer: publicKey,
              authority: publicKey,
              recipient,
              cpiAuthorityPda: PublicKey.findProgramAddressSync(
                [Buffer.from("cpi_authority")],
                zkNftProgram.programId
              )[0],
              selfProgram: zkNftProgram.programId,
              lightSystemProgram: LightSystemProgram.programId,
              accountCompressionAuthority,
              noopProgram,
              registeredProgramPda,
              accountCompressionProgram,
              systemProgram: SystemProgram.programId,
            })
            .remainingAccounts(
              remainingAccounts.map((account) => ({
                pubkey: account,
                isSigner: false,
                isWritable: true,
              }))
            )
            .instruction();

          const blockhash = await lightRpc.getLatestBlockhash();
          const tx = buildTx(
            [ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }), ix],
            publicKey,
            blockhash.blockhash
          );
          const signedTx = await signTransaction(tx);
          const txSig = await connection.sendTransaction(signedTx);
          await connection.confirmTransaction({
            blockhash: blockhash.blockhash,
            lastValidBlockHeight: blockhash.lastValidBlockHeight,
            signature: txSig,
          });

          setLoading(false);

          toast.success("Transfer successful!");
        } catch (error) {
          if (error instanceof Error) {
            toast.error(error.message);
          }
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading ? "Transfer" : "Sending..."}
    </Button>
  );
};
