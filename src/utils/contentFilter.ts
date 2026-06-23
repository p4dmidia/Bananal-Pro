/**
 * Utilitário de validação e moderação de conteúdo (comunidade e comentários)
 */

// Lista de termos ofensivos comuns (em português)
const PROFANITY_WORDS = [
  "porra",
  "caralho",
  "puta",
  "fdp",
  "viado",
  "foder",
  "fodase",
  "foda-se",
  "arrombado",
  "corno",
  "cacete",
  "bosta",
  "merda",
  "cuzao",
  "cuzão",
  "pinto",
  "buceta",
  "vagabunda",
  "piranha",
  "desgraca",
  "desgraça",
  "filho da puta",
  "filha da puta",
  "putaria"
];

// Domínios seguros permitidos (whitelist)
const ALLOWED_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "drive.google.com",
  "docs.google.com",
  "google.com",
  "bananalpro.com.br",
  "localhost",
  "127.0.0.1"
];

/**
 * Normaliza o texto removendo acentos e convertendo para minúsculas
 */
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Extrai o hostname de uma URL encontrada no texto
 */
function getHostname(urlStr: string): string {
  try {
    let cleanUrl = urlStr.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "http://" + cleanUrl;
    }
    const url = new URL(cleanUrl);
    // Remove o "www." se existir para simplificar
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch (e) {
    // Caso de URL incompleta ou inválida, tenta extrair por regex simples
    const match = urlStr.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
    return match ? match[1].toLowerCase() : "";
  }
}

interface FilterResult {
  isValid: boolean;
  reason: "profanity" | "links" | null;
  blockedTerm?: string;
}

/**
 * Valida se um texto contém palavrões ou links não permitidos
 */
export function validateContent(text: string, customBlockedWords?: string[]): FilterResult {
  if (!text) return { isValid: true, reason: null };

  const normalized = normalizeText(text);

  // Combina lista padrão com termos customizados
  const allProfanity = customBlockedWords && customBlockedWords.length > 0
    ? [...PROFANITY_WORDS, ...customBlockedWords]
    : PROFANITY_WORDS;

  // 1. Validar termos ofensivos (profanity)
  for (const word of allProfanity) {
    const trimmedWord = word.trim();
    if (!trimmedWord) continue;

    const normalizedWord = normalizeText(trimmedWord);
    
    // Expressão regular dinâmica com \b para pegar apenas a palavra inteira isolada
    const regex = new RegExp(`\\b${normalizedWord}\\b`, "i");
    if (regex.test(normalized)) {
      return {
        isValid: false,
        reason: "profanity",
        blockedTerm: trimmedWord
      };
    }
  }

  // 2. Validar links (qualquer URL iniciada por http/https ou www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const matches = text.match(urlRegex);

  if (matches) {
    for (const match of matches) {
      const hostname = getHostname(match);
      
      // Verifica se o hostname está na lista branca ou termina com algum domínio da lista
      const isAllowed = ALLOWED_DOMAINS.some(domain => {
        return hostname === domain || hostname.endsWith("." + domain);
      });

      if (!isAllowed) {
        return {
          isValid: false,
          reason: "links",
          blockedTerm: match
        };
      }
    }
  }

  return { isValid: true, reason: null };
}
