import type { SampleStory } from '../types';

/**
 * Signal — English-language science fiction: an oxygen gauge enforced by a
 * global rule, a technical test, and a secret ending.
 */
export const signal: SampleStory = {
  slug: 'signal',
  author: 'theo',
  meta: {
    tagline: 'Relay station Kepler-9. Three hundred days alone. Then something answers.',
    synopsis:
      'You are the only engineer left aboard Kepler-9, a relay station at the edge of the solar system. Your supply ship is months away, the oxygen recycler is failing, and tonight the long-range array picks up a signal from a region of space where nothing should exist. Decode it, answer it, or ignore it — but keep an eye on your air.',
    genres: ['science-fiction', 'thriller'],
    tags: ['space', 'first contact', 'survival', 'short read'],
    ageRating: '13',
    contentWarnings: ['death', 'fear'],
    access: 'free',
    priceCents: null,
    license: 'cc-by-sa',
  },
  document: {
    title: 'Signal',
    language: 'en',
    start: 'wake',
    variables: [
      {
        id: 'oxygen',
        name: 'Oxygen',
        type: 'number',
        initial: 10,
        min: 0,
        max: 10,
        icon: 'wind',
        description: 'Hours of breathable air.',
      },
      {
        id: 'tech',
        name: 'Tech',
        type: 'number',
        initial: 8,
        min: 0,
        icon: 'cpu',
        description: 'Your engineering skill.',
      },
      { id: 'decoded', name: 'Decoded', type: 'boolean', initial: false, visible: false },
    ],
    items: [
      { id: 'patch', name: 'Seal patch', description: 'Emergency hull sealant.', icon: 'bandage' },
      {
        id: 'logs',
        name: 'Old logs',
        description: 'Your own handwriting. You do not remember writing it.',
        icon: 'file',
      },
    ],
    achievements: [
      {
        id: 'first_contact',
        name: 'First contact',
        description: 'Answer the signal.',
        icon: 'radio',
      },
      {
        id: 'closed_loop',
        name: 'Closed loop',
        description: 'Understand who is calling.',
        icon: 'infinity',
        secret: true,
      },
    ],
    rules: [{ id: 'suffocation', when: 'oxygen <= 0', goto: 'suffocation', once: true }],
    settings: { rewind: 'free', showChoiceStats: true, lockedChoices: 'show' },
    passages: [
      {
        id: 'wake',
        title: 'Alarm',
        checkpoint: true,
        text: `The alarm pulls you out of a dreamless sleep. Red light floods the bunk.

**ANOMALOUS SIGNAL — ARRAY 3.**

You float to the console in your socks. On the screen, a waveform pulses in perfect, patient intervals. Prime numbers. Someone — something — is counting.

Oxygen reserve: **{{oxygen}} hours**. The recycler coughs behind the wall, like it always does.`,
        choices: [
          { id: 'console', text: 'Analyse the signal', to: 'console' },
          { id: 'recycler', text: 'Check the oxygen recycler first', to: 'recycler', once: true },
          { id: 'logs', text: 'Open the station logs', to: 'logs', once: true },
        ],
      },
      {
        id: 'recycler',
        title: 'The recycler',
        onEnter: [{ kind: 'give', item: 'patch', qty: 1 }],
        text: `The recycler's casing is warm to the touch. A hairline crack runs along the intake — you are losing air, slowly.

In the emergency locker you find a **seal patch**. Good for one repair, maybe two if you pray.`,
        choices: [
          {
            id: 'fix',
            text: 'Patch the crack now',
            to: 'wake',
            effects: [
              { kind: 'take', item: 'patch', qty: 1 },
              { kind: 'add', var: 'oxygen', value: '2' },
            ],
          },
          { id: 'later', text: 'Keep the patch for later', to: 'wake' },
        ],
      },
      {
        id: 'logs',
        title: 'Station logs',
        onEnter: [{ kind: 'give', item: 'logs', qty: 1 }],
        text: `The last entries are yours: maintenance, weather reports from the gas giant, a long rant about the coffee.

Then, one you do not remember writing. Dated **tomorrow**.

> *If you are reading this: don't go outside. Answer with the same sequence, reversed. Trust me. — you.*

Your hands are shaking.`,
        choices: [{ id: 'back', text: 'Close the logs', to: 'wake' }],
      },
      {
        id: 'console',
        title: 'The console',
        onEnter: [{ kind: 'add', var: 'oxygen', value: '-1' }],
        text: `The signal is coming from beyond the heliopause, from a point where the star charts show nothing at all. The array is struggling: Array 3's dish is misaligned by half a degree.

To clean the signal, someone would have to go outside and realign the dish by hand. Oxygen: **{{oxygen}} hours**.`,
        choices: [
          { id: 'eva', text: 'Suit up and realign the dish', to: 'eva' },
          {
            id: 'reverse',
            text: 'Send the sequence back, reversed',
            to: 'contact',
            condition: 'has logs',
            lockedHint: 'You have no idea what to send.',
          },
          { id: 'ignore', text: 'Log it as noise and go back to sleep', to: 'silence' },
        ],
      },
      {
        id: 'eva',
        title: 'Outside',
        onEnter: [{ kind: 'add', var: 'oxygen', value: '-3' }],
        text: `Outside, the gas giant fills half the sky, striped and silent. Your breath rattles in the helmet.

The dish's alignment motor is frozen solid. You brace your boots against the truss and grab the torque wrench.

Suit oxygen: **{{oxygen}} hours**.`,
        choices: [
          {
            id: 'align',
            text: 'Force the motor loose',
            test: {
              label: 'Tech check',
              dice: '2d6',
              compare: 'lte',
              target: 'tech',
              success: {
                to: 'decode',
                effects: [{ kind: 'set', var: 'decoded', value: 'true' }],
                text: 'The dish swings into place. The signal sharpens.',
              },
              failure: {
                to: 'leak',
                effects: [{ kind: 'add', var: 'oxygen', value: '-3' }],
                text: 'The wrench slips and tears your glove.',
              },
            },
          },
          { id: 'abort', text: 'Abort and go back inside', to: 'console' },
        ],
      },
      {
        id: 'leak',
        title: 'Leak',
        text: `Air hisses out through your torn glove. Alarms chirp inside the helmet. Oxygen: **{{oxygen}} hours**.

{{#if has patch}}You still have the seal patch.{{else}}You left the only patch inside.{{/if}}`,
        choices: [
          {
            id: 'patch',
            text: 'Slap the patch on the glove',
            to: 'eva',
            condition: 'has patch',
            effects: [{ kind: 'take', item: 'patch', qty: 1 }],
          },
          {
            id: 'inside',
            text: 'Crawl back to the airlock',
            to: 'console',
            effects: [{ kind: 'add', var: 'oxygen', value: '-1' }],
          },
        ],
      },
      {
        id: 'decode',
        title: 'Decoded',
        text: `Back inside, the signal resolves on the screen, line by line. Not numbers anymore. **Words.** In your language.

*Kepler-9. This is Kepler-9. Do you read?*

It's the station's own call sign. Sent from somewhere nothing should exist.

{{#if has logs}}You think of the log entry dated tomorrow, and suddenly you understand.{{/if}}`,
        choices: [
          { id: 'answer', text: 'Answer: "Kepler-9 here. Who is this?"', to: 'contact' },
          {
            id: 'mirror',
            text: 'Answer with the words from your log',
            to: 'mirror',
            condition: 'has logs and decoded',
            locked: 'hide',
          },
        ],
      },
      {
        id: 'contact',
        title: 'First contact',
        ending: { kind: 'victory', title: 'First contact' },
        onEnter: [{ kind: 'unlock', achievement: 'first_contact' }],
        text: `For a long time, nothing. Then the array lights up like a festival.

Images pour in: oceans under two suns, cities shaped like coral, faces that are not faces, all turned toward you. A greeting. An invitation.

When the supply ship finally arrives, months later, the crew finds you at the console, surrounded by a thousand pages of notes, smiling like someone who is no longer alone.`,
      },
      {
        id: 'mirror',
        title: 'Closed loop',
        ending: { kind: 'secret', title: 'Closed loop' },
        onEnter: [{ kind: 'unlock', achievement: 'closed_loop' }],
        text: `You type the words from the log. *Don't go outside. Answer with the same sequence, reversed. Trust me.*

The signal stops. Then, a single line:

*Thank you. Now write the log.*

You pick up the stylus. You know exactly what to write, and to whom. Somewhere, a version of you is waking up to a red alarm, and this time, they will be ready.`,
      },
      {
        id: 'silence',
        title: 'Silence',
        ending: { kind: 'neutral', title: 'Silence' },
        text: `You mark the anomaly as instrument noise and float back to your bunk.

The signal keeps pulsing for three more nights. Then it stops, and never comes back.

Years later, on Earth, you will still wake up at night, counting prime numbers in the dark.`,
      },
      {
        id: 'suffocation',
        title: 'Out of air',
        ending: { kind: 'death', title: 'Out of air' },
        text: `The edges of your vision go grey. The alarms sound very far away now, like music from another room.

On the console, the signal keeps counting, patiently, for someone who will never answer.`,
      },
    ],
  },
};
