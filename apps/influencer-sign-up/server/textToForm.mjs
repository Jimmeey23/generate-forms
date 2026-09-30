import OpenAI from 'openai';

export const FIELD_TYPES = ['text', 'email', 'tel', 'number', 'textarea', 'date', 'datetime', 'select', 'radio', 'checkbox', 'multiselect', 'url', 'rating', 'readonly'];
const OPTION_TYPES = ['select', 'radio', 'checkbox', 'multiselect'];

export const openAiConfigured = () => Boolean(process.env.OPENAI_API_KEY);

const SYSTEM_PROMPT = `You turn a plain-English description of a sign-up form into a JSON field schema.

Return ONLY JSON matching:
{
  "title": string,
  "description": string,
  "signupType": "free" | "paid" | "kids" | "slots",
  "fields": [{
    "label": string,
    "type": one of ${FIELD_TYPES.join(' | ')},
    "required": boolean,
    "placeholder": string,
    "helperText": string,
    "options": string[],
    "gridCol": "half" | "full"
  }]
}

Rules:
- First name, last name, email and phone are ALWAYS collected by the platform. Never include them.
- Only include fields the description actually asks for.
- ${OPTION_TYPES.join('/')} fields must have at least two options.
- Use "multiselect" when someone may pick several, "select" for one of many, "radio" for one of a few.
- Use "datetime" for a specific date AND time, "date" for a day only.
- Use "readonly" for instructions or notices that need no answer; put the copy in helperText.
- Choose "slots" as signupType only if the description is about booking time slots.
- Keep labels short and in sentence case. Prefer gridCol "half" for short answers.`;

// Shape whatever came back into something the form builder can trust.
export function sanitizeFields(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 30).map((field) => {
    const label = String(field?.label || '').trim().slice(0, 200);
    if (!label) return null;
    const type = FIELD_TYPES.includes(field?.type) ? field.type : 'text';
    const options = Array.isArray(field?.options)
      ? [...new Set(field.options.map((option) => String(option).trim()).filter(Boolean))].slice(0, 50)
      : [];
    if (OPTION_TYPES.includes(type) && options.length < 2) return null;
    return {
      label, type,
      required: type !== 'readonly' && field?.required === true,
      placeholder: String(field?.placeholder || '').slice(0, 200),
      helperText: String(field?.helperText || '').slice(0, 300),
      gridCol: field?.gridCol === 'half' ? 'half' : 'full',
      ...(options.length ? { options } : {}),
    };
  }).filter(Boolean);
}

async function viaOpenAi(description) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: description.slice(0, 4000) },
    ],
  });
  const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
  return {
    title: String(parsed.title || '').slice(0, 200),
    description: String(parsed.description || '').slice(0, 600),
    signupType: ['free', 'paid', 'kids', 'slots'].includes(parsed.signupType) ? parsed.signupType : '',
    fields: sanitizeFields(parsed.fields),
    engine: 'openai',
  };
}

// ── Deterministic fallback ──
// Reads one field per line or per comma-separated clause. Not as forgiving as the
// model, but it never fails and needs no key.
const TYPE_HINTS = [
  [/^(please note|note|reminder|instructions?|important)\b/i, 'readonly'],
  [/\b(e-?mail)\b/i, 'email'],
  [/\b(phone|mobile|contact number|whatsapp)\b/i, 'tel'],
  [/\b(date and time|date & time|datetime|when.*(arrive|come))\b/i, 'datetime'],
  [/\b(date|day|dob|birthday|birth date)\b/i, 'date'],
  [/\b(age|quantity|how many|number of|count)\b/i, 'number'],
  [/\b(website|url|link|instagram handle|profile)\b/i, 'url'],
  [/\b(rating|rate|score out of)\b/i, 'rating'],
  [/\b(notes?|comments?|message|anything else|tell us|describe)\b/i, 'textarea'],
];

function optionsFrom(line) {
  // "size (S/M/L)", "size: S, M, L", "choose from a, b or c"
  const bracket = line.match(/[(\[]([^)\]]+)[)\]]/);
  const after = line.includes(':') ? line.slice(line.indexOf(':') + 1) : '';
  const source = bracket?.[1] || after;
  if (!source) return [];
  const parts = source.split(/\s*(?:\/|,|\bor\b|\|)\s*/i).map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? [...new Set(parts)].slice(0, 50) : [];
}

export function parseDescription(description) {
  const text = String(description || '');
  // Commas separate clauses, but not inside "(S/M/L, XL)" — mask bracketed groups first.
  const masks = [];
  const masked = text.replace(/[(\[][^)\]]*[)\]]/g, (match) => {
    masks.push(match);
    return `\u0000${masks.length - 1}\u0000`;
  });
  const unmask = (value) => value.replace(/\u0000(\d+)\u0000/g, (_, index) => masks[Number(index)] || '');

  const clauses = masked
    .split(/[\n;,•]|\band\b/i)
    .map((clause) => unmask(clause).replace(/^[\s\-*\d.)]+/, '').trim())
    .filter(Boolean);

  const fields = [];
  for (const clause of clauses) {
    const line = clause.replace(/\.$/, '').trim();
    if (line.length < 2) continue;
    // Skip what the platform already collects, and preamble that asks for nothing.
    if (/\b(first name|last name|full name|e-?mail|phone|mobile)\b/i.test(line)) continue;
    const asks = /\b(ask|collect|capture|need|want|include|add|get|record|choose|select|pick|which|what|when|how|any|their|note|please)\b/i.test(line);
    if (!asks && !/[(\[:]/.test(line)) continue;

    const options = optionsFrom(line);
    let type = options.length ? (/\b(multiple|several|all that apply|any of)\b/i.test(line) ? 'multiselect' : 'select') : 'text';
    if (!options.length) {
      for (const [pattern, hinted] of TYPE_HINTS) {
        if (pattern.test(line)) { type = hinted; break; }
      }
    }

    // A clause may trail a scene-setting sentence ("Open house signup. Ask for ...");
    // only the last sentence describes the field.
    const lastSentence = line.split(/\.\s+/).pop() || line;
    let label = lastSentence.replace(/[(\[][^)\]]*[)\]]/g, '').split(':')[0]
      .replace(/^(please\s+)?(also\s+)?(collect|ask for|ask|add|include|capture|get|record|need)\s+/i, '')
      .replace(/^(their|the|a|an)\s+/i, '')
      .replace(/\s+/g, ' ').trim();
    if (type === 'readonly') label = line.split(':')[0].trim();
    if (!label || label.length > 80) continue;

    fields.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      type,
      required: type !== 'readonly' && !/\boptional\b/i.test(line),
      placeholder: '',
      helperText: type === 'readonly' ? unmask(line).split(':').slice(1).join(':').trim() || unmask(line) : '',
      gridCol: ['textarea', 'readonly', 'multiselect'].includes(type) ? 'full' : 'half',
      ...(options.length ? { options } : {}),
    });
  }
  const slots = /\b(slot|time slot|booking window|appointment)\b/i.test(text);
  return {
    title: '', description: '',
    signupType: slots ? 'slots' : '',
    fields: sanitizeFields(fields),
    engine: 'parser',
  };
}

// Uses the model when a key is present, and always falls back rather than failing.
export async function describeToForm(description) {
  if (openAiConfigured()) {
    try {
      const result = await viaOpenAi(description);
      if (result.fields.length) return result;
      return { ...parseDescription(description), engine: 'parser', note: 'The model returned no usable fields.' };
    } catch (error) {
      return { ...parseDescription(description), engine: 'parser', note: `OpenAI call failed: ${String(error?.message || error).slice(0, 200)}` };
    }
  }
  return { ...parseDescription(description), note: 'OPENAI_API_KEY is not set, so the built-in parser was used.' };
}
