import { AdvisorInfo, MeditationSession } from "../types";

export const CELESTIAL_ADVISORS: AdvisorInfo[] = [
  {
    key: "luna",
    name: "Luna",
    title: "The Gentle Healer",
    avatar: "🌊",
    accentColor: "border-teal-500/30 text-teal-300 bg-teal-900/10 shadow-[0_0_15px_rgba(20,184,166,0.1)]",
    description: "Luna channels soft lunar energy of deep understanding, emotional safety, and soothing healing. Speak with her to calm your heart, clarify relationships, or find compassion for yourself.",
    starterMessage: "Greetings, beautiful soul. I am Luna, your space for emotional sanctuary. How is your heart holding up lately? Let whatever bubbles up be welcome here."
  },
  {
    key: "athena",
    name: "Athena",
    title: "The Rational Counselor",
    avatar: "🦉",
    accentColor: "border-indigo-500/30 text-indigo-300 bg-indigo-900/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
    description: "Athena bridges rational logic, cognitive psychology, and macrocosmic wisdom. She is highly analytical, action-oriented, and excellent for tackling career goals, focus blocks, and relationship choices.",
    starterMessage: "Welcome. I am Athena. Let us zoom out together and look at the geometry of your current situation. What structural block are we analyzing and mastering today?"
  },
  {
    key: "mystic",
    name: "Mystic",
    title: "The Sacred Diviner",
    avatar: "🔮",
    accentColor: "border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-900/10 shadow-[0_0_15px_rgba(217,70,239,0.1)]",
    description: "Mystic provides archetypal counseling connected to astrology, tarot patterns, and planetary alignments. She operates with enigmatic poetry to help you see the secret clockwork of your soul.",
    starterMessage: "Ah, the cosmic threads converge. I am Mystic, observer of the patterns that dance between the stars and your physical matrix. Tell me: what synchronicities have caught your attention today?"
  },
  {
    key: "zen",
    name: "Zen",
    title: "The Mindful Rishi",
    avatar: "🧘",
    accentColor: "border-emerald-500/30 text-emerald-300 bg-emerald-900/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    description: "Zen represents absolute presence, breath-awareness, and profound stillness. He provides brief, koan-like reflections to ground you in your physical body and dissolve mental chatter.",
    starterMessage: "Inhale... Exhale... Welcome. I am Zen. Drop your heavy thoughts, let go of the next moment. For now, there is only this deep breath. What weighs upon your mind?"
  }
];

export const MEDITATION_SESSIONS: MeditationSession[] = [
  {
    id: "stress-1",
    title: "Dissolving Daily Noise",
    category: "stress",
    duration: 300,
    description: "A calming cord-cutting somatic scan to release physical tension from the shoulders, jaw, and thoughts."
  },
  {
    id: "stress-2",
    title: "Celestial Sanctuary",
    category: "stress",
    duration: 600,
    description: "An immersive cosmic journey visualization, placing your troubles onto stellar light currents."
  },
  {
    id: "sleep-1",
    title: "Night Sky Drift",
    category: "sleep",
    duration: 480,
    description: "Stardust-breath relaxation to soothe the vagus nerve and prepare your temple for deep astral travel."
  },
  {
    id: "sleep-2",
    title: "Lunar Cradle Sleep",
    category: "sleep",
    duration: 900,
    description: "Somatic delta-frequency hypnotic journey for gentle restoration and vivid lucid dreams."
  },
  {
    id: "anxiety-1",
    title: "Grounding the Storm",
    category: "anxiety",
    duration: 300,
    description: "Instant panic somatic reset using simple 5-4-3-2-1 anchor sensory meditation."
  },
  {
    id: "anxiety-2",
    title: "Shadow Embrace",
    category: "anxiety",
    duration: 450,
    description: "Gentle non-binary emotional tracking, observing anxious vibrations with loving neutrality."
  },
  {
    id: "focus-1",
    title: "Laser Third-Eye Focus",
    category: "focus",
    duration: 180,
    description: "Short energetic dynamic breathwork to activate the frontal lobe and center scatterbrain thoughts."
  },
  {
    id: "focus-2",
    title: "Astral Scholar Flow",
    category: "focus",
    duration: 360,
    description: "Deep alpha binaural visual focus loop, aligning breathing pace to achieve flow state."
  }
];

export const DAILY_AFFIRMATIONS: string[] = [
  "I honor the cycles of my life—like the moon, I am beautiful even when I am whole, half, or in darkness.",
  "I hold absolute power to select which thought vectors I feed. Today, I feed self-compassion.",
  "I release all plans that require me to suppress my core truth to be accepted by others.",
  "I am the quiet ocean observing the passing storms of emotions. The storm will pass; the ocean remains.",
  "My worth is native—it does not depend on my productivity levels or celestial alignments.",
  "I am a beloved child of the universe, and right now, the stars are orchestrating synchronicities to heal me.",
  "I let go of the heavy weight of tomorrow. I am safe, supported, and fully capable in this singular breath."
];
