import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { CowNft } from "../target/types/cow_nft";

describe("CowNFT", () => {
  // Configure the client to use the local cluster.
  const testNftTitle = "Beta";
  const testNftSymbol = "BETA";
  const testNftUri = "https://raw.githubusercontent.com/alebuffoli/CowNFT/main/assets/nft-metadata.json";

  const provider = anchor.AnchorProvider.env()
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);

  // ** Un-comment this to use solpg imported IDL **
  // const program = new anchor.Program(
  //   require("../solpg/idl.json"),
  //   new anchor.web3.PublicKey("H2UJjAQTuVJYhaBhh6GD2KaprLBTp1vhP2aaHioya5NM"),
  // );
  // ** Comment this to use solpg imported IDL **
  const program = anchor.workspace.CowNft as anchor.Program<CowNft>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );


  it("Mint!", async () => {

    // Derive the mint address and the associated token account address

    const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const tokenAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: wallet.publicKey
    });
    console.log(`New token: ${mintKeypair.publicKey}`);

    // Derive the metadata and master edition addresses

    const metadataAddress = (await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    ))[0];
    console.log("Metadata initialized");
    const masterEditionAddress = (await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
    ))[0];
    console.log("Master edition metadata initialized");

    // Transact with the "mint" function in our on-chain program

    const additionalComputeBudgetInstruction =
        anchor.web3.ComputeBudgetProgram.requestUnits({
          units: 400000,
          additionalFee: 0,
        });

    await program.methods.mint(
        testNftTitle, testNftSymbol, testNftUri
    )
        .accounts({
          masterEdition: masterEditionAddress,
          metadata: metadataAddress,
          mint: mintKeypair.publicKey,
          tokenAccount: tokenAddress,
          mintAuthority: wallet.publicKey,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([mintKeypair])
        .preInstructions([additionalComputeBudgetInstruction])
        .rpc();
  });
});
