import React, { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
  LineChart, Line, AreaChart, Area
} from 'recharts';

// Time period options
const TIME_OPTIONS = [
  { value: '7day', label: 'Last 7 Days' },
  { value: '30day', label: 'Last 30 Days' },
  { value: '90day', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' }
];

// ============== ENTITY EXTRACTION LOGIC ==============

// Enhanced personality database with full names and aliases
const PERSONALITY_DATABASE = [
  // Politics - US (with full names and variations)
  { names: ['donald trump', 'trump', 'president trump'], display: 'Donald Trump', category: 'Politics' },
  { names: ['joe biden', 'biden', 'president biden'], display: 'Joe Biden', category: 'Politics' },
  { names: ['barack obama', 'obama'], display: 'Barack Obama', category: 'Politics' },
  { names: ['kamala harris', 'kamala', 'harris', 'vp harris'], display: 'Kamala Harris', category: 'Politics' },
  { names: ['ron desantis', 'desantis', 'governor desantis'], display: 'Ron DeSantis', category: 'Politics' },
  { names: ['mike pence', 'pence'], display: 'Mike Pence', category: 'Politics' },
  { names: ['nancy pelosi', 'pelosi'], display: 'Nancy Pelosi', category: 'Politics' },
  { names: ['mitch mcconnell', 'mcconnell'], display: 'Mitch McConnell', category: 'Politics' },
  { names: ['alexandria ocasio-cortez', 'ocasio-cortez', 'aoc'], display: 'AOC', category: 'Politics' },
  { names: ['bernie sanders', 'bernie', 'sanders'], display: 'Bernie Sanders', category: 'Politics' },
  { names: ['elizabeth warren', 'warren'], display: 'Elizabeth Warren', category: 'Politics' },
  { names: ['ted cruz', 'cruz'], display: 'Ted Cruz', category: 'Politics' },
  { names: ['marco rubio', 'rubio'], display: 'Marco Rubio', category: 'Politics' },
  { names: ['gavin newsom', 'newsom'], display: 'Gavin Newsom', category: 'Politics' },
  { names: ['greg abbott', 'abbott'], display: 'Greg Abbott', category: 'Politics' },
  { names: ['vivek ramaswamy', 'vivek', 'ramaswamy'], display: 'Vivek Ramaswamy', category: 'Politics' },
  { names: ['nikki haley', 'haley'], display: 'Nikki Haley', category: 'Politics' },
  { names: ['jd vance', 'vance'], display: 'JD Vance', category: 'Politics' },
  { names: ['marjorie taylor greene', 'mtg', 'greene'], display: 'Marjorie Taylor Greene', category: 'Politics' },
  { names: ['matt gaetz', 'gaetz'], display: 'Matt Gaetz', category: 'Politics' },
  { names: ['kevin mccarthy', 'mccarthy'], display: 'Kevin McCarthy', category: 'Politics' },
  { names: ['mike johnson', 'speaker johnson'], display: 'Mike Johnson', category: 'Politics' },

  // Politics - International
  { names: ['vladimir putin', 'putin'], display: 'Vladimir Putin', category: 'Politics' },
  { names: ['volodymyr zelensky', 'zelensky', 'zelenskyy'], display: 'Volodymyr Zelensky', category: 'Politics' },
  { names: ['xi jinping', 'xi', 'jinping'], display: 'Xi Jinping', category: 'Politics' },
  { names: ['justin trudeau', 'trudeau'], display: 'Justin Trudeau', category: 'Politics' },
  { names: ['benjamin netanyahu', 'netanyahu', 'bibi'], display: 'Benjamin Netanyahu', category: 'Politics' },
  { names: ['narendra modi', 'modi'], display: 'Narendra Modi', category: 'Politics' },
  { names: ['emmanuel macron', 'macron'], display: 'Emmanuel Macron', category: 'Politics' },
  { names: ['kim jong un', 'kim jong-un', 'kim jong'], display: 'Kim Jong Un', category: 'Politics' },
  { names: ['jair bolsonaro', 'bolsonaro'], display: 'Jair Bolsonaro', category: 'Politics' },
  { names: ['rishi sunak', 'sunak'], display: 'Rishi Sunak', category: 'Politics' },
  { names: ['keir starmer', 'starmer'], display: 'Keir Starmer', category: 'Politics' },
  { names: ['giorgia meloni', 'meloni'], display: 'Giorgia Meloni', category: 'Politics' },

  // Tech Billionaires
  { names: ['elon musk', 'elon', 'musk'], display: 'Elon Musk', category: 'Tech' },
  { names: ['mark zuckerberg', 'zuckerberg', 'zuck'], display: 'Mark Zuckerberg', category: 'Tech' },
  { names: ['jeff bezos', 'bezos'], display: 'Jeff Bezos', category: 'Tech' },
  { names: ['tim cook', 'cook'], display: 'Tim Cook', category: 'Tech' },
  { names: ['bill gates', 'gates'], display: 'Bill Gates', category: 'Tech' },
  { names: ['sam altman', 'altman'], display: 'Sam Altman', category: 'Tech' },
  { names: ['satya nadella', 'nadella'], display: 'Satya Nadella', category: 'Tech' },
  { names: ['sundar pichai', 'pichai'], display: 'Sundar Pichai', category: 'Tech' },
  { names: ['jack dorsey', 'dorsey'], display: 'Jack Dorsey', category: 'Tech' },
  { names: ['jensen huang', 'huang'], display: 'Jensen Huang', category: 'Tech' },

  // Music Artists
  { names: ['taylor swift', 'swift', 'taylor'], display: 'Taylor Swift', category: 'Music' },
  { names: ['beyonce', 'beyoncé', 'queen bey'], display: 'Beyoncé', category: 'Music' },
  { names: ['kanye west', 'kanye', 'ye', 'yeezy'], display: 'Kanye West', category: 'Music' },
  { names: ['drake', 'drizzy', 'aubrey graham'], display: 'Drake', category: 'Music' },
  { names: ['rihanna', 'riri', 'fenty'], display: 'Rihanna', category: 'Music' },
  { names: ['justin bieber', 'bieber'], display: 'Justin Bieber', category: 'Music' },
  { names: ['selena gomez', 'selena'], display: 'Selena Gomez', category: 'Music' },
  { names: ['doja cat', 'doja'], display: 'Doja Cat', category: 'Music' },
  { names: ['bad bunny', 'benito'], display: 'Bad Bunny', category: 'Music' },
  { names: ['harry styles', 'harry'], display: 'Harry Styles', category: 'Music' },
  { names: ['ariana grande', 'ariana'], display: 'Ariana Grande', category: 'Music' },
  { names: ['billie eilish', 'billie'], display: 'Billie Eilish', category: 'Music' },
  { names: ['lizzo', 'lizzo'], display: 'Lizzo', category: 'Music' },
  { names: ['dua lipa', 'dua'], display: 'Dua Lipa', category: 'Music' },
  { names: ['miley cyrus', 'miley'], display: 'Miley Cyrus', category: 'Music' },
  { names: ['the weeknd', 'weeknd', 'abel tesfaye'], display: 'The Weeknd', category: 'Music' },
  { names: ['post malone', 'posty'], display: 'Post Malone', category: 'Music' },
  { names: ['cardi b', 'cardi'], display: 'Cardi B', category: 'Music' },
  { names: ['nicki minaj', 'nicki'], display: 'Nicki Minaj', category: 'Music' },
  { names: ['travis scott', 'travis'], display: 'Travis Scott', category: 'Music' },

  // Actors/Actresses
  { names: ['zendaya', 'zendaya coleman'], display: 'Zendaya', category: 'Entertainment' },
  { names: ['timothee chalamet', 'timothée chalamet', 'chalamet', 'timothee'], display: 'Timothée Chalamet', category: 'Entertainment' },
  { names: ['margot robbie', 'margot'], display: 'Margot Robbie', category: 'Entertainment' },
  { names: ['ryan gosling', 'gosling'], display: 'Ryan Gosling', category: 'Entertainment' },
  { names: ['leonardo dicaprio', 'leo dicaprio', 'dicaprio', 'leo'], display: 'Leonardo DiCaprio', category: 'Entertainment' },
  { names: ['tom hanks', 'hanks'], display: 'Tom Hanks', category: 'Entertainment' },
  { names: ['meryl streep', 'streep'], display: 'Meryl Streep', category: 'Entertainment' },
  { names: ['jennifer lawrence', 'j-law'], display: 'Jennifer Lawrence', category: 'Entertainment' },
  { names: ['chris hemsworth', 'hemsworth'], display: 'Chris Hemsworth', category: 'Entertainment' },
  { names: ['scarlett johansson', 'scarjo', 'scarlett'], display: 'Scarlett Johansson', category: 'Entertainment' },
  { names: ['keanu reeves', 'keanu'], display: 'Keanu Reeves', category: 'Entertainment' },
  { names: ['dwayne johnson', 'the rock', 'rock'], display: 'Dwayne Johnson', category: 'Entertainment' },
  { names: ['vin diesel', 'diesel'], display: 'Vin Diesel', category: 'Entertainment' },
  { names: ['jason momoa', 'momoa'], display: 'Jason Momoa', category: 'Entertainment' },
  { names: ['jennifer aniston', 'aniston'], display: 'Jennifer Aniston', category: 'Entertainment' },
  { names: ['brad pitt', 'pitt'], display: 'Brad Pitt', category: 'Entertainment' },
  { names: ['angelina jolie', 'jolie', 'angelina'], display: 'Angelina Jolie', category: 'Entertainment' },
  { names: ['johnny depp', 'depp'], display: 'Johnny Depp', category: 'Entertainment' },
  { names: ['amber heard', 'heard'], display: 'Amber Heard', category: 'Entertainment' },
  { names: ['tom cruise', 'cruise'], display: 'Tom Cruise', category: 'Entertainment' },
  { names: ['robert downey jr', 'rdj', 'downey'], display: 'Robert Downey Jr.', category: 'Entertainment' },
  { names: ['chris evans', 'evans'], display: 'Chris Evans', category: 'Entertainment' },
  { names: ['chris pratt', 'pratt'], display: 'Chris Pratt', category: 'Entertainment' },
  { names: ['ryan reynolds', 'reynolds'], display: 'Ryan Reynolds', category: 'Entertainment' },
  { names: ['blake lively', 'lively'], display: 'Blake Lively', category: 'Entertainment' },
  { names: ['sydney sweeney', 'sweeney'], display: 'Sydney Sweeney', category: 'Entertainment' },
  { names: ['florence pugh', 'pugh'], display: 'Florence Pugh', category: 'Entertainment' },
  { names: ['anya taylor-joy', 'anya taylor joy', 'anya'], display: 'Anya Taylor-Joy', category: 'Entertainment' },
  { names: ['pedro pascal', 'pascal'], display: 'Pedro Pascal', category: 'Entertainment' },

  // Reality TV / Kardashians
  { names: ['kim kardashian', 'kim k', 'kim'], display: 'Kim Kardashian', category: 'Entertainment' },
  { names: ['kylie jenner', 'kylie'], display: 'Kylie Jenner', category: 'Entertainment' },
  { names: ['kendall jenner', 'kendall'], display: 'Kendall Jenner', category: 'Entertainment' },
  { names: ['khloe kardashian', 'khloe'], display: 'Khloé Kardashian', category: 'Entertainment' },
  { names: ['kourtney kardashian', 'kourtney'], display: 'Kourtney Kardashian', category: 'Entertainment' },
  { names: ['kris jenner', 'kris'], display: 'Kris Jenner', category: 'Entertainment' },
  { names: ['travis barker', 'barker'], display: 'Travis Barker', category: 'Entertainment' },

  // Sports
  { names: ['lebron james', 'lebron', 'king james'], display: 'LeBron James', category: 'Sports' },
  { names: ['michael jordan', 'mj', 'jordan'], display: 'Michael Jordan', category: 'Sports' },
  { names: ['tom brady', 'brady'], display: 'Tom Brady', category: 'Sports' },
  { names: ['patrick mahomes', 'mahomes'], display: 'Patrick Mahomes', category: 'Sports' },
  { names: ['stephen curry', 'steph curry', 'curry'], display: 'Stephen Curry', category: 'Sports' },
  { names: ['lionel messi', 'messi', 'leo messi'], display: 'Lionel Messi', category: 'Sports' },
  { names: ['cristiano ronaldo', 'ronaldo', 'cr7'], display: 'Cristiano Ronaldo', category: 'Sports' },
  { names: ['neymar', 'neymar jr'], display: 'Neymar', category: 'Sports' },
  { names: ['novak djokovic', 'djokovic'], display: 'Novak Djokovic', category: 'Sports' },
  { names: ['rafael nadal', 'nadal', 'rafa'], display: 'Rafael Nadal', category: 'Sports' },
  { names: ['roger federer', 'federer'], display: 'Roger Federer', category: 'Sports' },
  { names: ['serena williams', 'serena'], display: 'Serena Williams', category: 'Sports' },
  { names: ['tiger woods', 'tiger'], display: 'Tiger Woods', category: 'Sports' },
  { names: ['rory mcilroy', 'mcilroy'], display: 'Rory McIlroy', category: 'Sports' },
  { names: ['aaron rodgers', 'rodgers'], display: 'Aaron Rodgers', category: 'Sports' },
  { names: ['lamar jackson', 'jackson'], display: 'Lamar Jackson', category: 'Sports' },
  { names: ['travis kelce', 'kelce'], display: 'Travis Kelce', category: 'Sports' },
  { names: ['shohei ohtani', 'ohtani'], display: 'Shohei Ohtani', category: 'Sports' },
  { names: ['conor mcgregor', 'mcgregor'], display: 'Conor McGregor', category: 'Sports' },

  // Royalty
  { names: ['prince harry', 'harry', 'duke of sussex'], display: 'Prince Harry', category: 'Royalty' },
  { names: ['meghan markle', 'meghan', 'duchess of sussex', 'markle'], display: 'Meghan Markle', category: 'Royalty' },
  { names: ['kate middleton', 'kate', 'princess kate', 'princess of wales', 'catherine'], display: 'Kate Middleton', category: 'Royalty' },
  { names: ['prince william', 'william', 'prince of wales'], display: 'Prince William', category: 'Royalty' },
  { names: ['king charles', 'charles iii', 'king charles iii'], display: 'King Charles', category: 'Royalty' },
  { names: ['queen elizabeth', 'elizabeth ii', 'the queen'], display: 'Queen Elizabeth', category: 'Royalty' },
  { names: ['princess diana', 'diana'], display: 'Princess Diana', category: 'Royalty' },

  // Media/Influencers/Podcasters
  { names: ['joe rogan', 'rogan'], display: 'Joe Rogan', category: 'Media' },
  { names: ['tucker carlson', 'tucker', 'carlson'], display: 'Tucker Carlson', category: 'Media' },
  { names: ['sean hannity', 'hannity'], display: 'Sean Hannity', category: 'Media' },
  { names: ['rachel maddow', 'maddow'], display: 'Rachel Maddow', category: 'Media' },
  { names: ['oprah winfrey', 'oprah'], display: 'Oprah Winfrey', category: 'Media' },
  { names: ['ellen degeneres', 'ellen'], display: 'Ellen DeGeneres', category: 'Media' },
  { names: ['logan paul', 'logan'], display: 'Logan Paul', category: 'Media' },
  { names: ['jake paul', 'jake'], display: 'Jake Paul', category: 'Media' },
  { names: ['mr beast', 'mrbeast', 'jimmy donaldson'], display: 'MrBeast', category: 'Media' },
  { names: ['pewdiepie', 'pewds', 'felix kjellberg'], display: 'PewDiePie', category: 'Media' },
  { names: ['alex jones'], display: 'Alex Jones', category: 'Media' },
  { names: ['howard stern', 'stern'], display: 'Howard Stern', category: 'Media' },
  { names: ['anderson cooper', 'cooper'], display: 'Anderson Cooper', category: 'Media' },

  // Business/Finance
  { names: ['warren buffett', 'buffett'], display: 'Warren Buffett', category: 'Business' },
  { names: ['larry fink', 'fink'], display: 'Larry Fink', category: 'Business' },
  { names: ['jamie dimon', 'dimon'], display: 'Jamie Dimon', category: 'Business' },
  { names: ['bob iger', 'iger'], display: 'Bob Iger', category: 'Business' },

  // Authors/Activists
  { names: ['jk rowling', 'j.k. rowling', 'rowling'], display: 'J.K. Rowling', category: 'Entertainment' },
  { names: ['stephen king', 'king'], display: 'Stephen King', category: 'Entertainment' },
  { names: ['greta thunberg', 'greta', 'thunberg'], display: 'Greta Thunberg', category: 'Activism' },
];

// Build a flat list for backward compatibility and faster lookup
const KNOWN_PERSONALITIES = PERSONALITY_DATABASE.flatMap(p => p.names);

// Event/trend keywords and patterns
const EVENT_PATTERNS = [
  // Crime/Legal
  { pattern: /shooting|shooter|gunman|massacre/i, category: 'Crime', label: 'Shooting' },
  { pattern: /murder|killed|homicide|slain/i, category: 'Crime', label: 'Murder/Homicide' },
  { pattern: /arrest|arrested|charged|indicted|trial|verdict|sentenced/i, category: 'Legal', label: 'Legal/Arrest' },
  { pattern: /scandal|controversy|accused|allegations/i, category: 'Scandal', label: 'Scandal/Controversy' },
  // Immigration
  { pattern: /ice\s+(raid|shooting|arrest|deport)|immigration|deportation|border|migrant/i, category: 'Immigration', label: 'Immigration' },
  // Geopolitics
  { pattern: /greenland|arctic|territory|annex/i, category: 'Geopolitics', label: 'Territorial' },
  { pattern: /ukraine|russia|invasion|war\s+in/i, category: 'Conflict', label: 'Ukraine/Russia' },
  { pattern: /china|taiwan|south\s+china\s+sea/i, category: 'Geopolitics', label: 'China/Taiwan' },
  { pattern: /israel|gaza|hamas|palestinian/i, category: 'Conflict', label: 'Israel/Gaza' },
  { pattern: /north\s+korea|kim\s+jong|missile\s+test/i, category: 'Geopolitics', label: 'North Korea' },
  // Politics
  { pattern: /election|campaign|poll|vote|ballot/i, category: 'Politics', label: 'Election' },
  { pattern: /impeach|resign|step\s+down/i, category: 'Politics', label: 'Impeachment/Resignation' },
  // Economy
  { pattern: /recession|inflation|interest\s+rate|fed\s+rate|stock\s+market|crash/i, category: 'Economy', label: 'Economic' },
  { pattern: /layoff|fired|job\s+cuts|downsiz/i, category: 'Economy', label: 'Layoffs' },
  // Health
  { pattern: /covid|pandemic|virus|outbreak|vaccine/i, category: 'Health', label: 'Health Crisis' },
  // Disasters
  { pattern: /earthquake|hurricane|tornado|flood|wildfire|disaster/i, category: 'Disaster', label: 'Natural Disaster' },
  { pattern: /plane\s+crash|derail|explosion|collapse/i, category: 'Disaster', label: 'Accident/Disaster' },
  // Entertainment
  { pattern: /divorce|split|breakup|dating|engaged|married|wedding/i, category: 'Celebrity', label: 'Relationship' },
  { pattern: /pregnant|baby|birth|child/i, category: 'Celebrity', label: 'Baby/Pregnancy' },
  { pattern: /died|death|passed\s+away|rip|funeral|tribute/i, category: 'Death', label: 'Death/Tribute' },
  { pattern: /oscars?|grammy|emmy|award|nomination/i, category: 'Entertainment', label: 'Awards' },
  { pattern: /super\s+bowl|world\s+cup|olympics|championship/i, category: 'Sports', label: 'Major Sports Event' },
  // Tech
  { pattern: /ai\s+|artificial\s+intelligence|chatgpt|openai/i, category: 'Tech', label: 'AI' },
  { pattern: /hack|breach|leak|cyber/i, category: 'Tech', label: 'Cybersecurity' },
  { pattern: /launch|release|announce|unveil/i, category: 'Tech', label: 'Product Launch' },
];

// Subject line format patterns
const SUBJECT_FORMAT_PATTERNS = [
  { pattern: /^\d+\s+(ways?|things?|reasons?|tips?|secrets?|facts?|signs?)/i, format: 'Numbered List', example: '10 Things...' },
  { pattern: /^(top|best|worst)\s+\d+/i, format: 'Top X List', example: 'Top 5...' },
  { pattern: /\?$/i, format: 'Question', example: 'Ends with ?' },
  { pattern: /^(how\s+to|here'?s?\s+how|the\s+way\s+to)/i, format: 'How-To', example: 'How to...' },
  { pattern: /^(breaking|just\s+in|urgent|alert)/i, format: 'Breaking News', example: 'BREAKING:' },
  { pattern: /^(exclusive|revealed|exposed|leaked|inside)/i, format: 'Exclusive/Reveal', example: 'EXCLUSIVE:' },
  { pattern: /(you\s+won'?t\s+believe|shocking|unbelievable|jaw-?dropping)/i, format: 'Shock/Surprise', example: 'Shocking...' },
  { pattern: /(finally|at\s+last|it'?s?\s+official)/i, format: 'Resolution', example: 'Finally...' },
  { pattern: /^(why|what|who|when|where|which)/i, format: 'WH-Question', example: 'Why did...' },
  { pattern: /(vs\.?|versus|compared|battle|showdown)/i, format: 'Comparison/Battle', example: 'X vs Y' },
  { pattern: /(update|latest|new|just\s+announced)/i, format: 'Update/Latest', example: 'Latest:' },
  { pattern: /(warning|danger|avoid|don'?t|never|stop)/i, format: 'Warning/Negative', example: 'Warning:' },
  { pattern: /(\$\d|million|billion|worth|paid|cost|price)/i, format: 'Money/Financial', example: 'Worth $X' },
  { pattern: /(secret|hidden|unknown|nobody\s+knows)/i, format: 'Secret/Mystery', example: 'Secret...' },
  { pattern: /(first\s+look|preview|sneak\s+peek|teaser)/i, format: 'Preview/Teaser', example: 'First Look:' },
];

// Title format patterns (for click analysis)
const TITLE_FORMAT_PATTERNS = [
  { pattern: /^\d+\s+(ways?|things?|reasons?|tips?|secrets?|facts?|signs?)/i, format: 'Numbered List', example: '10 Things...' },
  { pattern: /^(top|best|worst)\s+\d+/i, format: 'Top X List', example: 'Top 5...' },
  { pattern: /\?$/i, format: 'Question', example: 'Ends with ?' },
  { pattern: /^(how\s+to|here'?s?\s+how)/i, format: 'How-To', example: 'How to...' },
  { pattern: /(photo|pic|image|video|watch|see)/i, format: 'Visual Content', example: 'See Photos...' },
  { pattern: /(revealed|exposed|leaked|confirmed)/i, format: 'Reveal', example: 'Revealed:' },
  { pattern: /(responds?|reacts?|slams?|fires\s+back|claps\s+back)/i, format: 'Response/Clap Back', example: 'X Responds to...' },
  { pattern: /(breaks?\s+silence|speaks?\s+out|opens?\s+up|admits?)/i, format: 'Speaking Out', example: 'Breaks Silence' },
  { pattern: /(spotted|seen|caught|photographed)/i, format: 'Sighting', example: 'Spotted...' },
  { pattern: /(before\s+and\s+after|then\s+and\s+now|transformation)/i, format: 'Before/After', example: 'Before and After' },
  { pattern: /(vs\.?|versus|compared|battle)/i, format: 'Comparison', example: 'X vs Y' },
  { pattern: /(everything\s+(you\s+need\s+)?to\s+know|complete\s+guide|explained)/i, format: 'Explainer', example: 'Everything to Know' },
  { pattern: /(net\s+worth|\$\d|million|billion|salary|paid)/i, format: 'Money/Worth', example: 'Net Worth' },
  { pattern: /(timeline|history|story\s+of)/i, format: 'Timeline/History', example: 'Timeline:' },
  { pattern: /(rumor|report|allegedly|supposedly|source)/i, format: 'Rumor/Report', example: 'Reports say...' },
];

// Extract entities from text using enhanced database
function extractEntities(text) {
  if (!text) return [];
  const textLower = text.toLowerCase();
  const found = new Map(); // Use Map to dedupe by display name

  for (const personality of PERSONALITY_DATABASE) {
    // Check each name variant
    for (const name of personality.names) {
      // Check for whole word match (with word boundary handling)
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedName}\\b`, 'i');

      if (regex.test(textLower)) {
        // Use the canonical display name
        if (!found.has(personality.display)) {
          found.set(personality.display, {
            type: 'personality',
            name: personality.display,
            category: personality.category,
            raw: name
          });
        }
        break; // Found a match for this personality, move to next
      }
    }
  }

  return Array.from(found.values());
}

// Extract events from text
function extractEvents(text) {
  if (!text) return [];
  const found = [];

  for (const event of EVENT_PATTERNS) {
    if (event.pattern.test(text)) {
      found.push({
        type: 'event',
        category: event.category,
        label: event.label
      });
    }
  }

  return found;
}

// Detect subject line format
function detectSubjectFormat(text) {
  if (!text) return { format: 'Standard', example: 'Basic subject' };

  for (const pattern of SUBJECT_FORMAT_PATTERNS) {
    if (pattern.pattern.test(text)) {
      return { format: pattern.format, example: pattern.example };
    }
  }

  return { format: 'Standard', example: 'Basic subject' };
}

// Detect title format
function detectTitleFormat(text) {
  if (!text) return { format: 'Standard', example: 'Basic title' };

  for (const pattern of TITLE_FORMAT_PATTERNS) {
    if (pattern.pattern.test(text)) {
      return { format: pattern.format, example: pattern.example };
    }
  }

  return { format: 'Standard', example: 'Basic title' };
}

// ============== HELPERS ==============

function getPeriodDays(timePeriod) {
  switch (timePeriod) {
    case '7day': return 7;
    case '30day': return 30;
    case '90day': return 90;
    case 'all': return 9999;
    default: return 30;
  }
}

function formatPercent(val) {
  return `${val.toFixed(1)}%`;
}

function formatNumber(val) {
  return val.toLocaleString();
}

// ============== DATA PROCESSING ==============

function processPostsData(posts, periodDays) {
  const now = new Date();
  const cutoffDate = subDays(now, periodDays);

  const filtered = posts.filter(p => {
    if (periodDays === 9999) return true;
    const postDate = new Date(p['Publish Date'] || p.publishDate);
    return postDate >= cutoffDate;
  }).map(p => {
    const delivered = parseFloat(p['Delivered'] || p.delivered || p['Recipients'] || 0);
    const opens = parseFloat(p['Unique Opens'] || p.unique_opens || 0);
    const clicks = parseFloat(p['Unique Clicks'] || p.unique_clicks || 0);
    const title = p['Title'] || p.title || p.subject || 'Untitled';
    const subjectLine = p['Subject'] || p.subject || title;

    // Extract entities and events
    const titleEntities = extractEntities(title);
    const subjectEntities = extractEntities(subjectLine);
    const allEntities = [...new Map([...titleEntities, ...subjectEntities].map(e => [e.name, e])).values()];

    const titleEvents = extractEvents(title);
    const subjectEvents = extractEvents(subjectLine);
    const allEvents = [...new Map([...titleEvents, ...subjectEvents].map(e => [e.label, e])).values()];

    // Detect formats
    const subjectFormat = detectSubjectFormat(subjectLine);
    const titleFormat = detectTitleFormat(title);

    // Get article clicks from the post
    const articleClicks = p['Article Clicks'] || p['articleClicks'] || [];

    return {
      id: p['Post ID'] || p.id || Math.random(),
      title,
      subjectLine,
      date: new Date(p['Publish Date'] || p.publishDate),
      delivered,
      opens,
      clicks,
      openRate: delivered > 0 ? (opens / delivered) * 100 : 0,
      clickRate: delivered > 0 ? (clicks / delivered) * 100 : 0,
      ctor: opens > 0 ? (clicks / opens) * 100 : 0,
      entities: allEntities,
      events: allEvents,
      subjectFormat: subjectFormat.format,
      titleFormat: titleFormat.format,
      articleClicks: articleClicks,
    };
  });

  filtered.sort((a, b) => b.date - a.date);
  return filtered;
}

// Aggregate entity performance
function aggregateEntityPerformance(posts) {
  const entityMap = new Map();

  for (const post of posts) {
    for (const entity of post.entities) {
      const key = entity.name;
      if (!entityMap.has(key)) {
        entityMap.set(key, {
          name: entity.name,
          type: entity.type,
          posts: [],
          totalOpens: 0,
          totalClicks: 0,
          totalDelivered: 0,
        });
      }
      const entry = entityMap.get(key);
      entry.posts.push(post);
      entry.totalOpens += post.opens;
      entry.totalClicks += post.clicks;
      entry.totalDelivered += post.delivered;
    }
  }

  return Array.from(entityMap.values())
    .map(e => ({
      ...e,
      postCount: e.posts.length,
      avgOpenRate: e.totalDelivered > 0 ? (e.totalOpens / e.totalDelivered) * 100 : 0,
      avgCtor: e.totalOpens > 0 ? (e.totalClicks / e.totalOpens) * 100 : 0,
    }))
    .sort((a, b) => b.postCount - a.postCount);
}

// Aggregate event performance
function aggregateEventPerformance(posts) {
  const eventMap = new Map();

  for (const post of posts) {
    for (const event of post.events) {
      const key = event.label;
      if (!eventMap.has(key)) {
        eventMap.set(key, {
          label: event.label,
          category: event.category,
          posts: [],
          totalOpens: 0,
          totalClicks: 0,
          totalDelivered: 0,
        });
      }
      const entry = eventMap.get(key);
      entry.posts.push(post);
      entry.totalOpens += post.opens;
      entry.totalClicks += post.clicks;
      entry.totalDelivered += post.delivered;
    }
  }

  return Array.from(eventMap.values())
    .map(e => ({
      ...e,
      postCount: e.posts.length,
      avgOpenRate: e.totalDelivered > 0 ? (e.totalOpens / e.totalDelivered) * 100 : 0,
      avgCtor: e.totalOpens > 0 ? (e.totalClicks / e.totalOpens) * 100 : 0,
    }))
    .sort((a, b) => b.postCount - a.postCount);
}

// Aggregate format performance
function aggregateFormatPerformance(posts, formatKey, metricKey) {
  const formatMap = new Map();

  for (const post of posts) {
    const format = post[formatKey];
    if (!formatMap.has(format)) {
      formatMap.set(format, {
        format,
        posts: [],
        totalOpens: 0,
        totalClicks: 0,
        totalDelivered: 0,
      });
    }
    const entry = formatMap.get(format);
    entry.posts.push(post);
    entry.totalOpens += post.opens;
    entry.totalClicks += post.clicks;
    entry.totalDelivered += post.delivered;
  }

  return Array.from(formatMap.values())
    .map(e => ({
      ...e,
      postCount: e.posts.length,
      avgOpenRate: e.totalDelivered > 0 ? (e.totalOpens / e.totalDelivered) * 100 : 0,
      avgCtor: e.totalOpens > 0 ? (e.totalClicks / e.totalOpens) * 100 : 0,
      metric: metricKey === 'openRate'
        ? (e.totalDelivered > 0 ? (e.totalOpens / e.totalDelivered) * 100 : 0)
        : (e.totalOpens > 0 ? (e.totalClicks / e.totalOpens) * 100 : 0),
    }))
    .sort((a, b) => b.metric - a.metric);
}

// ============== COMPONENTS ==============

// Colors for charts
const CHART_COLORS = ['#18181b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// Entity Performance Table with expandable articles
function EntityPerformanceTable({ entities, title, posts = [], articles = [] }) {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const topEntities = entities.slice(0, 10);

  // Get articles for selected entity
  const entityArticles = useMemo(() => {
    if (!selectedEntity) return [];
    const entityLower = selectedEntity.toLowerCase();

    // Find posts that contain this entity
    const entityPosts = posts.filter(p =>
      p.entities?.some(e => e.name.toLowerCase() === entityLower)
    );

    // Get articles from those posts (limited to top 5)
    const relatedArticles = [];
    entityPosts.forEach(post => {
      if (post.articleClicks && Array.isArray(post.articleClicks)) {
        post.articleClicks.forEach(article => {
          relatedArticles.push({
            title: article.title || article.url || 'Article',
            url: article.url,
            clicks: article.totalClicks || article.clicks || 0,
            postTitle: post.title,
            date: post.date
          });
        });
      }
    });

    return relatedArticles.sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  }, [selectedEntity, posts]);

  if (topEntities.length === 0) {
    return (
      <div className="content-card">
        <div className="content-card-header">
          <h3>{title}</h3>
        </div>
        <div className="content-empty">No entities detected in this period</div>
      </div>
    );
  }

  return (
    <div className="content-card">
      <div className="content-card-header">
        <h3>{title}</h3>
        <span className="content-card-count">{entities.length} total</span>
      </div>
      <div className="content-table-container">
        <table className="content-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-title">Entity</th>
              <th className="col-stat">Posts</th>
              <th className="col-stat">Open Rate</th>
              <th className="col-stat">CTOR</th>
            </tr>
          </thead>
          <tbody>
            {topEntities.map((entity, idx) => (
              <React.Fragment key={entity.name}>
                <tr
                  className={`entity-row ${selectedEntity === entity.name ? 'selected' : ''}`}
                  onClick={() => setSelectedEntity(selectedEntity === entity.name ? null : entity.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="col-rank">{idx + 1}</td>
                  <td className="col-title">
                    <span className="entity-name">
                      {selectedEntity === entity.name ? '▼ ' : '▶ '}{entity.name}
                    </span>
                  </td>
                  <td className="col-stat">{entity.postCount}</td>
                  <td className="col-stat">
                    <span className={`stat-pill ${entity.avgOpenRate >= 35 ? 'good' : entity.avgOpenRate >= 25 ? 'ok' : 'low'}`}>
                      {formatPercent(entity.avgOpenRate)}
                    </span>
                  </td>
                  <td className="col-stat">{formatPercent(entity.avgCtor)}</td>
                </tr>
                {selectedEntity === entity.name && (
                  <tr className="entity-articles-row">
                    <td colSpan={5}>
                      <div className="entity-articles-panel">
                        <div className="entity-articles-title">Top Articles for {entity.name}</div>
                        {entityArticles.length > 0 ? (
                          <ul className="entity-articles-list">
                            {entityArticles.map((article, i) => (
                              <li key={i}>
                                <span className="article-clicks">{article.clicks.toLocaleString()} clicks</span>
                                <span className="article-title">{article.title?.substring(0, 50) || 'Article'}</span>
                                {article.url && (
                                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-link">
                                    ↗
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="no-articles">No article click data available for this entity</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Event Performance Table with expandable articles
function EventPerformanceTable({ events, title, posts = [], articles = [] }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const topEvents = events.slice(0, 10);

  // Get articles for selected event
  const eventArticles = useMemo(() => {
    if (!selectedEvent) return [];

    // Find posts that contain this event
    const eventPosts = posts.filter(p =>
      p.events?.some(e => e.label === selectedEvent)
    );

    // Get articles from those posts
    const relatedArticles = [];
    eventPosts.forEach(post => {
      if (post.articleClicks && Array.isArray(post.articleClicks)) {
        post.articleClicks.forEach(article => {
          relatedArticles.push({
            title: article.title || article.url || 'Article',
            url: article.url,
            clicks: article.totalClicks || article.clicks || 0,
            postTitle: post.title,
            date: post.date
          });
        });
      }
    });

    return relatedArticles.sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  }, [selectedEvent, posts]);

  if (topEvents.length === 0) {
    return (
      <div className="content-card">
        <div className="content-card-header">
          <h3>{title}</h3>
        </div>
        <div className="content-empty">No events/trends detected in this period</div>
      </div>
    );
  }

  return (
    <div className="content-card">
      <div className="content-card-header">
        <h3>{title}</h3>
        <span className="content-card-count">{events.length} total</span>
      </div>
      <div className="content-table-container">
        <table className="content-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-title">Event/Trend</th>
              <th className="col-stat">Category</th>
              <th className="col-stat">Posts</th>
              <th className="col-stat">Open Rate</th>
              <th className="col-stat">CTOR</th>
            </tr>
          </thead>
          <tbody>
            {topEvents.map((event, idx) => (
              <React.Fragment key={event.label}>
                <tr
                  className={`event-row ${selectedEvent === event.label ? 'selected' : ''}`}
                  onClick={() => setSelectedEvent(selectedEvent === event.label ? null : event.label)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="col-rank">{idx + 1}</td>
                  <td className="col-title">
                    <span className="event-label">
                      {selectedEvent === event.label ? '▼ ' : '▶ '}{event.label}
                    </span>
                  </td>
                  <td className="col-stat">
                    <span className="category-badge">{event.category}</span>
                  </td>
                  <td className="col-stat">{event.postCount}</td>
                  <td className="col-stat">
                    <span className={`stat-pill ${event.avgOpenRate >= 35 ? 'good' : event.avgOpenRate >= 25 ? 'ok' : 'low'}`}>
                      {formatPercent(event.avgOpenRate)}
                    </span>
                  </td>
                  <td className="col-stat">{formatPercent(event.avgCtor)}</td>
                </tr>
                {selectedEvent === event.label && (
                  <tr className="event-articles-row">
                    <td colSpan={6}>
                      <div className="entity-articles-panel">
                        <div className="entity-articles-title">Top Articles for {event.label}</div>
                        {eventArticles.length > 0 ? (
                          <ul className="entity-articles-list">
                            {eventArticles.map((article, i) => (
                              <li key={i}>
                                <span className="article-clicks">{article.clicks.toLocaleString()} clicks</span>
                                <span className="article-title">{article.title?.substring(0, 50) || 'Article'}</span>
                                {article.url && (
                                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-link">
                                    ↗
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="no-articles">No article click data available for this event</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Format Performance Chart
function FormatPerformanceChart({ data, title, metricLabel, color = '#18181b' }) {
  const chartData = data.slice(0, 8).map(d => ({
    name: d.format,
    value: d.metric,
    posts: d.postCount
  }));

  if (chartData.length === 0) {
    return (
      <div className="content-card">
        <div className="content-card-header">
          <h3>{title}</h3>
        </div>
        <div className="content-empty">No format data available</div>
      </div>
    );
  }

  return (
    <div className="content-card">
      <div className="content-card-header">
        <h3>{title}</h3>
        <span className="content-card-subtitle">Sorted by {metricLabel}</span>
      </div>
      <div className="content-chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val.toFixed(0)}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(value, name, props) => [`${value.toFixed(1)}% (${props.payload.posts} newsletters)`, metricLabel]}
              labelFormatter={(label) => `Format: ${label}`}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Metric Summary Card
function MetricSummaryCard({ label, value, format: formatType, subtext, trend }) {
  const displayValue = formatType === 'percent' ? formatPercent(value) : formatNumber(value);

  return (
    <div className="content-metric-card">
      <div className="content-metric-label">{label}</div>
      <div className="content-metric-value">{displayValue}</div>
      {subtext && <div className="content-metric-subtext">{subtext}</div>}
    </div>
  );
}

// Sortable Posts Table - like newsletters table with sorting
function SortablePostsTable({ posts, title }) {
  const [sortBy, setSortBy] = useState('openRate');
  const [sortDir, setSortDir] = useState('desc');

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    }).slice(0, 15);
  }, [posts, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => (
    <span className={`sort-icon ${sortBy === field ? 'active' : ''}`}>
      {sortBy === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  if (posts.length === 0) {
    return (
      <div className="content-card content-card-full">
        <div className="content-card-header">
          <h3>{title}</h3>
        </div>
        <div className="content-empty">No newsletters available</div>
      </div>
    );
  }

  return (
    <div className="content-card content-card-full">
      <div className="content-card-header">
        <h3>{title}</h3>
        <span className="content-card-count">{posts.length} newsletters</span>
      </div>
      <div className="content-table-container">
        <table className="content-table sortable-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-date">Date</th>
              <th className="col-title">Subject Line</th>
              <th className="col-entities">Entities/Events</th>
              <th className="col-stat sortable" onClick={() => handleSort('delivered')}>
                Delivered <SortIcon field="delivered" />
              </th>
              <th className="col-stat sortable" onClick={() => handleSort('openRate')}>
                Open Rate <SortIcon field="openRate" />
              </th>
              <th className="col-stat sortable" onClick={() => handleSort('ctor')}>
                CTOR <SortIcon field="ctor" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map((post, idx) => (
              <tr key={post.id}>
                <td className="col-rank">{idx + 1}</td>
                <td className="col-date">{format(post.date, 'MMM d')}</td>
                <td className="col-title">
                  <div className="post-title-cell">
                    <span className="post-title-text">{post.title.substring(0, 45)}{post.title.length > 45 ? '...' : ''}</span>
                    <span className="post-format-badge">{post.subjectFormat}</span>
                  </div>
                </td>
                <td className="col-entities">
                  <div className="entity-badges">
                    {post.entities.slice(0, 2).map(e => (
                      <span key={e.name} className="entity-badge">{e.name}</span>
                    ))}
                    {post.events.slice(0, 1).map(e => (
                      <span key={e.label} className="event-badge">{e.label}</span>
                    ))}
                  </div>
                </td>
                <td className="col-stat">{formatNumber(post.delivered)}</td>
                <td className="col-stat">
                  <span className={`stat-pill ${post.openRate >= 35 ? 'good' : post.openRate >= 25 ? 'ok' : 'low'}`}>
                    {formatPercent(post.openRate)}
                  </span>
                </td>
                <td className="col-stat">{formatPercent(post.ctor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// External Link Icon for articles
function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 1.5h2.5v2.5M7 7l5.5-5.5M12.5 7.5v4.5a1 1 0 01-1 1h-9a1 1 0 01-1-1v-9a1 1 0 011-1H7" />
    </svg>
  );
}

// Sortable Articles Table - similar structure to newsletters table
function SortableArticlesTable({ articles, title }) {
  const [sortBy, setSortBy] = useState('totalClicks');
  const [sortDir, setSortDir] = useState('desc');

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'publishDate') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      return sortDir === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
    }).slice(0, 15);
  }, [articles, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => (
    <span className={`sort-icon ${sortBy === field ? 'active' : ''}`}>
      {sortBy === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  const formatArticleDate = (date) => {
    if (!date) return '-';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '-';
      return format(d, 'MMM d');
    } catch {
      return '-';
    }
  };

  if (!articles || articles.length === 0) {
    return (
      <div className="content-card content-card-full">
        <div className="content-card-header">
          <h3>{title}</h3>
        </div>
        <div className="content-empty">No articles available</div>
      </div>
    );
  }

  return (
    <div className="content-card content-card-full">
      <div className="content-card-header">
        <h3>{title}</h3>
        <span className="content-card-count">{articles.length} articles</span>
      </div>
      <div className="content-table-container">
        <table className="content-table sortable-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-title sortable" onClick={() => handleSort('title')}>
                Article <SortIcon field="title" />
              </th>
              <th className="col-date sortable" onClick={() => handleSort('publishDate')}>
                Date <SortIcon field="publishDate" />
              </th>
              <th className="col-stat sortable" onClick={() => handleSort('totalClicks')}>
                Clicks <SortIcon field="totalClicks" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedArticles.map((article, idx) => (
              <tr key={idx} className="table-row">
                <td className="col-rank">{idx + 1}</td>
                <td className="col-title">
                  <div className="article-title-cell">
                    <span className="article-title-text" title={article.title}>
                      {article.title.substring(0, 60)}{article.title.length > 60 ? '...' : ''}
                    </span>
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLinkIcon />
                      </a>
                    )}
                  </div>
                </td>
                <td className="col-date">{formatArticleDate(article.publishDate)}</td>
                <td className="col-stat">
                  <span className="metric-value-cell">
                    {(article.totalClicks || 0).toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Entity/Event Trend Chart - shows performance trend over time for selected entity/event
function EntityEventTrendChart({ posts, entities, events }) {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Get trend data for selected entity or event
  const trendData = useMemo(() => {
    let filteredPosts = posts;

    if (selectedEntity) {
      filteredPosts = posts.filter(p => p.entities.some(e => e.name === selectedEntity));
    } else if (selectedEvent) {
      filteredPosts = posts.filter(p => p.events.some(e => e.label === selectedEvent));
    } else {
      return [];
    }

    // Group by date
    const byDate = {};
    filteredPosts.forEach(post => {
      const dateKey = format(post.date, 'yyyy-MM-dd');
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, posts: 0, totalOpens: 0, totalDelivered: 0, totalClicks: 0 };
      }
      byDate[dateKey].posts += 1;
      byDate[dateKey].totalOpens += post.opens;
      byDate[dateKey].totalDelivered += post.delivered;
      byDate[dateKey].totalClicks += post.clicks;
    });

    return Object.values(byDate)
      .map(d => ({
        date: d.date,
        openRate: d.totalDelivered > 0 ? (d.totalOpens / d.totalDelivered) * 100 : 0,
        posts: d.posts
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [posts, selectedEntity, selectedEvent]);

  const topEntities = entities.slice(0, 5);
  const topEvents = events.slice(0, 5);

  return (
    <div className="content-card content-card-full">
      <div className="content-card-header">
        <h3>Entity/Event Performance Trend</h3>
        <span className="content-card-subtitle">Select an entity or event to see its trend</span>
      </div>
      <div className="trend-selector">
        <div className="trend-selector-group">
          <label>Entities:</label>
          <div className="trend-selector-buttons">
            {topEntities.map(e => (
              <button
                key={e.name}
                className={`trend-select-btn ${selectedEntity === e.name ? 'active' : ''}`}
                onClick={() => {
                  setSelectedEntity(selectedEntity === e.name ? null : e.name);
                  setSelectedEvent(null);
                }}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>
        <div className="trend-selector-group">
          <label>Events:</label>
          <div className="trend-selector-buttons">
            {topEvents.map(e => (
              <button
                key={e.label}
                className={`trend-select-btn ${selectedEvent === e.label ? 'active' : ''}`}
                onClick={() => {
                  setSelectedEvent(selectedEvent === e.label ? null : e.label);
                  setSelectedEntity(null);
                }}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {(selectedEntity || selectedEvent) && trendData.length > 0 ? (
        <div className="content-chart-container" style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => format(new Date(val), 'MMM d')}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val.toFixed(0)}%`}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  name === 'openRate' ? `${value.toFixed(1)}%` : value,
                  name === 'openRate' ? 'Open Rate' : 'Posts'
                ]}
                labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
              />
              <Area
                type="monotone"
                dataKey="openRate"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#trendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="content-empty" style={{ padding: '40px' }}>
          Select an entity or event above to view its performance trend over time
        </div>
      )}
    </div>
  );
}

// Top Newsletters by Entity/Event
function TopContentTable({ posts, title, limit = 5 }) {
  const displayPosts = posts.slice(0, limit);

  if (displayPosts.length === 0) {
    return null;
  }

  return (
    <div className="content-card content-card-full">
      <div className="content-card-header">
        <h3>{title}</h3>
        <span className="content-card-count">{posts.length} newsletters</span>
      </div>
      <div className="content-table-container">
        <table className="content-table">
          <thead>
            <tr>
              <th className="col-date">Date</th>
              <th className="col-title">Subject Line</th>
              <th className="col-entities">Entities</th>
              <th className="col-stat">Open Rate</th>
              <th className="col-stat">CTOR</th>
            </tr>
          </thead>
          <tbody>
            {displayPosts.map((post) => (
              <tr key={post.id}>
                <td className="col-date">{format(post.date, 'MMM d')}</td>
                <td className="col-title">
                  <div className="post-title-cell">
                    <span className="post-title-text">{post.title.substring(0, 55)}{post.title.length > 55 ? '...' : ''}</span>
                    <span className="post-format-badge">{post.subjectFormat}</span>
                  </div>
                </td>
                <td className="col-entities">
                  <div className="entity-badges">
                    {post.entities.slice(0, 2).map(e => (
                      <span key={e.name} className="entity-badge">{e.name}</span>
                    ))}
                    {post.events.slice(0, 1).map(e => (
                      <span key={e.label} className="event-badge">{e.label}</span>
                    ))}
                  </div>
                </td>
                <td className="col-stat">
                  <span className={`stat-pill ${post.openRate >= 35 ? 'good' : post.openRate >= 25 ? 'ok' : 'low'}`}>
                    {formatPercent(post.openRate)}
                  </span>
                </td>
                <td className="col-stat">{formatPercent(post.ctor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============== MAIN COMPONENT ==============

export default function ContentPerformancePage({ data }) {
  const [timePeriod, setTimePeriod] = useState('30day');

  const { posts, articles, entityPerformance, eventPerformance, subjectFormatPerformance, titleFormatPerformance, summary } = useMemo(() => {
    if (!data?.posts) return { posts: [], articles: [], entityPerformance: [], eventPerformance: [], subjectFormatPerformance: [], titleFormatPerformance: [], summary: null };

    const periodDays = getPeriodDays(timePeriod);
    const processedPosts = processPostsData(data.posts, periodDays);

    // Process articles data from articleClicks (normalized from topArticles)
    const now = new Date();
    const cutoffDate = subDays(now, periodDays);
    const processedArticles = (data.articleClicks || [])
      .filter(a => {
        if (periodDays === 9999) return true;
        const articleDate = new Date(a['Publish Date'] || a.publishDate);
        return articleDate >= cutoffDate;
      })
      .map(a => ({
        title: a['Post Title'] || a['Article URL'] || 'Article',
        publishDate: a['Publish Date'] || a.publishDate,
        totalClicks: a['Total Clicks'] || a.totalClicks || 0,
        url: a['Article URL'] || a.url || null
      }))
      .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0));

    // Aggregate by entities and events
    const entities = aggregateEntityPerformance(processedPosts);
    const events = aggregateEventPerformance(processedPosts);

    // Aggregate by format
    const subjectFormats = aggregateFormatPerformance(processedPosts, 'subjectFormat', 'openRate');
    const titleFormats = aggregateFormatPerformance(processedPosts, 'titleFormat', 'ctor');

    // Calculate summary
    const totalDelivered = processedPosts.reduce((sum, p) => sum + p.delivered, 0);
    const totalOpens = processedPosts.reduce((sum, p) => sum + p.opens, 0);
    const totalClicks = processedPosts.reduce((sum, p) => sum + p.clicks, 0);

    const summaryData = {
      totalPosts: processedPosts.length,
      avgOpenRate: totalDelivered > 0 ? (totalOpens / totalDelivered) * 100 : 0,
      avgCtor: totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0,
      entitiesFound: entities.length,
      eventsFound: events.length,
    };

    return {
      posts: processedPosts,
      articles: processedArticles,
      entityPerformance: entities,
      eventPerformance: events,
      subjectFormatPerformance: subjectFormats,
      titleFormatPerformance: titleFormats,
      summary: summaryData
    };
  }, [data, timePeriod]);

  if (!summary) {
    return (
      <main className="dashboard-main">
        <div className="content-loading">Loading content data...</div>
      </main>
    );
  }

  // Find best performing entity and event
  const bestEntity = entityPerformance.length > 0
    ? entityPerformance.reduce((best, e) => e.avgOpenRate > best.avgOpenRate ? e : best, entityPerformance[0])
    : null;
  const bestEvent = eventPerformance.length > 0
    ? eventPerformance.reduce((best, e) => e.avgOpenRate > best.avgOpenRate ? e : best, eventPerformance[0])
    : null;

  return (
    <main className="dashboard-main content-page">
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="filter-select"
          >
            {TIME_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-info">
          <span className="post-count">{summary.totalPosts} newsletters analyzed</span>
        </div>
      </div>

      {/* Summary Metrics - Entities/Events first, then Open Rate/CTR */}
      <section>
        <h2 className="section-title">Content Analysis Overview</h2>
        <div className="content-metrics-grid">
          <MetricSummaryCard
            label="Entities Detected"
            value={summary.entitiesFound}
            format="number"
            subtext="Unique personalities"
          />
          <MetricSummaryCard
            label="Events/Trends"
            value={summary.eventsFound}
            format="number"
            subtext="Topics identified"
          />
          <MetricSummaryCard
            label="Average Open Rate"
            value={summary.avgOpenRate}
            format="percent"
            subtext="Subject line performance"
          />
          <MetricSummaryCard
            label="Average CTOR"
            value={summary.avgCtor}
            format="percent"
            subtext="Title & content engagement"
          />
        </div>
      </section>

      {/* Entity & Event Performance - PRIMARY SECTION */}
      <section>
        <h2 className="section-title">Entity & Event Performance</h2>
        <p className="section-description">
          Personalities and events mentioned in your content. Click on an entity to see its top performing articles. Open rates reflect subject line appeal, CTOR measures content engagement.
        </p>
        <div className="content-tables-row">
          <EntityPerformanceTable
            entities={entityPerformance}
            title="Top Personalities/Entities"
            posts={posts}
            articles={articles}
          />
          <EventPerformanceTable
            events={eventPerformance}
            title="Top Events/Trends"
            posts={posts}
            articles={articles}
          />
        </div>
      </section>

      {/* Entity/Event Trend Chart */}
      <section>
        <h2 className="section-title">Entity/Event Trends</h2>
        <EntityEventTrendChart
          posts={posts}
          entities={entityPerformance}
          events={eventPerformance}
        />
      </section>

      {/* Format Analysis */}
      <section>
        <h2 className="section-title">Format Analysis</h2>
        <p className="section-description">
          Subject line format drives opens. Article title format drives clicks. Find what resonates with your audience.
        </p>
        <div className="content-charts-grid">
          <FormatPerformanceChart
            data={subjectFormatPerformance}
            title="Subject Line Formats → Opens"
            metricLabel="Open Rate"
            color="#3b82f6"
          />
          <FormatPerformanceChart
            data={titleFormatPerformance}
            title="Title Formats → Clicks"
            metricLabel="CTOR"
            color="#10b981"
          />
        </div>
      </section>

      {/* Sortable Posts Table */}
      <section>
        <h2 className="section-title">Top Performing Newsletters</h2>
        <p className="section-description">
          Click column headers to sort. Shows all newsletters with their engagement metrics.
        </p>
        <SortablePostsTable
          posts={posts}
          title="All Newsletters"
        />
      </section>

      {/* Top Performing Articles Table */}
      <section>
        <h2 className="section-title">Top Performing Articles</h2>
        <p className="section-description">
          Click column headers to sort. Shows top articles ranked by total clicks with links to view.
        </p>
        <SortableArticlesTable
          articles={articles}
          title="All Articles"
        />
      </section>
    </main>
  );
}
