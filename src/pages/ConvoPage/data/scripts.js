/**
 * Dialogue scripts for the ConvoPage feature.
 *
 * Structure:
 *   SCRIPTS[lang: 'de'|'en'|'es'][topicIndex]
 *
 * Each turn:
 *   { speaker: 'ai', text: string }          — AI line, supports TTS
 *   { speaker: 'user', hint: string }        — User prompt, shown as guidance
 */

export const SCRIPTS = {
  /* ─── German ─────────────────────────────────────────────────────────── */
  de: [
    {
      id: 'de-greetings',
      topic: 'Begrüßungen',
      topicEn: 'Greetings & Introductions',
      emoji: '👋',
      turns: [
        {
          speaker: 'ai',
          text: 'Hallo! Ich bin Nono. Schön, dich kennenzulernen! Wie heißt du?',
        },
        {
          speaker: 'user',
          hint: 'Introduce yourself — e.g. "Hallo Nono! Ich heiße [Name]. Schön, dich auch kennenzulernen!"',
        },
        {
          speaker: 'ai',
          text: 'Wunderbar! Woher kommst du?',
        },
        {
          speaker: 'user',
          hint: 'Say where you are from — e.g. "Ich komme aus [Stadt / Land]."',
        },
        {
          speaker: 'ai',
          text: 'Oh, interessant! Wie lange lernst du schon Deutsch?',
        },
        {
          speaker: 'user',
          hint: 'Say how long you\'ve been learning — e.g. "Ich lerne Deutsch seit drei Monaten."',
        },
        {
          speaker: 'ai',
          text: 'Sehr beeindruckend! Du sprichst wirklich gut. Weiter so!',
        },
      ],
    },
    {
      id: 'de-cafe',
      topic: 'Im Café',
      topicEn: 'Ordering at a Café',
      emoji: '☕',
      turns: [
        {
          speaker: 'ai',
          text: 'Guten Tag! Willkommen in unserem Café. Was darf ich Ihnen bringen?',
        },
        {
          speaker: 'user',
          hint: 'Order a coffee — e.g. "Ich hätte gerne einen Kaffee, bitte."',
        },
        {
          speaker: 'ai',
          text: 'Selbstverständlich! Möchten Sie Milch oder Zucker dazu?',
        },
        {
          speaker: 'user',
          hint: 'Customise your order — e.g. "Mit Milch, bitte. Ohne Zucker."',
        },
        {
          speaker: 'ai',
          text: 'Und möchten Sie etwas essen? Wir haben heute frischen Apfelkuchen.',
        },
        {
          speaker: 'user',
          hint: 'Order some cake — e.g. "Ja, gerne! Ich nehme ein Stück Apfelkuchen."',
        },
        {
          speaker: 'ai',
          text: 'Ausgezeichnete Wahl! Das macht zusammen fünf Euro zwanzig. Herzlichen Dank!',
        },
      ],
    },
    {
      id: 'de-shopping',
      topic: 'Einkaufen',
      topicEn: 'Shopping',
      emoji: '🛍️',
      turns: [
        {
          speaker: 'ai',
          text: 'Guten Tag! Kann ich Ihnen helfen?',
        },
        {
          speaker: 'user',
          hint: 'Ask for help finding an item — e.g. "Ja, ich suche ein Hemd in Größe Medium."',
        },
        {
          speaker: 'ai',
          text: 'Natürlich! Welche Farbe bevorzugen Sie?',
        },
        {
          speaker: 'user',
          hint: 'State a colour preference — e.g. "Ich mag Blau oder Weiß."',
        },
        {
          speaker: 'ai',
          text: 'Hier haben wir ein schönes blaues Hemd. Möchten Sie es anprobieren?',
        },
        {
          speaker: 'user',
          hint: 'Say yes and ask for the fitting room — e.g. "Ja, gerne. Wo ist die Umkleidekabine?"',
        },
        {
          speaker: 'ai',
          text: 'Die Umkleidekabine ist dort drüben, auf der rechten Seite. Viel Spaß!',
        },
      ],
    },
  ],

  /* ─── English ────────────────────────────────────────────────────────── */
  en: [
    {
      id: 'en-introductions',
      topic: 'Introductions',
      topicEn: 'Meeting Someone New',
      emoji: '🤝',
      turns: [
        {
          speaker: 'ai',
          text: 'Hi there! I\'m Alex. Really great to meet you! What\'s your name?',
        },
        {
          speaker: 'user',
          hint: 'Introduce yourself — e.g. "Hi Alex! I\'m [Name]. It\'s great to meet you too!"',
        },
        {
          speaker: 'ai',
          text: 'What a great name! Where are you from originally?',
        },
        {
          speaker: 'user',
          hint: 'Tell them where you\'re from — e.g. "I\'m originally from [Country]. How about you?"',
        },
        {
          speaker: 'ai',
          text: 'I\'m from London! What brings you to learning English today?',
        },
        {
          speaker: 'user',
          hint: 'Explain your motivation — e.g. "I want to improve my English for work and travel."',
        },
        {
          speaker: 'ai',
          text: 'That\'s a fantastic goal! You\'re already doing brilliantly — keep it up!',
        },
      ],
    },
    {
      id: 'en-directions',
      topic: 'Directions',
      topicEn: 'Asking for Directions',
      emoji: '🗺️',
      turns: [
        {
          speaker: 'ai',
          text: 'Excuse me! I\'m a bit lost. Could you help me find the train station?',
        },
        {
          speaker: 'user',
          hint: 'Offer help — e.g. "Of course! Go straight ahead, then turn left at the traffic lights."',
        },
        {
          speaker: 'ai',
          text: 'Oh thank you! Is it far from here? Should I walk or take a bus?',
        },
        {
          speaker: 'user',
          hint: 'Give advice — e.g. "It\'s only about five minutes away. I\'d suggest walking — it\'s a pleasant route."',
        },
        {
          speaker: 'ai',
          text: 'Perfect! One more thing — is there a pharmacy near the station?',
        },
        {
          speaker: 'user',
          hint: 'Describe its location — e.g. "Yes, there\'s one right next to the station entrance on the left."',
        },
        {
          speaker: 'ai',
          text: 'You\'ve been so helpful! Thank you very much. Have a wonderful day!',
        },
      ],
    },
    {
      id: 'en-office',
      topic: 'Office Talk',
      topicEn: 'Office Small Talk',
      emoji: '💼',
      turns: [
        {
          speaker: 'ai',
          text: 'Good morning! How was your weekend? Did you get up to anything fun?',
        },
        {
          speaker: 'user',
          hint: 'Share your weekend and ask back — e.g. "It was great, thanks! I went hiking. How about yours?"',
        },
        {
          speaker: 'ai',
          text: 'Lovely! I visited family. Listen, do you have a few minutes? I\'d like to discuss the project deadline.',
        },
        {
          speaker: 'user',
          hint: 'Agree and invite the topic — e.g. "Of course, I have time now. What\'s on your mind?"',
        },
        {
          speaker: 'ai',
          text: 'The client has moved the deadline to this Friday. Do you think we can manage that?',
        },
        {
          speaker: 'user',
          hint: 'Confirm with a caveat — e.g. "I think so, but we may need to simplify a few features. Let me check with the team."',
        },
        {
          speaker: 'ai',
          text: 'Sounds very sensible. Let\'s sync up this afternoon and align on priorities. Thanks!',
        },
      ],
    },
  ],

  /* ─── Spanish ────────────────────────────────────────────────────────── */
  es: [
    {
      id: 'es-saludos',
      topic: 'Saludos',
      topicEn: 'Greetings & Introductions',
      emoji: '👋',
      turns: [
        {
          speaker: 'ai',
          text: '¡Hola! Soy María. ¡Mucho gusto conocerte! ¿Cómo te llamas?',
        },
        {
          speaker: 'user',
          hint: 'Introduce yourself — e.g. "¡Hola María! Me llamo [Nombre]. ¡Igualmente!"',
        },
        {
          speaker: 'ai',
          text: '¡Qué nombre tan bonito! ¿De dónde eres?',
        },
        {
          speaker: 'user',
          hint: 'Say where you\'re from — e.g. "Soy de [Ciudad / País]. ¿Y tú?"',
        },
        {
          speaker: 'ai',
          text: '¡Soy de Madrid! ¿Cuánto tiempo llevas aprendiendo español?',
        },
        {
          speaker: 'user',
          hint: 'Say how long you\'ve been learning — e.g. "Llevo seis meses aprendiendo español. Me gusta mucho."',
        },
        {
          speaker: 'ai',
          text: '¡Fantástico! Hablas muy bien. ¡Sigue así, que lo estás haciendo genial!',
        },
      ],
    },
    {
      id: 'es-restaurante',
      topic: 'En el Restaurante',
      topicEn: 'At the Restaurant',
      emoji: '🍽️',
      turns: [
        {
          speaker: 'ai',
          text: 'Buenas tardes. Bienvenido al restaurante. ¿Tiene usted reserva?',
        },
        {
          speaker: 'user',
          hint: 'Say you don\'t have a reservation — e.g. "No tengo reserva. ¿Tienen una mesa disponible?"',
        },
        {
          speaker: 'ai',
          text: 'Sí, claro. Sígame, por favor. ¿Está bien esta mesa junto a la ventana?',
        },
        {
          speaker: 'user',
          hint: 'Accept the table — e.g. "Sí, perfecto. Muchas gracias, es una mesa muy bonita."',
        },
        {
          speaker: 'ai',
          text: 'Aquí tiene el menú. ¿Desea algo de beber mientras decide?',
        },
        {
          speaker: 'user',
          hint: 'Order a drink — e.g. "Sí, por favor. Un vaso de agua con gas y un zumo de naranja."',
        },
        {
          speaker: 'ai',
          text: '¡Enseguida! El especial de hoy es la paella valenciana. ¡Se la recomiendo mucho!',
        },
      ],
    },
    {
      id: 'es-mercado',
      topic: 'En el Mercado',
      topicEn: 'At the Market',
      emoji: '🛒',
      turns: [
        {
          speaker: 'ai',
          text: '¡Buenos días! ¿En qué le puedo ayudar hoy?',
        },
        {
          speaker: 'user',
          hint: 'Ask the price of something — e.g. "Buenos días. ¿Cuánto cuestan estas manzanas?"',
        },
        {
          speaker: 'ai',
          text: 'Están a dos euros el kilo. Son muy dulces. ¿Cuántos kilos quiere?',
        },
        {
          speaker: 'user',
          hint: 'Request an amount — e.g. "Póngame dos kilos, por favor."',
        },
        {
          speaker: 'ai',
          text: 'Muy bien. ¿Algo más? Hoy tenemos fresas muy frescas y baratas.',
        },
        {
          speaker: 'user',
          hint: 'Add another item — e.g. "Sí, también quiero un kilo de fresas, por favor."',
        },
        {
          speaker: 'ai',
          text: 'Todo junto son cuatro euros con cincuenta céntimos. ¡Buen provecho y hasta pronto!',
        },
      ],
    },
  ],
};

/** Flat list of all scripts across languages, useful for lookups. */
export const ALL_SCRIPTS = Object.entries(SCRIPTS).flatMap(([lang, topics]) =>
  topics.map((s) => ({ ...s, lang }))
);
