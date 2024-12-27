import { Command } from "commander";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import {
  MsgCreateMiner,
  txClient,
} from "enreach-client-ts/lib/enreach.miner/module.js";
import { logger } from "../utils/logger.js";
import { mnemonicToAccount } from "viem/accounts";
import { ENV } from "../config/env.js";
import { validateConfig } from "../config/validate.js";

export function registerRegisterCommand(program: Command) {
  program
    .command("register")
    .description("Register miner to enreach chain")
    .option("-n, --name <name>", "name to say hello to")
    .action(async (options) => {
      await validateConfig();

      const mnemonic = ENV.MNEMONIC;
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: "enreach",
      });

      const evmAccount = mnemonicToAccount(mnemonic);

      const client = txClient({
        signer: wallet,
        // addr: 'http://localhost:26657',
        addr: "http://150.109.123.18:26657",
        prefix: "enreach",
      });
      const [account] = await wallet.getAccounts();
      console.log(account);

      // const client = await SigningStargateClient.connectWithSigner('http://localhost:26657', wallet);

      const msg: MsgCreateMiner = {
        creator: account.address,
        minerId: "miner-1",
        evmAddress: evmAccount.address,
        regionCode: "sg",
        status: "active",
      };
      const tx = await client.sendMsgCreateMiner({
        value: msg,
        fee: {
          amount: [],
          gas: "200000",
        },
      });

      logger.info(`Transaction hash: ${tx.transactionHash}`);
      logger.success("Miner registered successfully");
    });
}
