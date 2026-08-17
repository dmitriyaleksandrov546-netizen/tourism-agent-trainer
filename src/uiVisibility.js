// Product switches: paused UI panels stay easy to restore without deleting business logic.
export function shouldRenderAnswerReview() {
  return false;
}

export function shouldRenderDailySourceControl() {
  return false;
}
