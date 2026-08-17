// Product switch: answer review is paused in the operator UI for now.
// Keep evaluation logic available for history/future use, but do not render the visible panel.
export function shouldRenderAnswerReview() {
  return false;
}
