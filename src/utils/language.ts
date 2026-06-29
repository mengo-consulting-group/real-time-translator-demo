// https://cloud.google.com/translate/docs/languages
export enum LanguageCode {
    Afrikaans = "af",
    Albanian = "sq",
    Amharic = "am",
    Arabic = "ar",
    Armenian = "hy",
    Assamese = "as",
    Aymara = "ay",
    Azerbaijani = "az",
    Bambara = "bm",
    Basque = "eu",
    Belarusian = "be",
    Bengali = "bn",
    Bhojpuri = "bho",
    Bosnian = "bs",
    Bulgarian = "bg",
    Catalan = "ca",
    Cebuano = "ceb",
    ChineseSimplified = "zh-CN",
    ChineseTraditional = "zh-TW",
    Corsican = "co",
    Croatian = "hr",
    Czech = "cs",
    Danish = "da",
    Dhivehi = "dv",
    Dogri = "doi",
    Dutch = "nl",
    English = "en",
    Esperanto = "eo",
    Estonian = "et",
    Ewe = "ee",
    FilipinoTagalog = "fil",
    Finnish = "fi",
    French = "fr",
    Frisian = "fy",
    Galician = "gl",
    Georgian = "ka",
    German = "de",
    Greek = "el",
    Guarani = "gn",
    Gujarati = "gu",
    HaitianCreole = "ht",
    Hausa = "ha",
    Hawaiian = "haw",
    Hebrew = "he",
    Hindi = "hi",
    Hmong = "hmn",
    Hungarian = "hu",
    Icelandic = "is",
    Igbo = "ig",
    Ilocano = "ilo",
    Indonesian = "id",
    Irish = "ga",
    Italian = "it",
    Japanese = "ja",
    Javanese = "jv",
    Kannada = "kn",
    Kazakh = "kk",
    Khmer = "km",
    Kinyarwanda = "rw",
    Konkani = "gom",
    Korean = "ko",
    Krio = "kri",
    Kurdish = "ku",
    KurdishSorani = "ckb",
    Kyrgyz = "ky",
    Lao = "lo",
    Latin = "la",
    Latvian = "lv",
    Lingala = "ln",
    Lithuanian = "lt",
    Luganda = "lg",
    Luxembourgish = "lb",
    Macedonian = "mk",
    Maithili = "mai",
    Malagasy = "mg",
    Malay = "ms",
    Malayalam = "ml",
    Maltese = "mt",
    Maori = "mi",
    Marathi = "mr",
    MeiteilonManipuri = "mni-Mtei",
    Mizo = "lus",
    Mongolian = "mn",
    Burmese = "my",
    Nepali = "ne",
    Norwegian = "no",
    Nyanja = "ny",
    Odia = "or",
    Oromo = "om",
    Pashto = "ps",
    Persian = "fa",
    Polish = "pl",
    Portuguese = "pt",
    Punjabi = "pa",
    Quechua = "qu",
    Romanian = "ro",
    Russian = "ru",
    Samoan = "sm",
    Sanskrit = "sa",
    ScotsGaelic = "gd",
    Sepedi = "nso",
    Serbian = "sr",
    Sesotho = "st",
    Shona = "sn",
    Sindhi = "sd",
    Sinhala = "si",
    Slovak = "sk",
    Slovenian = "sl",
    Somali = "so",
    Spanish = "es",
    Sundanese = "su",
    Swahili = "sw",
    Swedish = "sv",
    Tagalog = "tl",
    Tajik = "tg",
    Tamil = "ta",
    Tatar = "tt",
    Telugu = "te",
    Thai = "th",
    Tigrinya = "ti",
    Tsonga = "ts",
    Turkish = "tr",
    Turkmen = "tk",
    Twi = "ak",
    Ukrainian = "uk",
    Urdu = "ur",
    Uyghur = "ug",
    Uzbek = "uz",
    Vietnamese = "vi",
    Welsh = "cy",
    Xhosa = "xh",
    Yiddish = "yi",
    Yoruba = "yo",
    Zulu = "zu",
}

// Mapping between Language Codes and Language Names
export const languageNameMap: { [key in LanguageCode]: string } = {
    [LanguageCode.Afrikaans]: "Afrikaans",
    [LanguageCode.Albanian]: "Albanian",
    [LanguageCode.Amharic]: "Amharic",
    [LanguageCode.Arabic]: "Arabic",
    [LanguageCode.Armenian]: "Armenian",
    [LanguageCode.Assamese]: "Assamese",
    [LanguageCode.Aymara]: "Aymara",
    [LanguageCode.Azerbaijani]: "Azerbaijani",
    [LanguageCode.Bambara]: "Bambara",
    [LanguageCode.Basque]: "Basque",
    [LanguageCode.Belarusian]: "Belarusian",
    [LanguageCode.Bengali]: "Bengali",
    [LanguageCode.Bhojpuri]: "Bhojpuri",
    [LanguageCode.Bosnian]: "Bosnian",
    [LanguageCode.Bulgarian]: "Bulgarian",
    [LanguageCode.Catalan]: "Catalan",
    [LanguageCode.Cebuano]: "Cebuano",
    [LanguageCode.ChineseSimplified]: "Chinese (Simplified)",
    [LanguageCode.ChineseTraditional]: "Chinese (Traditional)",
    [LanguageCode.Corsican]: "Corsican",
    [LanguageCode.Croatian]: "Croatian",
    [LanguageCode.Czech]: "Czech",
    [LanguageCode.Danish]: "Danish",
    [LanguageCode.Dhivehi]: "Dhivehi",
    [LanguageCode.Dogri]: "Dogri",
    [LanguageCode.Dutch]: "Dutch",
    [LanguageCode.English]: "English",
    [LanguageCode.Esperanto]: "Esperanto",
    [LanguageCode.Estonian]: "Estonian",
    [LanguageCode.Ewe]: "Ewe",
    [LanguageCode.FilipinoTagalog]: "Filipino (Tagalog)",
    [LanguageCode.Finnish]: "Finnish",
    [LanguageCode.French]: "French",
    [LanguageCode.Frisian]: "Frisian",
    [LanguageCode.Galician]: "Galician",
    [LanguageCode.Georgian]: "Georgian",
    [LanguageCode.German]: "German",
    [LanguageCode.Greek]: "Greek",
    [LanguageCode.Guarani]: "Guarani",
    [LanguageCode.Gujarati]: "Gujarati",
    [LanguageCode.HaitianCreole]: "Haitian Creole",
    [LanguageCode.Hausa]: "Hausa",
    [LanguageCode.Hawaiian]: "Hawaiian",
    [LanguageCode.Hebrew]: "Hebrew",
    [LanguageCode.Hindi]: "Hindi",
    [LanguageCode.Hmong]: "Hmong",
    [LanguageCode.Hungarian]: "Hungarian",
    [LanguageCode.Icelandic]: "Icelandic",
    [LanguageCode.Igbo]: "Igbo",
    [LanguageCode.Ilocano]: "Ilocano",
    [LanguageCode.Indonesian]: "Indonesian",
    [LanguageCode.Irish]: "Irish",
    [LanguageCode.Italian]: "Italian",
    [LanguageCode.Japanese]: "Japanese",
    [LanguageCode.Javanese]: "Javanese",
    [LanguageCode.Kannada]: "Kannada",
    [LanguageCode.Kazakh]: "Kazakh",
    [LanguageCode.Khmer]: "Khmer",
    [LanguageCode.Kinyarwanda]: "Kinyarwanda",
    [LanguageCode.Konkani]: "Konkani",
    [LanguageCode.Korean]: "Korean",
    [LanguageCode.Krio]: "Krio",
    [LanguageCode.Kurdish]: "Kurdish",
    [LanguageCode.KurdishSorani]: "Kurdish (Sorani)",
    [LanguageCode.Kyrgyz]: "Kyrgyz",
    [LanguageCode.Lao]: "Lao",
    [LanguageCode.Latin]: "Latin",
    [LanguageCode.Latvian]: "Latvian",
    [LanguageCode.Lingala]: "Lingala",
    [LanguageCode.Lithuanian]: "Lithuanian",
    [LanguageCode.Luganda]: "Luganda",
    [LanguageCode.Luxembourgish]: "Luxembourgish",
    [LanguageCode.Macedonian]: "Macedonian",
    [LanguageCode.Maithili]: "Maithili",
    [LanguageCode.Malagasy]: "Malagasy",
    [LanguageCode.Malay]: "Malay",
    [LanguageCode.Malayalam]: "Malayalam",
    [LanguageCode.Maltese]: "Maltese",
    [LanguageCode.Maori]: "Maori",
    [LanguageCode.Marathi]: "Marathi",
    [LanguageCode.MeiteilonManipuri]: "Meiteilon (Manipuri)",
    [LanguageCode.Mizo]: "Mizo",
    [LanguageCode.Mongolian]: "Mongolian",
    [LanguageCode.Burmese]: "Myanmar (Burmese)",
    [LanguageCode.Nepali]: "Nepali",
    [LanguageCode.Norwegian]: "Norwegian",
    [LanguageCode.Nyanja]: "Nyanja (Chichewa)",
    [LanguageCode.Odia]: "Odia (Oriya)",
    [LanguageCode.Oromo]: "Oromo",
    [LanguageCode.Pashto]: "Pashto",
    [LanguageCode.Persian]: "Persian",
    [LanguageCode.Polish]: "Polish",
    [LanguageCode.Portuguese]: "Portuguese (Portugal, Brazil)",
    [LanguageCode.Punjabi]: "Punjabi",
    [LanguageCode.Quechua]: "Quechua",
    [LanguageCode.Romanian]: "Romanian",
    [LanguageCode.Russian]: "Russian",
    [LanguageCode.Samoan]: "Samoan",
    [LanguageCode.Sanskrit]: "Sanskrit",
    [LanguageCode.ScotsGaelic]: "Scots Gaelic",
    [LanguageCode.Sepedi]: "Sepedi",
    [LanguageCode.Serbian]: "Serbian",
    [LanguageCode.Sesotho]: "Sesotho",
    [LanguageCode.Shona]: "Shona",
    [LanguageCode.Sindhi]: "Sindhi",
    [LanguageCode.Sinhala]: "Sinhala (Sinhalese)",
    [LanguageCode.Slovak]: "Slovak",
    [LanguageCode.Slovenian]: "Slovenian",
    [LanguageCode.Somali]: "Somali",
    [LanguageCode.Spanish]: "Spanish",
    [LanguageCode.Sundanese]: "Sundanese",
    [LanguageCode.Swahili]: "Swahili",
    [LanguageCode.Swedish]: "Swedish",
    [LanguageCode.Tagalog]: "Tagalog (Filipino)",
    [LanguageCode.Tajik]: "Tajik",
    [LanguageCode.Tamil]: "Tamil",
    [LanguageCode.Tatar]: "Tatar",
    [LanguageCode.Telugu]: "Telugu",
    [LanguageCode.Thai]: "Thai",
    [LanguageCode.Tigrinya]: "Tigrinya",
    [LanguageCode.Tsonga]: "Tsonga",
    [LanguageCode.Turkish]: "Turkish",
    [LanguageCode.Turkmen]: "Turkmen",
    [LanguageCode.Twi]: "Twi (Akan)",
    [LanguageCode.Ukrainian]: "Ukrainian",
    [LanguageCode.Urdu]: "Urdu",
    [LanguageCode.Uyghur]: "Uyghur",
    [LanguageCode.Uzbek]: "Uzbek",
    [LanguageCode.Vietnamese]: "Vietnamese",
    [LanguageCode.Welsh]: "Welsh",
    [LanguageCode.Xhosa]: "Xhosa",
    [LanguageCode.Yiddish]: "Yiddish",
    [LanguageCode.Yoruba]: "Yoruba",
    [LanguageCode.Zulu]: "Zulu",
};

const languageAliases: Partial<Record<LanguageCode, string[]>> = {
    [LanguageCode.Arabic]: ["arabic", "arabe", "árabe"],
    [LanguageCode.ChineseSimplified]: ["chinese", "chino", "mandarin"],
    [LanguageCode.English]: ["english", "ingles", "inglés"],
    [LanguageCode.French]: ["french", "frances", "francés"],
    [LanguageCode.German]: ["german", "aleman", "alemán"],
    [LanguageCode.Italian]: ["italian", "italiano"],
    [LanguageCode.Japanese]: ["japanese", "japones", "japonés"],
    [LanguageCode.Portuguese]: ["portuguese", "portugues", "portugués"],
    [LanguageCode.Spanish]: ["spanish", "espanol", "español"],
};

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Utility function to get a language code by its name.
 * @param languageName - The language name (e.g., "Spanish", "French")
 * @returns - The corresponding language code, or undefined if not found
 */
export function getLanguageCodeByName(
    languageName: string
): LanguageCode | undefined {
    const normalizedLanguageName = normalizeText(languageName);

    for (const [code, name] of Object.entries(languageNameMap)) {
        if (normalizeText(name) === normalizedLanguageName) {
            return code as LanguageCode;
        }
    }

    for (const [code, aliases] of Object.entries(languageAliases)) {
        if (
            aliases?.some(
                (alias) => normalizeText(alias) === normalizedLanguageName
            )
        ) {
            return code as LanguageCode;
        }
    }

    return undefined;
}

/**
 * Detects a language change command in the given text, and returns the language mentioned.
 * @param text
 * @returns
 */
export function detectLanguageChangeCommand(text: string): LanguageCode | null {
    const normalizedText = normalizeText(text);

    const commandKeywords = [
        "add",
        "also",
        "change",
        "idioma",
        "language",
        "set",
        "switch",
        "translate",
        "traduce",
        "traducir",
        "traduzca",
        "update",
    ];

    const containsCommand = commandKeywords.some((keyword) =>
        normalizedText.includes(keyword)
    );
    if (!containsCommand) return null;

    return findLanguageInText(text);
}

/**
 * Searches for a LanguageCode in the given text, and returns it if found.
 * @param text
 * @returns
 */
export function findLanguageInText(text: string): LanguageCode | null {
    const normalizedText = ` ${normalizeText(text)} `;

    for (const [code, aliases] of Object.entries(languageAliases)) {
        if (
            aliases?.some((alias) =>
                normalizedText.includes(` ${normalizeText(alias)} `)
            )
        ) {
            return code as LanguageCode;
        }
    }

    for (const [code, language] of Object.entries(languageNameMap)) {
        const normalizedLanguage = normalizeText(language);
        const normalizedLanguageWords = normalizedLanguage.split(" ");

        if (
            normalizedLanguageWords.some((word) =>
                normalizedText.includes(` ${word} `)
            )
        ) {
            return code as LanguageCode;
        }
    }

    return null;
}
