import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZkNft } from "../target/types/zk_nft";
import testnetBlobs from "../scripts/testnet-blobs.json";
import attributes from "../scripts/collection/attributes.json";
import {
  LightSystemProgram,
  NewAddressParams,
  Rpc,
  bn,
  buildAndSignTx,
  createRpc,
  defaultStaticAccountsStruct,
  defaultTestStateTreeAccounts,
  deriveAddress,
  packCompressedAccounts,
  packNewAddressParams,
  rpcRequest,
  sendAndConfirmTx,
} from "@lightprotocol/stateless.js";
import fs from "fs";
import { expect } from "chai";
import { sha256 } from "@noble/hashes/sha256";
import bs58 from "bs58";

const { PublicKey } = anchor.web3;

const keypair = anchor.web3.Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(fs.readFileSync("target/deploy/authority-keypair.json", "utf-8"))
  )
);

const setComputeUnitIx = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
  units: 1_000_000,
});

describe("zk-nft", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ZkNft as Program<ZkNft>;

  const connectionArgs: any =
    provider.connection.rpcEndpoint === "http://localhost:8899"
      ? [undefined, undefined, undefined]
      : [
          "https://zk-testnet.helius.dev:8899", // rpc
          "https://zk-testnet.helius.dev:8784", // zk compression rpc
          "https://zk-testnet.helius.dev:3001", // prover
        ];
  connectionArgs.push({ commitment: "confirmed" });

  const connection: Rpc = createRpc(...connectionArgs);

  let group: anchor.web3.PublicKey;
  it.only("Can create group", async () => {
    const groupKeypair = anchor.web3.Keypair.generate();

    group = groupKeypair.publicKey;

    const ix = await program.methods
      .createGroup(new anchor.BN(0))
      .accounts({
        payer: provider.wallet.publicKey,
        groupAuthority: provider.wallet.publicKey,
        group: groupKeypair.publicKey,
      })
      .instruction();

    const blockhash = await connection.getLatestBlockhash();
    const tx = buildAndSignTx([ix], keypair, blockhash.blockhash, [
      groupKeypair,
    ]);
    const signature = await sendAndConfirmTx(connection, tx, {
      commitment: "confirmed",
    });

    console.log("Your transaction signature", signature);

    const groupData = await program.account.group.fetch(group);
    expect(groupData.size.toNumber()).to.equal(0);
    expect(groupData.maxSize.toNumber()).to.equal(0);
    expect(groupData.authority.toBase58()).to.equal(
      provider.wallet.publicKey.toBase58()
    );
  });

  const baseDataSeed = anchor.web3.Keypair.generate().publicKey.toBytes();
  it("Can create asset with blob and attributes", async () => {
    const addressTree = defaultTestStateTreeAccounts().addressTree;
    const baseDataAddress = await deriveAddress(baseDataSeed, addressTree);

    const assetDataSeed = sha256(
      Buffer.concat([Buffer.from("asset_data"), baseDataAddress.toBuffer()])
    );
    const assetDataAddress = await deriveAddress(assetDataSeed, addressTree);

    const blobSeed = sha256(
      Buffer.concat([Buffer.from("blob"), baseDataAddress.toBuffer()])
    );
    const blobAddress = await deriveAddress(blobSeed, addressTree);

    const attributesSeed = sha256(
      Buffer.concat([Buffer.from("attributes"), baseDataAddress.toBuffer()])
    );
    const attributesAddress = await deriveAddress(attributesSeed, addressTree);

    const proof = await connection.getValidityProof(undefined, [
      bn(baseDataAddress.toBytes()),
      bn(assetDataAddress.toBytes()),
    ]);

    const baseDataOutputCompressedAccounts =
      LightSystemProgram.createNewAddressOutputState(
        Array.from(baseDataAddress.toBytes()),
        program.programId
      );
    const assetDataOutputCompressedAccounts =
      LightSystemProgram.createNewAddressOutputState(
        Array.from(assetDataAddress.toBytes()),
        program.programId
      );
    const blobOutputCompressedAccounts =
      LightSystemProgram.createNewAddressOutputState(
        Array.from(blobAddress.toBytes()),
        program.programId
      );
    const attributesOutputCompressedAccounts =
      LightSystemProgram.createNewAddressOutputState(
        Array.from(attributesAddress.toBytes()),
        program.programId
      );

    const outputCompressedAccounts = [
      ...assetDataOutputCompressedAccounts,
      ...baseDataOutputCompressedAccounts,
      ...blobOutputCompressedAccounts,
      ...attributesOutputCompressedAccounts,
    ];
    const baseDataAddressParams = {
      seed: baseDataSeed,
      addressMerkleTreeRootIndex:
        proof.rootIndices[proof.rootIndices.length - 1],
      addressMerkleTreePubkey: proof.merkleTrees[proof.merkleTrees.length - 1],
      addressQueuePubkey:
        proof.nullifierQueues[proof.nullifierQueues.length - 1],
    };

    const { remainingAccounts: _remainingAccounts } = packCompressedAccounts(
      [],
      proof.rootIndices,
      outputCompressedAccounts,
      undefined
    );

    const { newAddressParamsPacked, remainingAccounts } = packNewAddressParams(
      [baseDataAddressParams],
      _remainingAccounts
    );

    const {
      accountCompressionAuthority,
      noopProgram,
      registeredProgramPda,
      accountCompressionProgram,
    } = defaultStaticAccountsStruct();

    const blobProof = await connection.getValidityProof(undefined, [
      bn(blobAddress.toBytes()),
    ]);
    const attributesProof = await connection.getValidityProof(undefined, [
      bn(attributesAddress.toBytes()),
    ]);

    const metadataIndex = getRandomArrayIndex(testnetBlobs);
    const attribute = attributes[metadataIndex];
    const txSig = Array.from(bs58.decode(testnetBlobs[metadataIndex]));
    const recipient = provider.wallet.publicKey;
    const ix = await program.methods
      .createAsset(
        proof.compressedProof,
        Array.from(baseDataSeed),
        {
          addressMerkleTreeAccountIndex:
            newAddressParamsPacked[0].addressMerkleTreeAccountIndex,
          addressQueueAccountIndex:
            newAddressParamsPacked[0].addressQueueAccountIndex,
          addressMerkleTreeRootIndex:
            newAddressParamsPacked[0].addressMerkleTreeRootIndex,
        },
        {
          data: {
            contentType: "application/json",
            txSig,
          },
          proof: blobProof.compressedProof,
        },
        {
          data: attribute.map((attribute) => ({
            traitType: attribute.trait_type,
            value: attribute.value,
          })),
          proof: attributesProof.compressedProof,
        }
      )
      .accounts({
        payer: provider.wallet.publicKey,
        groupAuthority: provider.wallet.publicKey,
        authority: provider.wallet.publicKey,
        recipient,
        group,
        cpiAuthorityPda: PublicKey.findProgramAddressSync(
          [Buffer.from("cpi_authority")],
          program.programId
        )[0],
        selfProgram: program.programId,
        lightSystemProgram: LightSystemProgram.programId,
        accountCompressionAuthority,
        noopProgram,
        registeredProgramPda,
        accountCompressionProgram,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .remainingAccounts(
        remainingAccounts.map((account) => ({
          pubkey: account,
          isSigner: false,
          isWritable: true,
        }))
      )
      .instruction();

    const blockhash = await connection.getLatestBlockhash();
    const tx = buildAndSignTx(
      [setComputeUnitIx, ix],
      keypair,
      blockhash.blockhash,
      []
    );
    const signature = await sendAndConfirmTx(connection, tx, {
      commitment: "confirmed",
    });

    console.log("Your transaction signature", signature);
    console.log("blobAddress:", blobAddress.toBase58());
    console.log("attributesAddress:", attributesAddress.toBase58());

    const groupData = await program.account.group.fetch(group);
    expect(groupData.size.toNumber()).to.equal(1);
  });

  it("Can transfer asset", async () => {
    const addressTree = defaultTestStateTreeAccounts().addressTree;
    const baseDataAddress = await deriveAddress(baseDataSeed, addressTree);
    const unsafeRes = await rpcRequest(
      connection.compressionApiEndpoint,
      "getCompressedAccount",
      {
        address: baseDataAddress.toBase58(),
      }
    );
    const baseDataHash = bn(
      new PublicKey(unsafeRes.result.value.hash).toBytes()
    );
    const proof = await connection.getValidityProof([baseDataHash]);
    const baseDataOutputCompressedAccounts =
      LightSystemProgram.createNewAddressOutputState(
        Array.from(baseDataAddress.toBytes()),
        program.programId
      );
    const baseDataAddressParams: NewAddressParams = {
      seed: baseDataSeed,
      addressMerkleTreeRootIndex:
        proof.rootIndices[proof.rootIndices.length - 1],
      addressMerkleTreePubkey: proof.merkleTrees[proof.merkleTrees.length - 1],
      addressQueuePubkey:
        proof.nullifierQueues[proof.nullifierQueues.length - 1],
    };
    const {
      remainingAccounts: _remainingAccounts,
      packedInputCompressedAccounts,
    } = packCompressedAccounts(
      [
        {
          address: Array.from(baseDataAddress.toBytes()),
          data: null,
          owner: program.programId,
          lamports: new anchor.BN(0),
          hash: null,
          leafIndex: unsafeRes.result.value.leafIndex,
          merkleTree: new PublicKey(unsafeRes.result.value.tree),
          nullifierQueue:
            proof.nullifierQueues[proof.nullifierQueues.length - 1],
        },
      ],
      proof.rootIndices,
      baseDataOutputCompressedAccounts
    );

    const { newAddressParamsPacked, remainingAccounts } = packNewAddressParams(
      [baseDataAddressParams],
      _remainingAccounts
    );

    const {
      accountCompressionAuthority,
      noopProgram,
      registeredProgramPda,
      accountCompressionProgram,
    } = defaultStaticAccountsStruct();

    const baseData = await program.coder.types.decode(
      "BaseData",
      Buffer.from(unsafeRes.result.value.data.data, "base64")
    );

    const recipient = new anchor.web3.PublicKey(
      "A8AxAQW69i65FGfpGAHiH1FmjXe4P8mxjegt4fP9CwBw"
    );
    const ix = await program.methods
      .transfer(
        proof.compressedProof,
        Array.from(baseDataAddress.toBytes()),
        baseData,
        {
          merkleContext: packedInputCompressedAccounts[0].merkleContext,
          rootIndex: packedInputCompressedAccounts[0].rootIndex,
        }
      )
      .accounts({
        payer: provider.wallet.publicKey,
        authority: provider.wallet.publicKey,
        recipient,
        cpiAuthorityPda: PublicKey.findProgramAddressSync(
          [Buffer.from("cpi_authority")],
          program.programId
        )[0],
        selfProgram: program.programId,
        lightSystemProgram: LightSystemProgram.programId,
        accountCompressionAuthority,
        noopProgram,
        registeredProgramPda,
        accountCompressionProgram,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .remainingAccounts(
        remainingAccounts.map((account) => ({
          pubkey: account,
          isSigner: false,
          isWritable: true,
        }))
      )
      .instruction();

    const blockhash = await connection.getLatestBlockhash();
    const tx = buildAndSignTx(
      [setComputeUnitIx, ix],
      keypair,
      blockhash.blockhash,
      []
    );
    const signature = await sendAndConfirmTx(connection, tx, {
      commitment: "confirmed",
    });

    console.log("Your transaction signature", signature);

    const updatedUnsafeRes = await rpcRequest(
      connection.compressionApiEndpoint,
      "getCompressedAccount",
      {
        address: baseDataAddress.toBase58(),
      }
    );
    const updatedBaseData = await program.coder.types.decode(
      "BaseData",
      Buffer.from(updatedUnsafeRes.result.value.data.data, "base64")
    );

    console.log(updatedBaseData);
    console.log(baseDataAddress.toBase58());
    expect(updatedBaseData.owner.toBase58()).to.equal(recipient.toBase58());
  });

  it.skip("Can create blob", async () => {
    const addressTree = defaultTestStateTreeAccounts().addressTree;
    const baseDataAddress = await deriveAddress(baseDataSeed, addressTree);

    const assetDataSeed = sha256(
      Buffer.concat([Buffer.from("asset_data"), baseDataAddress.toBuffer()])
    );
    const assetDataAddress = await deriveAddress(assetDataSeed, addressTree);
    const blobSeed = sha256(
      Buffer.concat([Buffer.from("blob"), baseDataAddress.toBuffer()])
    );
    const blobAddress = await deriveAddress(blobSeed, addressTree);

    const unsafeRes = await rpcRequest(
      connection.compressionApiEndpoint,
      "getCompressedAccount",
      {
        address: assetDataAddress.toBase58(),
      }
    );
    const assetDataHash = bn(
      new PublicKey(unsafeRes.result.value.hash).toBytes()
    );

    const proof = await connection.getValidityProof(
      [assetDataHash],
      [bn(blobAddress.toBytes())]
    );

    const blobOutputCompressedAccounts =
      LightSystemProgram.createNewAddressOutputState(
        Array.from(blobAddress.toBytes()),
        program.programId
      );
    const assetDataOutputCompressedAccounts =
      LightSystemProgram.createNewAddressOutputState(
        Array.from(assetDataAddress.toBytes()),
        program.programId
      );
    const outputCompressedAccounts = [
      ...blobOutputCompressedAccounts,
      ...assetDataOutputCompressedAccounts,
    ];
    const blobAddressParams: NewAddressParams = {
      seed: blobSeed,
      addressMerkleTreeRootIndex:
        proof.rootIndices[proof.rootIndices.length - 1],
      addressMerkleTreePubkey: proof.merkleTrees[proof.merkleTrees.length - 1],
      addressQueuePubkey:
        proof.nullifierQueues[proof.nullifierQueues.length - 1],
    };

    const {
      remainingAccounts: _remainingAccounts,
      packedInputCompressedAccounts,
    } = packCompressedAccounts(
      [
        {
          address: Array.from(assetDataAddress.toBytes()),
          data: null,
          owner: program.programId,
          lamports: new anchor.BN(0),
          hash: Array.from(
            new PublicKey(unsafeRes.result.value.hash).toBytes()
          ),
          leafIndex: unsafeRes.result.value.leafIndex,
          merkleTree: new PublicKey(unsafeRes.result.value.tree),
          nullifierQueue: proof.nullifierQueues[0],
        },
      ],
      proof.rootIndices,
      outputCompressedAccounts
    );
    const { newAddressParamsPacked, remainingAccounts } = packNewAddressParams(
      [blobAddressParams],
      _remainingAccounts
    );

    const {
      accountCompressionAuthority,
      noopProgram,
      registeredProgramPda,
      accountCompressionProgram,
    } = defaultStaticAccountsStruct();

    // const ix = await program.methods
    //   .createBlob(
    //     Array.from(baseDataAddress.toBytes()),
    //     {
    //       mutable: true,
    //       group,
    //       authority: provider.wallet.publicKey,
    //       hasAttributes: false,
    //       hasBlob: false,
    //     },
    //     {
    //       data: Buffer.from("Lorem ipsum"),
    //       contentType: "text/plain",
    //     },
    //     proof.compressedProof,
    //     {
    //       merkleContext: packedInputCompressedAccounts[0].merkleContext,
    //       rootIndex: packedInputCompressedAccounts[0].rootIndex,
    //     },
    //     {
    //       addressMerkleTreeAccountIndex:
    //         newAddressParamsPacked[0].addressMerkleTreeAccountIndex,
    //       addressQueueAccountIndex:
    //         newAddressParamsPacked[0].addressQueueAccountIndex,
    //       addressMerkleTreeRootIndex:
    //         newAddressParamsPacked[0].addressMerkleTreeRootIndex,
    //     }
    //   )
    //   .accounts({
    //     payer: provider.wallet.publicKey,
    //     authority: provider.wallet.publicKey,
    //     cpiAuthorityPda: PublicKey.findProgramAddressSync(
    //       [Buffer.from("cpi_authority")],
    //       program.programId
    //     )[0],
    //     selfProgram: program.programId,
    //     lightSystemProgram: LightSystemProgram.programId,
    //     accountCompressionAuthority,
    //     noopProgram,
    //     registeredProgramPda,
    //     accountCompressionProgram,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //   })
    //   .remainingAccounts(
    //     remainingAccounts.map((account) => ({
    //       pubkey: account,
    //       isSigner: false,
    //       isWritable: true,
    //     }))
    //   )
    //   .instruction();

    // const blockhash = await connection.getLatestBlockhash();
    // const tx = buildAndSignTx(
    //   [setComputeUnitIx, ix],
    //   keypair,
    //   blockhash.blockhash,
    //   []
    // );
    // const signature = await sendAndConfirmTx(connection, tx, {
    //   commitment: "confirmed",
    // });

    // console.log("Your transaction signature", signature);
  });
});

function getRandomArrayIndex<T>(array: T[]): number {
  const randomIndex = Math.floor(Math.random() * array.length);
  return randomIndex;
}
