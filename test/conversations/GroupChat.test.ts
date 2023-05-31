import { newLocalHostClient, sleep, waitForUserContact } from './../helpers'
import { Client, Conversation, DecodedMessage, GroupChat } from '../../src'

describe('GroupChat', () => {
  let alice: Client
  let bob: Client
  let charlie: Client
  let carol: Client

  beforeEach(async () => {
    alice = await newLocalHostClient({ publishLegacyContact: true })
    bob = await newLocalHostClient({ publishLegacyContact: true })
    charlie = await newLocalHostClient({ publishLegacyContact: true })
    carol = await newLocalHostClient({ publishLegacyContact: true })
    await waitForUserContact(alice, alice)
    await waitForUserContact(bob, bob)
    await waitForUserContact(charlie, charlie)
    await waitForUserContact(carol, carol)
  })

  afterEach(async () => {
    if (alice) await alice.close()
    if (bob) await bob.close()
    if (charlie) await charlie.close()
    if (carol) await carol.close()
  })

  async function conversationFromTopic(
    topic: string,
    client: Client
  ): Promise<Conversation | undefined> {
    const conversations = await client.conversations.list()
    return conversations.find((conversation) => {
      if (conversation.topic === topic) {
        return conversation
      }
    })
  }

  async function messages(
    topic: string,
    client: Client
  ): Promise<DecodedMessage[]> {
    const conversation = await conversationFromTopic(topic, client)

    if (!conversation) {
      throw new Error('no conversation found for topic: ' + topic)
    }

    return await conversation.messages()
  }

  it('can be started', async () => {
    alice.enableGroupChat()
    bob.enableGroupChat()
    charlie.enableGroupChat()

    const aliceConversation = await alice.conversations.newGroupConversation([
      bob.address,
      charlie.address,
    ])

    const aliceGroupChat = await GroupChat.fromConversation(
      alice,
      aliceConversation
    )

    expect(aliceGroupChat.members.length).toBe(3)

    const bobConversations = await bob.conversations.list()
    const charlieConversations = await charlie.conversations.list()

    expect(bobConversations.length).toBe(1)
    expect(charlieConversations.length).toBe(1)
  })

  it('lets people chat', async () => {
    alice.enableGroupChat()
    bob.enableGroupChat()
    charlie.enableGroupChat()

    const aliceConversation = await alice.conversations.newGroupConversation([
      bob.address,
      charlie.address,
    ])

    await aliceConversation.send('hi everyone')

    const bobMessages = await messages(aliceConversation.topic, bob)
    const charlieMessages = await messages(aliceConversation.topic, charlie)

    expect(bobMessages.length).toBe(1)
    expect(bobMessages[0].content).toBe('hi everyone')
    expect(bobMessages[0].senderAddress).toBe(alice.address)

    expect(charlieMessages.length).toBe(1)
    expect(charlieMessages[0].content).toBe('hi everyone')
    expect(charlieMessages[0].senderAddress).toBe(alice.address)

    const charlieConversation = await conversationFromTopic(
      aliceConversation.topic,
      charlie
    )

    await charlieConversation!.send('hi nice to see u all')

    const bobMessages2 = await messages(aliceConversation.topic, bob)
    const aliceMessages = await messages(aliceConversation.topic, alice)

    expect(bobMessages2.length).toBe(2)
    expect(bobMessages2[1].content).toBe('hi nice to see u all')
    expect(bobMessages2[1].senderAddress).toBe(charlie.address)

    expect(aliceMessages.length).toBe(2)
    expect(aliceMessages[1].content).toBe('hi nice to see u all')
    expect(aliceMessages[1].senderAddress).toBe(charlie.address)
  })

  it('can have a title', async () => {
    alice.enableGroupChat()
    bob.enableGroupChat()
    charlie.enableGroupChat()

    const aliceConversation = await alice.conversations.newGroupConversation([
      bob.address,
      charlie.address,
    ])

    const aliceGroupChat = new GroupChat(alice, aliceConversation)
    expect(aliceGroupChat.title).toBe('')

    await aliceGroupChat.changeTitle('the fun group')

    const bobConversation = (await conversationFromTopic(
      aliceConversation.topic,
      bob
    ))!

    const bobGroupChat = await GroupChat.fromConversation(bob, bobConversation)
    expect(bobGroupChat.title).toBe('the fun group')

    const charlieConversation = (await conversationFromTopic(
      aliceConversation.topic,
      charlie
    ))!

    const charlieGroupChat = await GroupChat.fromConversation(
      charlie,
      charlieConversation
    )
    expect(charlieGroupChat.title).toBe('the fun group')
  })

  it('can add members', async () => {
    alice.enableGroupChat()
    bob.enableGroupChat()
    charlie.enableGroupChat()

    const aliceConversation = await alice.conversations.newGroupConversation([
      bob.address,
      charlie.address,
    ])

    const groupChat = await GroupChat.fromConversation(alice, aliceConversation)
    await groupChat.addMember(carol.address)

    const bobConversation = await conversationFromTopic(
      aliceConversation.topic,
      bob
    )

    const bobGroupChat = await GroupChat.fromConversation(bob, bobConversation!)
    await bobGroupChat.rebuild()

    expect(bobGroupChat.members.length).toBe(4)
    expect(bobGroupChat.members[3]).toBe(carol.address)

    await bobConversation!.send('hey carol')

    const carolMessages = await messages(aliceConversation.topic, carol)
    expect(carolMessages[carolMessages.length - 1].content).toBe('hey carol')
  })

  it('can be rebuilt', async () => {
    alice.enableGroupChat()
    bob.enableGroupChat()
    charlie.enableGroupChat()

    const aliceConversation = await alice.conversations.newGroupConversation([
      bob.address,
      charlie.address,
    ])

    const aliceGroupChat = new GroupChat(alice, aliceConversation)
    expect(aliceGroupChat.title).toBe('')

    await aliceGroupChat.addMember(carol.address)
    await aliceGroupChat.changeTitle('the fun group')

    const unbuiltGroupChat = new GroupChat(alice, aliceConversation)
    expect(unbuiltGroupChat.title).toBe('')
    expect(unbuiltGroupChat.members.length).toBe(0)

    await unbuiltGroupChat.rebuild()

    expect(unbuiltGroupChat.title).toBe('the fun group')
    expect(unbuiltGroupChat.members.length).toBe(4)
  })

  it('can be rebuilt partially', async () => {
    alice.enableGroupChat()
    bob.enableGroupChat()
    charlie.enableGroupChat()

    const aliceConversation = await alice.conversations.newGroupConversation([
      bob.address,
      charlie.address,
    ])

    const aliceGroupChat = new GroupChat(alice, aliceConversation)
    expect(aliceGroupChat.title).toBe('')

    await aliceGroupChat.addMember(carol.address)

    await sleep(1000)
    const date = new Date()
    await sleep(1000)

    await aliceGroupChat.changeTitle('the fun group')

    const unbuiltGroupChat = new GroupChat(alice, aliceConversation)
    expect(unbuiltGroupChat.title).toBe('')

    await unbuiltGroupChat.rebuild({ since: date })

    // We should only get the second update because the first one happened before
    // our `since`
    expect(unbuiltGroupChat.title).toBe('the fun group')
    expect(unbuiltGroupChat.members.length).toBe(3)
  })
})