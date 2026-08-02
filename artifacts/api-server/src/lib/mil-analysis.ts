import OpenAI from "openai";

export interface MILAnalysisResult {
  contentCategory: string;
  warningSigns: Array<{ title: string; explanation: string; severity: "low" | "medium" | "high" }>;
  trustIndicators: Array<{ title: string; explanation: string }>;
  missingInfo: string[];
  reflectiveQuestions: string[];
  verificationSteps: string[];
  literacyLesson: string;
  recommendedActions: string[];
  educationalTip: string;
}

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  en: "English",
  am: "አማርኛ",
  om: "Afaan Oromo",
  so: "Somali",
  ti: "Tigrinya",
};

function getLanguageDisplayName(lang: string): string {
  const normalized = lang.split(/[-_]/)[0].toLowerCase();
  return LANGUAGE_DISPLAY_NAMES[normalized] ?? "English";
}

function buildSystemPrompt(responseLanguage: string): string {
  const languageName = getLanguageDisplayName(responseLanguage);

  return `You are a Media and Information Literacy educator. Analyse the provided content and return a structured JSON response.

IMPORTANT RULES:
- NEVER say "this is a scam" or "this is definitely fake"
- NEVER make decisions for the user
- Frame everything as "indicators that deserve attention" or "things to verify"
- Use educational, neutral, supportive language
- Your goal is to improve digital literacy, not replace the user's judgement
- ALWAYS respond in ${languageName} only, regardless of the language of the input content
- Ensure every displayed string value is in ${languageName} and not English
- The user-facing contentCategory value should also be translated into ${languageName}

Return ONLY valid JSON in this exact structure:
{
  "contentCategory": "string (user-facing category label translated to the same language as the response, e.g. Job Scam, Disinformation, Investment/Crypto, Fake Store, Scholarship, General, Government)",
  "warningSigns": [
    { "title": "string", "explanation": "string (explain WHY this matters, not just what it is)", "severity": "low | medium | high" }
  ],
  "trustIndicators": [
    { "title": "string", "explanation": "string" }
  ],
  "missingInfo": ["string (things that are absent or unverifiable)"],
  "reflectiveQuestions": ["question to help the user think critically"],
  "verificationSteps": ["concrete step to verify this content"],
  "literacyLesson": "2-3 sentences teaching a relevant digital literacy concept",
  "recommendedActions": ["specific next action for the user"],
  "educationalTip": "one practical tip to help in similar situations"
}`;
}

function buildFallbackAnalysis(
  contentType: string,
  responseLanguage: string
): MILAnalysisResult {
  const lang = responseLanguage.split(/[-_]/)[0].toLowerCase();

  const fallbackMessages: Record<string, MILAnalysisResult> = {
    en: {
      contentCategory: contentType === "job" ? "job" : contentType === "news" ? "news" : "general",
      warningSigns: [
        {
          title: "AI analysis not yet configured",
          explanation: "Add your OPENROUTER_API_KEY to enable AI-powered analysis. In the meantime, consider the general indicators below.",
          severity: "low",
        },
        {
          title: "Verify the source independently",
          explanation: "Always check whether the sender or publisher has an established, verifiable online presence with consistent history.",
          severity: "medium",
        },
      ],
      trustIndicators: [],
      missingInfo: ["AI-powered analysis requires an OPENROUTER_API_KEY"],
      reflectiveQuestions: [
        "Can you independently verify who sent or published this?",
        "Does this content create a sense of urgency or fear? Why might that be?",
        "Have you checked a second, unrelated trusted source for this information?",
      ],
      verificationSteps: [
        "Search for the sender's name or organisation on official websites",
        "Use a fact-checking site (e.g. Snopes, AFP Fact Check, Full Fact)",
        "Reverse image search any images in the content",
      ],
      literacyLesson: "Digital literacy means asking questions before you act. Legitimate organisations rarely pressure you to respond immediately or keep things secret. Taking time to verify is always the right choice.",
      recommendedActions: [
        "Do not share personal or financial information until verified",
        "Seek a second opinion from someone you trust",
      ],
      educationalTip: "When in doubt, pause and verify through an official, independent channel before taking any action.",
    },
    am: {
      contentCategory: contentType === "job" ? "job" : contentType === "news" ? "news" : "general",
      warningSigns: [
        {
          title: "የAI ትንታኔ አልተቀመጠም",
          explanation: "OPENROUTER_API_KEYዎን ያስገቡ የAI ትንታኔ እንዲከናወን ። እስካሁን ድረስ ከታላቅ ምንጭ ማስተናገድ ላይ ያሉ አጠቃላይ አስታያትን ይመልከቱ።",
          severity: "low",
        },
        {
          title: "ምንጉን በራስዎ ያረጋግጡ",
          explanation: "ላከው ወይም አስተዋፅኦ ያስተዋወቀው ድር ድርጅት ታማኝ እና ታዋቂ እንደሆነ ያረጋግጡ።",
          severity: "medium",
        },
      ],
      trustIndicators: [],
      missingInfo: ["የAI ትንታኔ ለማግኘት OPENROUTER_API_KEY ያስፈልጋል"],
      reflectiveQuestions: [
        "ማን እንደ ላከው ብቻ ትረጉማለህ?",
        "ይህ ይዘት ፈጣን ስለሚያደርገው እርምጃ ምን ያህል እረዳህ?",
        "ተወካይ ታማኝ ምንጭ ከነበረ ሌላ እውነታ አረጋግጥ?",
      ],
      verificationSteps: [
        "የላከውን ስም ወይም ድርጅቱን በመንገድ ይፈልጉ",
        "የእውነታ ማረጋገጫ ጣቢያ ይጠቀሙ",
        "በይዘት ውስጥ ያለውን ምስል የተወሰነ ፍለጋ ያድርጉ",
      ],
      literacyLesson: "የዲጂታል ብልጥ ማስተዋል በእርስዎ ፈተና ከወጣ በፊት ጥያቄ ማቅረብ ነው። ታማኝ ድርጅቶች ብዙ ጊዜ በፍጥነት ለመስማት አያገዙም።",
      recommendedActions: [
        "የግል መረጃ እስካለማረጋግጥ ድረስ አትከፍሉ",
        "ከእርስዎ የሚነገር ከታማኝ ሰው ጋር ምክር ይለዉ",
      ],
      educationalTip: "ምንም እንኳን ግምት ካለዎ ቆዩ እና በትክክለኛ መንገድ ስለሚከተሉ የሚከተል መረጃ ይፈልጉ።",
    },
    om: {
      contentCategory: contentType === "job" ? "job" : contentType === "news" ? "news" : "general",
      warningSigns: [
        {
          title: "Xiinxala AI hin qophaaʼin",
          explanation: "OPENROUTER_API_KEY kee idaʼi akka xiinxala AI hojjetu. Ammaaf, mallattoolee waliigalaa kana ilaali.",
          severity: "low",
        },
        {
          title: "Madalaa ofiin mirkaneessi",
          explanation: "Ergaa ergatee ykn maxxanfame eenyu akka taʼe fi seenaa isaa sirrii taʼe mirkaneessi.",
          severity: "medium",
        },
      ],
      trustIndicators: [],
      missingInfo: ["Xiinxala AI argachuuf OPENROUTER_API_KEY barbaachisa"],
      reflectiveQuestions: [
        "Eenyi ergaa kana erge ofiin mirkaneeffachuu dandeessaa?",
        "Kuni rifachiisa ykn sodaa umuu dandaʼa? Maaliif?",
        "Madda biraa amanamaa kan adda taʼe ilaaltanii jirtaa?",
      ],
      verificationSteps: [
        "Maqaa ergaa ergite ykn dhaabbata sirrii taʼe kan interneeta irraa barreeffama barbaadi",
        "Sayitii sirrii taʼe irratti ragaa mirkaneessaa fayyadami",
        "Suuraa jiru sirritti barbaadi",
      ],
      literacyLesson: "Ogummaa dijitaalaa jechuun gaaffilee dhiyeeffachuudha. Dhaabbileen seeraa yeroo hunda si ariʼu hin barbaadan. Yeroo fudhachuu fi mirkaneeffachuu filadhu.",
      recommendedActions: [
        "Dhimma dhuunfaa ykn maallaqa yoo hin mirkaneeffamne hin qoodu",
        "Nama amanamaa si biraa ilaalchisee yaada gaafadhu",
      ],
      educationalTip: "Amma yaada guddaa malee, dura mirkaneeffadhu yeroo dheeraa fudhachuu hin sodaatiin.",
    },
    so: {
      contentCategory: contentType === "job" ? "job" : contentType === "news" ? "news" : "general",
      warningSigns: [
        {
          title: "Falanqaynta AI hin deggarne",
          explanation: "OPENROUTER_API_KEY-gaaga ku dar si aad u awooddo falanqaynta AI. Ilaa iyo markaa, ka fiirso tilmaamaha guud ee hoose.",
          severity: "low",
        },
        {
          title: "Xaqiiji ilaha si madaxbannaan",
          explanation: "Hubi in qoraalka la soo diray ama la daabacay uu ka yimid ilo la isku halleyn karo oo la aqoonsan yahay.",
          severity: "medium",
        },
      ],
      trustIndicators: [],
      missingInfo: ["Falanqaynta AI waxay u baahan tahay OPENROUTER_API_KEY"],
      reflectiveQuestions: [
        "Ma xaqiijin kartaa cidda diray ama daabacday qoraalkan?",
        "Qoraalkani ma kicinayaa cabsi ama degdeg? Maxay taasi u muuqataa?",
        "Ma eegtey ilo kale oo la isku halleyn karo?",
      ],
      verificationSteps: [
        "Raadi magaca diraha ama ururka boggaga rasmiga ah",
        "Isticmaal bog xaqiijinaya xaqiiqada sida Snopes ama kuwo kale",
        "Sawirka ka samee baaris dib u eegis haddii uu jiro sawir ku jira qoraalka",
      ],
      literacyLesson: "Aqoonta dijitalka ah waxay ka dhigan tahay inaad su'aalo iska weydiiso ka hor intaadan ficil qaadin. Hay'adaha sharci ah badanaa kuma cadaadinayaan inay si dhakhso ah uga falceliso.",
      recommendedActions: [
        "Ha wadaagin macluumaadkaaga gaarka ah ilaa aad hubto",
        "La tasho qof aad ku kalsoon tahay",
      ],
      educationalTip: "Haddii aad shakisan tahay, hakad geli oo raadi macluumaad rasmi ah ka hor intaadan go'aan gaarin.",
    },
    ti: {
      contentCategory: contentType === "job" ? "job" : contentType === "news" ? "news" : "general",
      warningSigns: [
        {
          title: "AI ትንታኔ ኣይተቐበለን",
          explanation: "OPENROUTER_API_KEYካ ክሳብ ይጨምሩ እንዳ AI ትንታኔ ይሰርሕ። እስከዚ ግዜ ኣጠቃላይ ምልክታት ይመልከቱ።",
          severity: "low",
        },
        {
          title: "ሓበሬታን መርከብን ብርኽብ ኣረጋግጽ",
          explanation: "እቲ ኣስተላለፊ ወይ ብርኽብ ዝተለገሰዉ ሓበሬታ ኣብ ሰማይ ክብል ኣለዎ እንተዘይኮነ ኣረጋግጽ።",
          severity: "medium",
        },
      ],
      trustIndicators: [],
      missingInfo: ["AI ትንታኔ ንምግባር OPENROUTER_API_KEY ይፈልጥ"],
      reflectiveQuestions: [
        "ሰውን ወይ ተቐቢ ዝርከበሉ እቲ ሓበሬታ ክትረጋግጽ ትችላለህ?",
        "እቲ ውልቀ ትንታኔ ሰብኣዊ ፍርሒ ይፈጥር? ወይ ዝኽርን?",
        "ኣንድ ሓበሬታ ከኣ ዝተረኽበ ምእንቲ ሓላፍነት ኣሎካ?",
      ],
      verificationSteps: [
        "ስምካ ወይ ድርጅትካ ብብሉ ኣንተን ምስ ኩነታት ይመልከቱ",
        "ከባቢ ተዛማዲ ናይ እውነት ምርመራ ገጽ ይጠቀሙ",
        "ብዚ ዝኾነ ስእሊ ዝተመልከትካ ዝርርብ ፍለጋ ኣድልዎ",
      ],
      literacyLesson: "ዲጂታል ብልሽቶ ምስዛዕባ ዝሰርሕ እዩ። ተወሳኺ ድርጅት ንምልእኽት ንፍጥነት ኣይገባን።",
      recommendedActions: [
        "ንሕና ዝገባ መረዳእታ ክትርእይ እንሃል",
        "ከነፍርያ ኣብ ሓርነትና ከም እተዓገትካ ይወዳእን",
      ],
      educationalTip: "ኣብ ጥራይ ኣብ ውን ክትርፍ ይግበሩ እንፈልጥ ዝገብሩ።",
    },
  };

  return fallbackMessages[lang] ?? fallbackMessages.en;
}

export async function runMILAnalysis(
  contentType: string,
  inputText: string,
  responseLanguage = "en"
): Promise<MILAnalysisResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return buildFallbackAnalysis(contentType, responseLanguage);
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://trustlense-unesco-youth-hackathon-2026-2.onrender.com",
      "X-Title": "TrustLens",
    },
  });

  const response = await client.chat.completions.create({
    model: "openrouter/free",
    max_tokens: 2048,
    messages: [
      { role: "system", content: buildSystemPrompt(responseLanguage) },
      {
        role: "user",
        content: `Content type: ${contentType}\n\nContent to analyse:\n\n${inputText}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from AI");

  return JSON.parse(raw) as MILAnalysisResult;
}
