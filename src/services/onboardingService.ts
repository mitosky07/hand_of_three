const KEY = "hand-of-three-tutorial-complete";

export const onboardingService = {
  isComplete() { return localStorage.getItem(KEY) === "1"; },
  complete() { localStorage.setItem(KEY, "1"); },
};
