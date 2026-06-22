import { isSectionVisible } from './sectionVisibility';

/** Resolve scratch vs countdown independently for the blush save-the-date block. */
export function resolveSaveTheDateFlags(saveTheDate, visibility) {
  const sectionOn = isSectionVisible('saveTheDate', saveTheDate, visibility);
  if (!sectionOn) {
    return {
      sectionOn: false,
      scratchOn: false,
      countdownOn: false,
      useScratchGate: false,
    };
  }

  const scratchOn = saveTheDate?.scratchEnabled !== false;
  const countdownOn = saveTheDate?.countdownEnabled !== false;

  return {
    sectionOn: true,
    scratchOn,
    countdownOn,
    /** Story / RSVP stay hidden until scratch completes when scratch is on. */
    useScratchGate: scratchOn,
  };
}
