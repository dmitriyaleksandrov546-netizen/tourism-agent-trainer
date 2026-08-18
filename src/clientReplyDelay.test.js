import { describe, expect, it } from 'vitest';
import { CLIENT_REPLY_IDLE_DELAY_MS, shouldDelayClientReply } from './clientReplyDelay.js';

describe('client reply delay', () => {
  it('waits 5 seconds before neuroclient replies to a normal manager message', () => {
    expect(CLIENT_REPLY_IDLE_DELAY_MS).toBe(5000);
    expect(shouldDelayClientReply({ isSelectionMessage: false })).toBe(true);
  });

  it('does not delay selection analysis messages', () => {
    expect(shouldDelayClientReply({ isSelectionMessage: true })).toBe(false);
  });
});
