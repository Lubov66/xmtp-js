# @xmtp/mls-client

## 0.0.15

### Patch Changes

- b8d9b36:
  - Upgraded to latest MLS node bindings
  - Added `inboxState` to Client

## 0.0.14

### Patch Changes

- 93f0fb9: Upgraded to latest MLS node bindings

## 0.0.13

### Patch Changes

- 4c0340b:
  - Upgraded `@xmtp/proto`
  - Upgraded MLS bindings
  - Added optimistic sending
  - Added `pinnedFrameUrl` metadata to conversations
  - Added `policySet` to conversation permissions

## 0.0.12

### Patch Changes

- 4ec046b:
  - Added conversation descriptions
  - Fixed DB locking issues
  - Fixed invalid policy error
  - Removed Admin status from group creators (Super Admin only)
  - Made content type optional when sending messages

## 0.0.11

### Patch Changes

- c506faf:
  - Upgraded to latest MLS node bindings
  - Added `requestHistorySync` and `getInboxIdByAddress` to `Client`
  - Renamed `get` to `getConversationById` in `Conversations`
  - Added `getMessageById` to `Conversations`

## 0.0.10

### Patch Changes

- b5db898: Upgrade node bindings for bug fixes

## 0.0.9

### Patch Changes

- a419052:
  - Upgrade to latest node bindings
  - Rename addErc1271Signature to addScwSignature
  - Add more options when creating a group with client.conversations.newConversation
  - Add getter and setter for group image URL
  - Add getter for group permissions
  - Add more tests
  - Add GroupPermissions to exports

## 0.0.8

### Patch Changes

- b87672a:
  - Add production environment
  - Allow for all environments when creating a client
  - Remove dependency on `@xmtp/xmtp-js` for content types and their primitives

## 0.0.7

### Patch Changes

- 8a9b624:
  - Add streaming callbacks
  - Add `get` method to `Conversations` for easy access to conversations that are created, listed, or streamed during a client session

## 0.0.6

### Patch Changes

- 6dd6a0e: Add `streamAllMessages` to Conversations

## 0.0.5

### Patch Changes

- ff6c304: Use correct inbox ID for all environments

## 0.0.4

### Patch Changes

- 632e6a3: Add conversation reference to messages

## 0.0.3

### Patch Changes

- 3006d8b: Upgrade MLS node bindings, add admin features

## 0.0.2

### Patch Changes

- ff5fcd7: Fix package.json issues

## 0.0.1

Initial release
