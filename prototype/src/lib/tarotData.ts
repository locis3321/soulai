import { TarotCard } from "../types";

export const TAROT_DECK: TarotCard[] = [
  // Major Arcana (22 cards)
  {
    id: "the_fool",
    name: "The Fool",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A traveler with a knapsack stepping off a cliff under a bright gold sky with a small white dog",
    imageSymbol: "✨",
    uprightMeaning: "New beginnings, free spirit, spontaneous adventure, faith in the universe, innocent fearlessness.",
    reversedMeaning: "Recklessness, risk-taking, hesitation, holding back, naive decisions, fear of change."
  },
  {
    id: "the_magician",
    name: "The Magician",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "An elegant alchemist standing before a table holding tools representing all four elements of nature",
    imageSymbol: "🪄",
    uprightMeaning: "Willpower, manifestation, resourcefulness, deliberate creation, personal power and skill.",
    reversedMeaning: "Manipulation, illusions, wasted talent, deception, out of touch, untapped potential."
  },
  {
    id: "the_high_priestess",
    name: "The High Priestess",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A mysterious guide sitting between a dark and a light temple pillar holding a scroll of secret wisdom",
    imageSymbol: "🌙",
    uprightMeaning: "Intuition, sacred secrets, subconscious mysteries, divine feminine energy, trusting inner voice.",
    reversedMeaning: "Secret motives, ignored whispers, surface-level focus, hidden blockages, spiritual drought."
  },
  {
    id: "the_empress",
    name: "The Empress",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A motherly figure seated in a fertile garden crowned with stars, surrounded by nature and wheat fields",
    imageSymbol: "🌿",
    uprightMeaning: "Abundance, creativity, maternal nurturing, fertility, raw creation, sensory pleasure.",
    reversedMeaning: "Creative blocks, dependencies, smothering guidance, neglect of self, lack of growth."
  },
  {
    id: "the_emperor",
    name: "The Emperor",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A stern ruler sitting upon a heavy stone throne with carved ram heads under a crimson mountain range",
    imageSymbol: "👑",
    uprightMeaning: "Authority, structure, solid foundation, logical guidance, protective fatherly leadership.",
    reversedMeaning: "Tyranny, lack of control, rigid dogmatisms, rebellion against rules, broken foundations."
  },
  {
    id: "the_hierophant",
    name: "The Hierophant",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A religious figure in red robes sitting between two grey pillars holding a triple cross staff",
    imageSymbol: "⛪",
    uprightMeaning: "Spiritual wisdom, traditional values, conformity, institution, education, belief systems.",
    reversedMeaning: "Rebellion, subversiveness, new approaches, personal beliefs, challenging the status quo."
  },
  {
    id: "the_lovers",
    name: "The Lovers",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "An angel floating above a couple in a glowing landscape representing deep sacred connection and harmony",
    imageSymbol: "💖",
    uprightMeaning: "Sacred alignment, choices, unconditional affection, harmonious relationships, values integration.",
    reversedMeaning: "Inner discord, misalignment of core values, relational tension, poor choices, superficial bonds."
  },
  {
    id: "the_chariot",
    name: "The Chariot",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A determined warrior pulling a carriage guided by two opposing black and white sphinxes in perfect sync",
    imageSymbol: "🛡️",
    uprightMeaning: "Determination, focused willpower, master of opposing forces, control, victorious direction.",
    reversedMeaning: "Loss of control, directionless wandering, aggressive force, lack of self-discipline, blockages."
  },
  {
    id: "strength",
    name: "Strength",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A serene woman gently closing the jaws of a lion with infinite calm and gentle strength",
    imageSymbol: "🦁",
    uprightMeaning: "Inner strength, bravery, compassion, patience, soft control, resilience, self-confidence.",
    reversedMeaning: "Self-doubt, weakness, insecurity, raw emotion, lack of self-discipline, fear."
  },
  {
    id: "the_hermit",
    name: "The Hermit",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A hooded figure holding a glowing lantern standing alone on a snowy mountain peak in deep contemplation",
    imageSymbol: "🏔️",
    uprightMeaning: "Introspection, solitude, inner guidance, wisdom, meditation, seeking truth, withdrawal.",
    reversedMeaning: "Isolation, loneliness, withdrawal, paranoia, being lost, refusing help."
  },
  {
    id: "wheel_of_fortune",
    name: "Wheel of Fortune",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A large golden wheel floating in clouds with mystical symbols and creatures around its rim",
    imageSymbol: "🎡",
    uprightMeaning: "Change, cycles, fate, luck, karma, turning point, destiny, expansion, a wheel turning.",
    reversedMeaning: "Bad luck, resistance to change, breaking cycles, upheaval, unwelcome change."
  },
  {
    id: "justice",
    name: "Justice",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A figure in red robes holding a sword upright in one hand and balanced scales in the other",
    imageSymbol: "⚖️",
    uprightMeaning: "Justice, fairness, truth, cause and effect, law, clarity, accountability, integrity.",
    reversedMeaning: "Unfairness, dishonesty, lack of accountability, dishonesty, corruption, bias."
  },
  {
    id: "the_hanged_man",
    name: "The Hanged Man",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A serene figure suspended upside-down from a living tree with a halo of light around their head",
    imageSymbol: "🔄",
    uprightMeaning: "Surrender, letting go, new perspectives, sacrifice, patience, breaking patterns, pause.",
    reversedMeaning: "Delays, resistance, stalling, needlessly sacrificing, indecision, avoidance."
  },
  {
    id: "death",
    name: "Death",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A dark mystical knight riding a skeletal pale horse under a golden sun setting between tower monuments",
    imageSymbol: "💀",
    uprightMeaning: "Metamorphosis, absolute ending, letting go of the old to welcome the new, major transformation.",
    reversedMeaning: "Fear of change, stagnation, dynamic resistance, dragging out old patterns, slow heavy decay."
  },
  {
    id: "temperance",
    name: "Temperance",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "An angel standing with one foot on land and one in water pouring liquid between two golden cups",
    imageSymbol: "⏳",
    uprightMeaning: "Balance, moderation, patience, purpose, harmony, integration, divine timing, healing.",
    reversedMeaning: "Imbalance, excess, self-healing, realignment, lack of long-term vision, impatience."
  },
  {
    id: "the_devil",
    name: "The Devil",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A winged creature with horns standing over two chained figures in a dark and fiery landscape",
    imageSymbol: "😈",
    uprightMeaning: "Bondage, addiction, materialism, shadow self, powerlessness, fear, restriction.",
    reversedMeaning: "Detachment, breaking free, power reclaimed, exploring dark thoughts, release."
  },
  {
    id: "the_tower",
    name: "The Tower",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A tall stone tower being struck by lightning with flames and people falling from its windows",
    imageSymbol: "🗼",
    uprightMeaning: "Sudden upheaval, broken pride, disaster, revelation, awakening, broken structures.",
    reversedMeaning: "Personal transformation, fear of change, averting disaster, delaying the inevitable."
  },
  {
    id: "the_star",
    name: "The Star",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A young woman pouring water into a sacred stream and the earth beneath a sprawling midnight constellation",
    imageSymbol: "⭐",
    uprightMeaning: "Hope, celestial faith, inner healing, restoration of faith, spiritual light after darkness.",
    reversedMeaning: "Despair, discouragement, feeling lost, loss of faith, isolation, stagnant energy."
  },
  {
    id: "the_moon",
    name: "The Moon",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A golden path winding between two towers under a giant moon, featuring a lobster emerging from a pool",
    imageSymbol: "🌕",
    uprightMeaning: "Illusion, shadow work, intuitive dreams, subconscious patterns, trusting gut feeling in darkness.",
    reversedMeaning: "Secrets exposed, release of profound fears, clearing of illusions, intuitive awakening, peace."
  },
  {
    id: "the_sun",
    name: "The Sun",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A joyful child riding a white horse in front of a blooming brick wall of vibrant sunflowers",
    imageSymbol: "☀️",
    uprightMeaning: "Absolute warmth, joy, success, bright self-expression, clarity, protective positive aura.",
    reversedMeaning: "Temporary cloudiness, hidden joy, over-optimism, delay in plans, slight ego struggles."
  },
  {
    id: "judgement",
    name: "Judgement",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "An angel blowing a trumpet as figures rise from coffins in a scene of resurrection and awakening",
    imageSymbol: "📯",
    uprightMeaning: "Judgement, rebirth, inner calling, absolution, self-evaluation, awakening, second chance.",
    reversedMeaning: "Self-doubt, refusal of self-examination, failure to learn lessons, unforgiving, lost purpose."
  },
  {
    id: "the_world",
    name: "The World",
    isReversed: false,
    category: "Major Arcana",
    imagePrompt: "A dancing cosmic figure encircled by a circular laurel wreath under a purple galaxy starry sky",
    imageSymbol: "🌍",
    uprightMeaning: "Completion, cosmic integration, travel, satisfying closure, fully aligned master of systems.",
    reversedMeaning: "Unfinished cycles, seek shortcut to wisdom, lack of final completion, stagnated goals."
  },

  // Cups (14 cards)
  {
    id: "ace_of_cups",
    name: "Ace of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A hand emerging from a cloud holding a golden chalice overflowing with water and light",
    imageSymbol: "🏆",
    uprightMeaning: "New feelings, emotional awakening, creativity, love, intuition, spiritual beginning.",
    reversedMeaning: "Emotional loss, blocked creativity, emptiness, void, unmet emotional needs."
  },
  {
    id: "two_of_cups",
    name: "Two of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "Two figures exchanging golden cups under a winged lion's head symbolizing partnership",
    imageSymbol: "💕",
    uprightMeaning: "Unified love, partnership, mutual attraction, connection, balance, harmonious relationship.",
    reversedMeaning: "Break-up, imbalance in relationship, tension, disconnection, self-love needed."
  },
  {
    id: "three_of_cups",
    name: "Three of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "Three joyful figures raising their cups in a toast under a bountiful harvest scene",
    imageSymbol: "🥂",
    uprightMeaning: "Celebration, friendship, collaboration, community, joy, creative group energy.",
    reversedMeaning: "Independence, solitude, gossip, overindulgence, isolation from community."
  },
  {
    id: "four_of_cups",
    name: "Four of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A figure sitting under a tree contemplating three cups while a fourth cup is offered by a hand from a cloud",
    imageSymbol: "🤔",
    uprightMeaning: "Meditation, contemplation, apathy, reevaluation, discontent, turning inward.",
    reversedMeaning: "Retreat, withdrawal, checking in with yourself, new motivation, awareness."
  },
  {
    id: "five_of_cups",
    name: "Five of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A cloaked figure lamenting over three spilled cups while two remain standing behind them",
    imageSymbol: "😢",
    uprightMeaning: "Regret, failure, disappointment, pessimism, focusing on the negative, loss.",
    reversedMeaning: "Personal setbacks overcome, self-forgiveness, moving on, learning from past."
  },
  {
    id: "six_of_cups",
    name: "Six of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A child offering a cup filled with flowers to another child in a courtyard setting",
    imageSymbol: "🌸",
    uprightMeaning: "Revisiting the past, childhood memories, innocence, joy, nostalgia, reunion.",
    reversedMeaning: "Living in the past, forgiveness needed, naivety, unrealistic memories."
  },
  {
    id: "seven_of_cups",
    name: "Seven of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A figure standing before seven cups floating in clouds each containing different mystical visions",
    imageSymbol: "💭",
    uprightMeaning: "Fantasy, illusion, wishful thinking, choices, imagination, opportunities.",
    reversedMeaning: "Alignment, personal values, overwhelmed by choices, reality check, focus."
  },
  {
    id: "eight_of_cups",
    name: "Eight of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A cloaked figure walking away from eight stacked cups towards a barren mountain range",
    imageSymbol: "🚶",
    uprightMeaning: "Disappointment, abandonment, withdrawal, escapism, seeking deeper meaning.",
    reversedMeaning: "Trying one more time, indecision, aimless drifting, walking away from success."
  },
  {
    id: "nine_of_cups",
    name: "Nine of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A contented figure sitting with arms crossed before a curved shelf displaying nine golden cups",
    imageSymbol: "😊",
    uprightMeaning: "Contentment, satisfaction, gratitude, wish come true, abundance, emotional fulfillment.",
    reversedMeaning: "Inner happiness, materialism, dissatisfaction, greed, smugness."
  },
  {
    id: "ten_of_cups",
    name: "Ten of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A happy couple with arms raised towards a rainbow of ten cups arching over their family home",
    imageSymbol: "🌈",
    uprightMeaning: "Divine love, blissful relationships, harmony, alignment, happy family, emotional fulfillment.",
    reversedMeaning: "Broken family, disharmony, misaligned values, shattered dreams, disconnection."
  },
  {
    id: "page_of_cups",
    name: "Page of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A youthful figure in blue holding a cup with a fish popping out symbolizing creative messages",
    imageSymbol: "🐟",
    uprightMeaning: "Creative opportunities, intuitive messages, curiosity, possibility, new ideas.",
    reversedMeaning: "Emotional immaturity, insecurity, creative block, new ideas stifled."
  },
  {
    id: "knight_of_cups",
    name: "Knight of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A knight in armor riding a white horse holding a cup as if offering a romantic invitation",
    imageSymbol: "🤴",
    uprightMeaning: "Creativity, romance, charm, imagination, beauty, following the heart, invitation.",
    reversedMeaning: "Overactive imagination, unrealistic, jealousy, moodiness, emotional manipulation."
  },
  {
    id: "queen_of_cups",
    name: "Queen of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A serene queen seated on a throne at the water's edge holding a ornate covered cup",
    imageSymbol: "👸",
    uprightMeaning: "Compassionate, caring, emotionally stable, intuitive, in flow, empathetic, nurturing.",
    reversedMeaning: "Inner feelings, self-care needed, co-dependency, emotional manipulation, insecurity."
  },
  {
    id: "king_of_cups",
    name: "King of Cups",
    isReversed: false,
    category: "Cups",
    imagePrompt: "A king on a throne in the middle of the sea holding a cup and scepter with calm authority",
    imageSymbol: "🤴",
    uprightMeaning: "Emotionally balanced, compassionate, diplomatic, wise, in control of emotions.",
    reversedMeaning: "Self-compassion deficit, inner feelings, moodiness, emotional manipulation."
  },

  // Swords (14 cards)
  {
    id: "ace_of_swords",
    name: "Ace of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A hand emerging from a cloud gripping an upright sword crowned with a wreath of victory",
    imageSymbol: "⚔️",
    uprightMeaning: "Breakthrough, clarity, sharp mind, truth, success, mental clarity, new ideas.",
    reversedMeaning: "Inner clarity needed, re-think idea, confusion, brutality, chaos."
  },
  {
    id: "two_of_swords",
    name: "Two of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A blindfolded woman holding two crossed swords standing at the edge of rocky water",
    imageSymbol: "⚖️",
    uprightMeaning: "Difficult decisions, avoidance, painful choices, stalemate, difficult balance.",
    reversedMeaning: "Indecision, confusion, information overload, no right choice, release."
  },
  {
    id: "three_of_swords",
    name: "Three of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A heart floating in a storm cloud pierced by three swords representing heartbreak",
    imageSymbol: "💔",
    uprightMeaning: "Heartbreak, emotional pain, sorrow, grief, hurt, separation, emotional release.",
    reversedMeaning: "Recovery, forgiveness, releasing pain, optimism, letting go of hurt."
  },
  {
    id: "four_of_swords",
    name: "Four of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A knight lying in repose on a tomb with three swords above and one beneath",
    imageSymbol: "😴",
    uprightMeaning: "Rest, relaxation, meditation, contemplation, recovery, sanctuary, peace.",
    reversedMeaning: "Exhaustion, burn-out, stagnation, need for recovery, mental overload."
  },
  {
    id: "five_of_swords",
    name: "Five of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A figure smirking while holding two swords as two others walk away in defeat",
    imageSymbol: "🗡️",
    uprightMeaning: "Conflict, disagreements, competition, defeat, winning at all costs, hostility.",
    reversedMeaning: "Reconciliation, making amends, past resentment, lingering hostility, forgiveness."
  },
  {
    id: "six_of_swords",
    name: "Six of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A woman and child being ferried across choppy waters towards calmer shores",
    imageSymbol: "⛵",
    uprightMeaning: "Transition, change, rite of passage, releasing baggage, moving on, healing.",
    reversedMeaning: "Personal transition, resistance, unfinished business, stuck in past."
  },
  {
    id: "seven_of_swords",
    name: "Seven of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A figure sneaking away from a camp carrying five swords while two remain planted",
    imageSymbol: "🦊",
    uprightMeaning: "Deception, trickery, tactics, strategy, resourcefulness, cunning, getting away with something.",
    reversedMeaning: "Coming clean, rethinking approach, conscience, deceit discovered, paranoia."
  },
  {
    id: "eight_of_swords",
    name: "Eight of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A blindfolded and bound woman standing in shallow water surrounded by eight swords",
    imageSymbol: "🔒",
    uprightMeaning: "Imprisonment, entrapment, self-victimization, restriction, isolation, powerlessness.",
    reversedMeaning: "Self-acceptance, new perspective, freedom, self-forgiveness, release."
  },
  {
    id: "nine_of_swords",
    name: "Nine of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A figure sitting up in bed with head in hands while nine swords hang on the dark wall",
    imageSymbol: "😰",
    uprightMeaning: "Anxiety, worry, fear, depression, nightmares, negative thinking, overwhelm.",
    reversedMeaning: "Inner turmoil, deep-seated fears, hope emerging, light at end of tunnel."
  },
  {
    id: "ten_of_swords",
    name: "Ten of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A figure lying face down with ten swords in their back under a dark sky with dawn breaking",
    imageSymbol: "⚰️",
    uprightMeaning: "Painful endings, deep wounds, betrayal, loss, crisis, bottoming out, dead end.",
    reversedMeaning: "Recovery, regeneration, resisting an inevitable end, unavoidable change."
  },
  {
    id: "page_of_swords",
    name: "Page of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A youthful figure holding a sword upright with birds flying in a windy landscape",
    imageSymbol: "🦅",
    uprightMeaning: "New ideas, curiosity, thirst for knowledge, new communication, mental energy.",
    reversedMeaning: "Self-expression issues, hurtful words, haste, scattered thoughts, all talk."
  },
  {
    id: "knight_of_swords",
    name: "Knight of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A knight charging forward on a white horse with sword raised in a turbulent sky",
    imageSymbol: "⚔️",
    uprightMeaning: "Ambitious, action-oriented, driven, perfectionist, fast-thinking, competitive.",
    reversedMeaning: "Impulsive, burnout, overly aggressive, self-sabotage, burnout."
  },
  {
    id: "queen_of_swords",
    name: "Queen of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A stern queen sitting on a throne with a sword pointed upward in a cloudy sky",
    imageSymbol: "👸",
    uprightMeaning: "Independent, clear boundaries, direct communication, fair, objective, wisdom.",
    reversedMeaning: "Cold-hearted, cruel, bitterness, overly emotional, manipulative."
  },
  {
    id: "king_of_swords",
    name: "King of Swords",
    isReversed: false,
    category: "Swords",
    imagePrompt: "A king sitting on a throne holding a sword upright with butterflies and clouds",
    imageSymbol: "🤴",
    uprightMeaning: "Mental clarity, intellectual power, authority, truth, ethical, fair judgment.",
    reversedMeaning: "Manipulation, cruelty, abuse of power, coldness, dictatorship."
  },

  // Wands (14 cards)
  {
    id: "ace_of_wands",
    name: "Ace of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A hand emerging from a cloud holding a living wand with fresh green leaves sprouting",
    imageSymbol: "🌱",
    uprightMeaning: "Inspiration, new opportunities, growth, potential, creative spark, enthusiasm.",
    reversedMeaning: "Delays, lack of direction, distractions, weighed down, new idea struggling."
  },
  {
    id: "two_of_wands",
    name: "Two of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A figure holding a globe while standing on castle battlements overlooking a vast landscape",
    imageSymbol: "🌏",
    uprightMeaning: "Future planning, progress, decisions, discovery, personal vision, expansion.",
    reversedMeaning: "Fear of change, playing safe, bad planning, lack of foresight, restriction."
  },
  {
    id: "three_of_wands",
    name: "Three of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A figure on a cliff watching ships sail across the sea with three wands planted nearby",
    imageSymbol: "🚢",
    uprightMeaning: "Progress, expansion, foresight, overseas opportunities, leadership, anticipation.",
    reversedMeaning: "Obstacles, delays, frustration, setbacks, lack of foresight, restriction."
  },
  {
    id: "four_of_wands",
    name: "Four of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "Four wands forming a canopy draped with flowers and garlands in a celebration scene",
    imageSymbol: "🎉",
    uprightMeaning: "Celebration, joy, harmony, relaxation, homecoming, community, stability.",
    reversedMeaning: "Personal celebration, inner harmony, conflict with others, instability."
  },
  {
    id: "five_of_wands",
    name: "Five of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "Five figures each holding a wand in a competitive stance as if in a friendly battle",
    imageSymbol: "⚔️",
    uprightMeaning: "Conflict, disagreements, competition, tension, diversity, clashes, arguments.",
    reversedMeaning: "Avoiding conflict, respecting differences, cooperation, peace after struggle."
  },
  {
    id: "six_of_wands",
    name: "Six of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A victorious figure riding a horse through a crowd with a wand decorated with a laurel wreath",
    imageSymbol: "🏆",
    uprightMeaning: "Success, public recognition, progress, self-confidence, victory, achievement.",
    reversedMeaning: "Private achievement, fall from grace, egotism, broken faith, lack of confidence."
  },
  {
    id: "seven_of_wands",
    name: "Seven of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A figure standing on a hill defending their position with a wand against six others from below",
    imageSymbol: "🛡️",
    uprightMeaning: "Challenge, competition, protection, perseverance, maintaining control, standing ground.",
    reversedMeaning: "Exhaustion, giving up, overwhelmed, defensive, lack of self-belief."
  },
  {
    id: "eight_of_wands",
    name: "Eight of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "Eight wands flying through a clear sky above a river with a house in the distance",
    imageSymbol: "🚀",
    uprightMeaning: "Speed, action, air travel, movement, swift change, excitement, rapid progress.",
    reversedMeaning: "Delays, frustration, waiting, slowing down, pausing to re-evaluate."
  },
  {
    id: "nine_of_wands",
    name: "Nine of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A weary figure leaning on a wand with eight other wands planted behind them in defense",
    imageSymbol: "💪",
    uprightMeaning: "Resilience, grit, last stand, persistence, fatigue, boundaries, courage.",
    reversedMeaning: "Exhaustion, fatigue, paranoia, defensiveness, overextension."
  },
  {
    id: "ten_of_wands",
    name: "Ten of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A figure carrying a heavy burden of ten wands on their back struggling towards a town",
    imageSymbol: "📦",
    uprightMeaning: "Hard work, responsibility, burden, extra stress, obligation, completion near.",
    reversedMeaning: "Releasing burdens, delegating, overwhelm, burnout, overstressing."
  },
  {
    id: "page_of_wands",
    name: "Page of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A youthful figure holding a wand and looking at a salamander in a barren landscape",
    imageSymbol: "🦎",
    uprightMeaning: "Enthusiasm, exploration, discovery, free spirit, adventure, creative spark.",
    reversedMeaning: "Setbacks to new ideas, lack of direction, procrastination, creating conflict."
  },
  {
    id: "knight_of_wands",
    name: "Knight of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A knight riding a rearing horse with a wand raised in a desert landscape with pyramids",
    imageSymbol: "🏇",
    uprightMeaning: "Energy, passion, inspired action, adventure, impulsiveness, daring, charm.",
    reversedMeaning: "Haste, scattered energy, delays in travel, frustration, impulsiveness."
  },
  {
    id: "queen_of_wands",
    name: "Queen of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A confident queen sitting on a throne decorated with lions and sunflowers holding a wand",
    imageSymbol: "👸",
    uprightMeaning: "Courage, confidence, independence, determination, joy, warmth, vitality.",
    reversedMeaning: "Selfishness, jealousy, insecure, demanding, volatile, low confidence."
  },
  {
    id: "king_of_wands",
    name: "King of Wands",
    isReversed: false,
    category: "Wands",
    imagePrompt: "A bold king sitting on a throne decorated with lions and salamanders holding a wand",
    imageSymbol: "🤴",
    uprightMeaning: "Natural-born leader, vision, entrepreneur, honor, bold, inspiring, daring.",
    reversedMeaning: "Impulsive, overbearing, unrealistic expectations, self-serving, tyrant."
  },

  // Pentacles (14 cards)
  {
    id: "ace_of_pentacles",
    name: "Ace of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A hand emerging from a cloud holding a golden pentacle coin with a garden path below",
    imageSymbol: "💰",
    uprightMeaning: "New opportunity, prosperity, abundance, security, stability, new financial beginning.",
    reversedMeaning: "Lost opportunity, lack of planning, lack of foresight, instability."
  },
  {
    id: "two_of_pentacles",
    name: "Two of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A figure juggling two pentacles with an infinity symbol while ships ride waves behind",
    imageSymbol: "⚖️",
    uprightMeaning: "Multiple priorities, time management, prioritization, adaptability, juggling resources.",
    reversedMeaning: "Over-committed, disorganization, financial instability, overwhelmed."
  },
  {
    id: "three_of_pentacles",
    name: "Three of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A craftsman working on a cathedral arch while a monk and architect discuss plans",
    imageSymbol: "🔨",
    uprightMeaning: "Teamwork, collaboration, learning, implementation, skilled work, craftsmanship.",
    reversedMeaning: "Disharmony, misalignment, working alone, lack of skills, lack of collaboration."
  },
  {
    id: "four_of_pentacles",
    name: "Four of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A figure sitting tightly holding a pentacle on their head, feet, and hands",
    imageSymbol: "💎",
    uprightMeaning: "Saving, security, conservatism, scarcity mindset, control, frugality, boundaries.",
    reversedMeaning: "Over-spending, generosity, letting go, investing in experiences, hoarding."
  },
  {
    id: "five_of_pentacles",
    name: "Five of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "Two impoverished figures walking through snow past a church stained-glass window",
    imageSymbol: "❄️",
    uprightMeaning: "Financial loss, poverty, lack mindset, isolation, worry, insecurity, hardship.",
    reversedMeaning: "Recovery from loss, spiritual poverty overcome, help arriving, new perspective."
  },
  {
    id: "six_of_pentacles",
    name: "Six of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A wealthy figure holding balanced scales while distributing coins to two beggars",
    imageSymbol: "⚖️",
    uprightMeaning: "Giving, receiving, sharing wealth, generosity, charity, fairness, community.",
    reversedMeaning: "Strings attached, stinginess, debt, one-sided generosity, selfishness."
  },
  {
    id: "seven_of_pentacles",
    name: "Seven of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A farmer leaning on a hoe contemplating seven pentacles growing on a lush tree",
    imageSymbol: "🌱",
    uprightMeaning: "Long-term view, sustainable results, perseverance, investment, patience, hard work.",
    reversedMeaning: "Lack of long-term vision, limited success, impatience, poor investment."
  },
  {
    id: "eight_of_pentacles",
    name: "Eight of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A craftsman diligently carving pentacles at a workbench with eight coins displayed",
    imageSymbol: "⚒️",
    uprightMeaning: "Apprenticeship, repetitive tasks, mastery, skill development, dedication, expertise.",
    reversedMeaning: "Lack of focus, perfectionism, misdirected activity, no ambition."
  },
  {
    id: "nine_of_pentacles",
    name: "Nine of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A wealthy woman in a vineyard with a falcon on her hand surrounded by nine pentacles",
    imageSymbol: "🦅",
    uprightMeaning: "Abundance, luxury, self-sufficiency, financial independence, gratitude, wealth.",
    reversedMeaning: "Self-worth issues, overinvestment, superficial values, solitude."
  },
  {
    id: "ten_of_pentacles",
    name: "Ten of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "An elder surrounded by family under an archway with ten pentacles arranged in a tree pattern",
    imageSymbol: "👨‍👩‍👧‍👦",
    uprightMeaning: "Wealth, financial security, family, long-term success, legacy, establishment, contribution.",
    reversedMeaning: "Family disputes, financial failure, lack of stability, bankruptcy, isolation."
  },
  {
    id: "page_of_pentacles",
    name: "Page of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A youthful figure studying a pentacle in a field with fresh greenery and mountains",
    imageSymbol: "📖",
    uprightMeaning: "Manifestation, financial opportunity, skill development, ambition, desire, diligence.",
    reversedMeaning: "Lack of progress, procrastination, learn from setbacks, lack of commitment."
  },
  {
    id: "knight_of_pentacles",
    name: "Knight of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A patient knight sitting on a slow heavy horse holding a pentacle in a plowed field",
    imageSymbol: "🐴",
    uprightMeaning: "Hard work, productivity, routine, conservatism, methodical, reliable, responsible.",
    reversedMeaning: "Self-discipline needed, laziness, obsessiveness, work without reward."
  },
  {
    id: "queen_of_pentacles",
    name: "Queen of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A nurturing queen sitting on a throne decorated with flowers and rabbits in a garden",
    imageSymbol: "👸",
    uprightMeaning: "Nurturing, practical, providing, down-to-earth, security, abundance, nature lover.",
    reversedMeaning: "Financial independence threatened, self-care neglected, smothering, jealous."
  },
  {
    id: "king_of_pentacles",
    name: "King of Pentacles",
    isReversed: false,
    category: "Pentacles",
    imagePrompt: "A wealthy king sitting on a throne decorated with bulls and grapes in a lush garden",
    imageSymbol: "🤴",
    uprightMeaning: "Wealth, business, leadership, security, discipline, abundance, luxury, success.",
    reversedMeaning: "Financially inept, obsessive, greedy, materialistic, poor financial decisions."
  }
];
