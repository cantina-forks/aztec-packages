import { createCompatibleClient } from '@aztec/aztec.js';
import { type AztecAddress } from '@aztec/circuits.js';
import { FeeJuicePortalManager, prettyPrintJSON } from '@aztec/cli/utils';
import { createEthereumChain, createL1Clients } from '@aztec/ethereum';
import { type DebugLogger, type LogFn } from '@aztec/foundation/log';

export async function bridgeL1FeeJuice(
  amount: bigint,
  recipient: AztecAddress,
  rpcUrl: string,
  l1RpcUrl: string,
  chainId: number,
  privateKey: string | undefined,
  mnemonic: string,
  mint: boolean,
  json: boolean,
  log: LogFn,
  debugLogger: DebugLogger,
) {
  // Prepare L1 client
  const chain = createEthereumChain(l1RpcUrl, chainId);
  const { publicClient, walletClient } = createL1Clients(chain.rpcUrl, privateKey ?? mnemonic, chain.chainInfo);

  // Prepare L2 client
  const client = await createCompatibleClient(rpcUrl, debugLogger);

  // Setup portal manager
  const portal = await FeeJuicePortalManager.new(client, publicClient, walletClient, debugLogger);
  const { claimAmount, claimSecret } = await portal.bridgeTokensPublic(recipient, amount, mint);

  if (json) {
    const out = {
      claimAmount,
      claimSecret,
    };
    log(prettyPrintJSON(out));
  } else {
    if (mint) {
      log(`Minted ${claimAmount} fee juice on L1 and pushed to L2 portal`);
    } else {
      log(`Bridged ${claimAmount} fee juice to L2 portal`);
    }
    log(`claimAmount=${claimAmount},claimSecret=${claimSecret}\n`);
    log(`Note: You need to wait for two L2 blocks before pulling them from the L2 side`);
  }
  return claimSecret;
}
