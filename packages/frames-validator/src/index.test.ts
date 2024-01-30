import { FramesClient } from "@xmtp/frames-client"
import { fetcher, frames } from "@xmtp/proto"
import { Client, PrivateKeyBundleV2 } from "@xmtp/xmtp-js"
import { Wallet } from "ethers"
import { beforeEach, describe, expect, it } from "vitest"

import { deserializeProtoMessage, validateFramesPost } from "."

const { b64Decode, b64Encode } = fetcher

function scrambleBytes(bytes: Uint8Array) {
  const scrambled = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    scrambled[i] = bytes[bytes.length - i - 1]
  }
  return scrambled
}

describe("validations", () => {
  let client: Client
  let framesClient: FramesClient

  const FRAME_URL = "https://frame.xyz"
  const CONVERSATION_IDENTIFIER = "/xmtp/0/1234"
  const MESSAGE_ID = "abcdefg"
  const BUTTON_INDEX = 2

  beforeEach(async () => {
    const wallet = Wallet.createRandom()
    client = await Client.create(wallet)
    framesClient = new FramesClient(client)
  })
  it("succeeds in the happy path", async () => {
    const postData = await framesClient.signFrameAction(
      FRAME_URL,
      BUTTON_INDEX,
      CONVERSATION_IDENTIFIER,
      MESSAGE_ID,
    )
    const validated = await validateFramesPost(postData)
    expect(validated.verifiedWalletAddress).toEqual(client.address)
  })

  it("fails if the signature verification fails", async () => {
    const postData = await framesClient.signFrameAction(
      FRAME_URL,
      BUTTON_INDEX,
      CONVERSATION_IDENTIFIER,
      MESSAGE_ID,
    )
    // Monkey around with the signature
    const deserialized = deserializeProtoMessage(
      b64Decode(postData.trustedData.messageBytes),
    )

    if (!deserialized.signature?.ecdsaCompact?.bytes) {
      throw new Error("Signature bytes are empty")
    }

    deserialized.signature.ecdsaCompact.bytes = scrambleBytes(
      deserialized.signature.ecdsaCompact?.bytes,
    )
    const reserialized = frames.FrameAction.encode({
      signature: deserialized.signature,
      actionBody: deserialized.actionBodyBytes,
      signedPublicKeyBundle: deserialized.signedPublicKeyBundle,
    }).finish()

    postData.trustedData.messageBytes = b64Encode(
      reserialized,
      0,
      reserialized.length,
    )

    expect(validateFramesPost(postData)).rejects.toThrow()
  })

  it("fails if the wallet address doesn't match", async () => {
    const postData = await framesClient.signFrameAction(
      FRAME_URL,
      BUTTON_INDEX,
      CONVERSATION_IDENTIFIER,
      MESSAGE_ID,
    )
    // Monkey around with the signature
    const deserialized = deserializeProtoMessage(
      b64Decode(postData.trustedData.messageBytes),
    )

    if (!deserialized.signedPublicKeyBundle) {
      throw new Error("Public key bunlde is empty")
    }

    const throwAwayWallet = Wallet.createRandom()
    const wrongPublicKeyBundle = (
      await PrivateKeyBundleV2.generate(throwAwayWallet)
    ).getPublicKeyBundle()

    const reserialized = frames.FrameAction.encode({
      signature: deserialized.signature,
      actionBody: deserialized.actionBodyBytes,
      signedPublicKeyBundle: wrongPublicKeyBundle,
    }).finish()

    postData.trustedData.messageBytes = b64Encode(
      reserialized,
      0,
      reserialized.length,
    )

    expect(validateFramesPost(postData)).rejects.toThrow()
  })
})
