import { ContentTypeText } from '@xmtp/content-type-text'
import { describe, expect, it } from 'vitest'
import { createRegisteredClient, createUser } from '@test/helpers'

describe('Conversations', () => {
  it('should not have initial conversations', async () => {
    const user = createUser()
    const client = await createRegisteredClient(user)
    const conversations = client.conversations.list()
    expect((await conversations).length).toBe(0)
  })

  it('should create a new conversation', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const conversation = await client1.conversations.newConversation([
      user2.account.address,
    ])
    expect(conversation).toBeDefined()
    expect(client1.conversations.get(conversation.id)?.id).toBe(conversation.id)
    expect(conversation.id).toBeDefined()
    expect(conversation.createdAt).toBeDefined()
    expect(conversation.createdAtNs).toBeDefined()
    expect(conversation.isActive).toBe(true)
    expect(conversation.name).toBe('')
    expect(conversation.addedByInboxId).toBe(client1.inboxId)
    expect(conversation.messages().length).toBe(1)
    expect(conversation.members.length).toBe(2)
    const memberInboxIds = conversation.members.map((member) => member.inboxId)
    expect(memberInboxIds).toContain(client1.inboxId)
    expect(memberInboxIds).toContain(client2.inboxId)
    expect(conversation.metadata).toEqual({
      conversationType: 'group',
      creatorInboxId: client1.inboxId,
    })

    const conversations1 = await client1.conversations.list()
    expect(conversations1.length).toBe(1)
    expect(conversations1[0].id).toBe(conversation.id)

    expect((await client2.conversations.list()).length).toBe(0)

    await client2.conversations.sync()

    const conversations2 = await client2.conversations.list()
    expect(conversations2.length).toBe(1)
    expect(conversations2[0].id).toBe(conversation.id)
  })

  it('should stream new conversations', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const user3 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const client3 = await createRegisteredClient(user3)
    const stream = client3.conversations.stream()
    const conversation1 = await client1.conversations.newConversation([
      user3.account.address,
    ])
    const conversation2 = await client2.conversations.newConversation([
      user3.account.address,
    ])
    let count = 0
    for await (const convo of stream) {
      count++
      expect(convo).toBeDefined()
      if (count === 1) {
        expect(convo!.id).toBe(conversation1.id)
      }
      if (count === 2) {
        expect(convo!.id).toBe(conversation2.id)
        break
      }
    }
    stream.stop()
    expect(client3.conversations.get(conversation1.id)?.id).toBe(
      conversation1.id
    )
    expect(client3.conversations.get(conversation2.id)?.id).toBe(
      conversation2.id
    )
  })

  it('should stream all messages', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const user3 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const client3 = await createRegisteredClient(user3)
    await client1.conversations.newConversation([user2.account.address])
    await client1.conversations.newConversation([user3.account.address])

    const stream = await client1.conversations.streamAllMessages()

    await client2.conversations.sync()
    const groups2 = await client2.conversations.list()

    await client3.conversations.sync()
    const groups3 = await client3.conversations.list()

    await groups2[0].send('gm!', ContentTypeText)
    await groups3[0].send('gm2!', ContentTypeText)

    let count = 0

    for await (const message of stream) {
      count++
      expect(message).toBeDefined()
      if (count === 1) {
        expect(message!.senderInboxId).toBe(client2.inboxId)
      }
      if (count === 2) {
        expect(message!.senderInboxId).toBe(client3.inboxId)
        break
      }
    }
    stream.stop()
  })
})
