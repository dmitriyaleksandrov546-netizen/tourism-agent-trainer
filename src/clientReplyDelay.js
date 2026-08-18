export const CLIENT_REPLY_IDLE_DELAY_MS = 5000;

export function shouldDelayClientReply({ isSelectionMessage = false } = {}) {
  return !isSelectionMessage;
}
