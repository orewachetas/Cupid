export const DEFAULT_FIGMA_PROFILES = [
  {
    id: 'figma-1',
    name: "Maya",
    age: 21,
    gender: "Female",
    major: "Architecture · Year 3",
    distance: "0.4 km away",
    match: 94,
    photoUrl: "https://images.unsplash.com/photo-1612991237712-49b879f27a48?auto=format&fit=crop&w=1100&q=88",
    interests: ["Coffee walks", "Indie films", "Sketching"],
    prompt: "My ideal Sunday",
    answer: "A slow morning, a new coffee spot, and getting lost in the city with no particular plan.",
    bio: "Architecture student who loves sketching buildings, hunting for the best flat white, and listening to indie vinyl."
  },
  {
    id: 'figma-2',
    name: "Zara",
    age: 20,
    gender: "Female",
    major: "Psychology · Year 2",
    distance: "0.8 km away",
    match: 89,
    photoUrl: "https://images.unsplash.com/photo-1594250945179-6ace32113329?auto=format&fit=crop&w=1100&q=88",
    interests: ["Art galleries", "R&B", "Pottery"],
    prompt: "The way to win me over",
    answer: "Recommend a song I haven't heard and remember my coffee order.",
    bio: "Passionate about behavioral psychology, late night art walks, and making clay mugs that are slightly uneven."
  },
  {
    id: 'figma-3',
    name: "Noah",
    age: 22,
    gender: "Male",
    major: "Computer Science · Year 4",
    distance: "1.2 km away",
    match: 86,
    photoUrl: "https://images.unsplash.com/photo-1608145550502-f53571aa63e1?auto=format&fit=crop&w=1100&q=88",
    interests: ["Live music", "Climbing", "Tacos"],
    prompt: "Together we could",
    answer: "Find the best tiny venue in town, then debate the encore all the way home.",
    bio: "Building cool web apps, hitting the climbing gym on Tuesdays, and always down for street tacos."
  },
  {
    id: 'figma-4',
    name: "Amara",
    age: 21,
    gender: "Female",
    major: "Visual Design · Year 3",
    distance: "On campus",
    match: 91,
    photoUrl: "https://images.unsplash.com/photo-1697593177788-003f08a1a3a6?auto=format&fit=crop&w=1100&q=88",
    interests: ["Photography", "Vinyl", "Travel"],
    prompt: "We'll get along if",
    answer: "You like spontaneous train trips and don't mind me taking too many photos.",
    bio: "Visual storyteller with a 35mm film camera glued to my hand. Catch me at the campus library or the station."
  },
];

export const DEFAULT_CONTACTS = [
  {
    id: 'figma-1',
    name: "Maya",
    image: DEFAULT_FIGMA_PROFILES[0].photoUrl,
    preview: "Thursday works perfectly!",
    time: "2m",
    unread: 2,
    online: true,
  },
  {
    id: 'figma-2',
    name: "Zara",
    image: DEFAULT_FIGMA_PROFILES[1].photoUrl,
    preview: "That place looks amazing",
    time: "1h",
    unread: 0,
    online: true,
  },
  {
    id: 'figma-3',
    name: "Noah",
    image: DEFAULT_FIGMA_PROFILES[2].photoUrl,
    preview: "Sent a photo",
    time: "3h",
    unread: 0,
    online: false,
  },
  {
    id: 'figma-4',
    name: "Amara",
    image: DEFAULT_FIGMA_PROFILES[3].photoUrl,
    preview: "Hey! How was your day?",
    time: "Tue",
    unread: 0,
    online: false,
  },
];

export const DEFAULT_STARTER_MESSAGES = {
  'figma-1': [
    { from: "them", text: "Hey! I saw you’re also into tiny coffee shops ☕", time: "10:24" },
    { from: "me", text: "Definitely. The smaller the menu, the better the coffee.", time: "10:26" },
    {
      from: "them",
      text: "Exactly! Have you tried Common Ground by the art building?",
      time: "10:28",
    },
    { from: "me", text: "Not yet, but it’s been on my list. Want to go this week?", time: "10:31" },
    { from: "them", text: "Thursday works perfectly!", time: "10:32" },
  ],
  'figma-2': [
    {
      from: "them",
      text: "That gallery you mentioned looks amazing. When does it close?",
      time: "09:14",
    },
  ],
  'figma-3': [{ from: "them", text: "Found the venue I was telling you about!", time: "Yesterday" }],
  'figma-4': [{ from: "them", text: "Hey! How was your day?", time: "Tue" }],
};

