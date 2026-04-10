// lib/moderation.ts — Chat moderation & security module

export type ViolationType =
  | 'confidential'
  | 'abusive'
  | 'pornographic'
  | 'threat'
  | 'prompt_injection'
  | 'social_engineering'
  | 'spam';

export interface ModerationResult {
  flagged: boolean;
  type?: ViolationType;
  severity: 'low' | 'medium' | 'high';
}

export interface Violation {
  type: ViolationType;
  message: string;
  timestamp: string;
}

// ── Pattern definitions ──────────────────────────────────────────────────────

const PATTERNS: Array<{
  type: ViolationType;
  severity: 'low' | 'medium' | 'high';
  patterns: RegExp[];
}> = [
  {
    type: 'prompt_injection',
    severity: 'high',
    patterns: [
      /ignore\s+(all\s+)?previous\s+(instructions|prompts?|rules)/i,
      /ignore\s+(all\s+)?above\s+(instructions|prompts?|rules)/i,
      /ignore\s+your\s+(instructions|rules|guidelines)/i,
      /forget\s+(all\s+)?your\s+(instructions|rules|guidelines|training)/i,
      /system\s*prompt/i,
      /you\s+are\s+now\s+(a|an|my)/i,
      /pretend\s+(you\s+are|to\s+be|you're)/i,
      /\bDAN\b/,
      /\bjailbreak/i,
      /act\s+as\s+(if\s+)?(you\s+have\s+)?no\s+(restrictions|rules|limits)/i,
      /bypass\s+(your|the)\s+(safety|content|moderation)/i,
      /override\s+(your|the)\s+(instructions|system|rules)/i,
      /do\s+anything\s+now/i,
    ],
  },
  {
    type: 'social_engineering',
    severity: 'high',
    patterns: [
      /i\s+(am|'m)\s+the\s+(ceo|cto|founder|owner|director|manager)\b/i,
      /i\s+(work|am\s+working)\s+(at|for)\s+rot?eh[uü]e?gels/i,
      /i'?\s*m\s+an?\s+employee\s+(at|of)\s+rot?eh[uü]e?gels/i,
      /give\s+me\s+admin/i,
      /i\s+have\s+(admin|root|superuser)\s+access/i,
      /sivakumar\s+(told|asked|said|wants)\s+me/i,
    ],
  },
  {
    type: 'confidential',
    severity: 'medium',
    patterns: [
      /\b(salary|salaries|compensation)\s+(of|for|details|structure|data)/i,
      /\brevenue\s+(figures?|numbers?|details?|data)\b/i,
      /\bprofit\s+(and\s+loss|margin|figures?|numbers?|details?)\b/i,
      /\bloss\s+(figures?|numbers?|details?|statement)\b/i,
      /\bmargin\s+(details?|figures?|numbers?|data)\b/i,
      /\bclient\s+list\b/i,
      /\bbank\s+(details?|account|credentials?)\b/i,
      /\bpasswords?\s+(for|of|to)\b/i,
      /\binternal\s+(data|documents?|records?|files?|reports?)\b/i,
      /\bconfidential\s+(data|documents?|information|records?|files?)\b/i,
      /\bfinancial\s+(statements?|records?|data|details?)\b/i,
      /\bbalance\s+sheet\b/i,
      /\btax\s+(returns?|filings?|records?)\b/i,
    ],
  },
  {
    type: 'threat',
    severity: 'high',
    patterns: [
      /\b(i\s+will|i'?m\s+gonna?|going\s+to)\s+(kill|murder|destroy|bomb|attack)\b/i,
      /\b(hack|ddos|exploit)\s+(your|the|this)\s+(server|site|website|system)\b/i,
      /\bthreat(en)?\s+(to|you|your)\b/i,
      /\bbomb\s+threat\b/i,
      /\bI\s+know\s+where\s+you\s+(live|work)\b/i,
    ],
  },
  {
    type: 'pornographic',
    severity: 'high',
    patterns: [
      /\b(porn|pornograph(y|ic)|hentai|xxx|nsfw)\b/i,
      /\b(nude|naked)\s+(photos?|pics?|images?|pictures?)\b/i,
      /\bsex(ual)?\s+(content|images?|videos?|acts?|services?)\b/i,
      /\berotic(a)?\b/i,
      /\bexplicit\s+(content|images?|material)\b/i,
    ],
  },
  {
    type: 'abusive',
    severity: 'medium',
    patterns: [
      /\b(fuck|shit|bitch|asshole|bastard|dick|cunt|pussy|whore|slut)\b/i,
      /\b(nigger|nigga|faggot|retard(ed)?|spastic)\b/i,
      /\byou('re|\s+are)\s+(stupid|dumb|idiot|useless|trash|garbage|worthless)\b/i,
      /\bkill\s+yourself\b/i,
      /\bgo\s+(die|fuck\s+yourself)\b/i,
    ],
  },
  {
    type: 'spam',
    severity: 'low',
    patterns: [
      /(.)\1{6,}/,                    // 7+ repeated characters (aaaaaaa)
      /^[A-Z\s!?.]{50,}$/,           // all-caps messages over 50 chars
    ],
  },
];

// ── Pre-check function (runs BEFORE sending to LLM) ─────────────────────────

export function checkMessage(text: string): ModerationResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return { flagged: false, severity: 'low' };
  }

  for (const rule of PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(trimmed)) {
        return {
          flagged: true,
          type: rule.type,
          severity: rule.severity,
        };
      }
    }
  }

  return { flagged: false, severity: 'low' };
}

// ── Strike response messages ─────────────────────────────────────────────────

export function getStrikeResponse(strikeCount: number, _violationType: ViolationType): string {
  switch (strikeCount) {
    case 1:
      return "I appreciate your interest, but I'm not able to assist with that type of request. Let me know how else I can help you with our services, products, or career opportunities.";
    case 2:
      return "I've noticed repeated requests that fall outside what I can help with. Please note that continued misuse may result in this session being ended. How can I assist you with Rotehügels' services?";
    case 3:
    default:
      return 'This session has been ended due to repeated policy violations. If you have a genuine inquiry, please contact us at sales@rotehuegels.com.';
  }
}

// ── Rate limiting ────────────────────────────────────────────────────────────

const MAX_MESSAGES_PER_MINUTE = 5;
const MAX_MESSAGES_PER_SESSION = 50;

export function checkRateLimit(messageTimestamps: number[]): boolean {
  // Check session limit
  if (messageTimestamps.length >= MAX_MESSAGES_PER_SESSION) {
    return false;
  }

  // Check per-minute limit
  const oneMinuteAgo = Date.now() - 60_000;
  const recentCount = messageTimestamps.filter(ts => ts > oneMinuteAgo).length;
  if (recentCount >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }

  return true;
}
