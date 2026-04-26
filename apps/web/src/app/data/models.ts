export interface ModelDirectoryItem {
  id: string;
  name: string;
  company: string;
  availability: 'Proprietary' | 'Open-weight';
  parameters: string;
  contextWindow: string;
  released: string;
  bestFor: string;
  description: string;
  websiteUrl: string;
  logoPath: string;
  isFeatured?: boolean;
}

export const modelDirectory: ModelDirectoryItem[] = [
  {
    id: 'gpt-5',
    name: 'GPT-5',
    company: 'OpenAI',
    availability: 'Proprietary',
    parameters: 'Not disclosed',
    contextWindow: '400K tokens',
    released: 'Aug 2025',
    bestFor: 'Coding, reasoning, agentic tasks',
    description:
      'OpenAI\'s flagship reasoning model for coding, analysis, and tool-heavy workflows.',
    websiteUrl: 'https://openai.com/gpt-5/',
    logoPath: '/logos/sources/openai.svg',
    isFeatured: true,
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    company: 'Anthropic',
    availability: 'Proprietary',
    parameters: 'Not disclosed',
    contextWindow: '1M tokens (beta)',
    released: 'Feb 2026',
    bestFor: 'Long-context reasoning, coding, computer use',
    description:
      'Anthropic\'s latest Sonnet model focused on strong coding, planning, and long-context work.',
    websiteUrl: 'https://www.anthropic.com/news/claude-sonnet-4-6',
    logoPath: '/logos/sources/Claude.svg',
    isFeatured: true,
  },
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    company: 'Google',
    availability: 'Proprietary',
    parameters: 'Not disclosed',
    contextWindow: '1,048,576 input tokens',
    released: 'Jun 2025',
    bestFor: 'Complex multimodal reasoning, code, large documents',
    description:
      'Google\'s state-of-the-art thinking model for multimodal reasoning, long context, and developer workflows.',
    websiteUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini-v2',
    logoPath: '/logos/sources/Gemini.svg',
    isFeatured: true,
  },
  {
    id: 'grok-4-20',
    name: 'Grok 4.20',
    company: 'xAI',
    availability: 'Proprietary',
    parameters: 'Not disclosed',
    contextWindow: '2M tokens',
    released: 'Feb 2026',
    bestFor: 'High-speed reasoning, tool calling, search-grounded tasks',
    description:
      'xAI\'s newest flagship Grok model with very large context and built-in agentic tool support.',
    websiteUrl: 'https://docs.x.ai/developers/models?cluster=us-east-1',
    logoPath: '/logos/sources/Grok.svg',
    isFeatured: true,
  },
  {
    id: 'mistral-large-3',
    name: 'Mistral Large 3',
    company: 'Mistral AI',
    availability: 'Open-weight',
    parameters: 'Not disclosed',
    contextWindow: 'General-purpose multimodal',
    released: 'Dec 2025',
    bestFor: 'Open-weight frontier multimodal apps',
    description:
      'Mistral\'s featured flagship open-weight multimodal model for general-purpose production use.',
    websiteUrl: 'https://docs.mistral.ai/getting-started/models/',
    logoPath: '/logos/sources/Mistral.svg',
  },
  {
    id: 'qwen3-235b-a22b',
    name: 'Qwen3-235B-A22B',
    company: 'Qwen',
    availability: 'Open-weight',
    parameters: '235B total / 22B active',
    contextWindow: '128K tokens',
    released: 'Apr 2025',
    bestFor: 'Reasoning, math, coding, multilingual work',
    description:
      'Qwen\'s flagship open-weight MoE model aimed at frontier reasoning and multilingual performance.',
    websiteUrl: 'https://qwenlm.github.io/blog/qwen3/',
    logoPath: '/logos/sources/Qwen.svg',
  },
  {
    id: 'command-a',
    name: 'Command A',
    company: 'Cohere',
    availability: 'Proprietary',
    parameters: '111B',
    contextWindow: '256K tokens',
    released: 'Mar 2025',
    bestFor: 'Enterprise agents, RAG, multilingual tool use',
    description:
      'Cohere\'s largest Command model built for enterprise agents, retrieval, and structured outputs.',
    websiteUrl: 'https://docs.cohere.com/v1/docs/models/command',
    logoPath: '/logos/sources/Cohere.svg',
  },
  {
    id: 'smollm3-3b',
    name: 'SmolLM3-3B',
    company: 'Hugging Face',
    availability: 'Open-weight',
    parameters: '3B',
    contextWindow: '128K tokens',
    released: 'Jul 2025',
    bestFor: 'Efficient local use, multilingual reasoning, long context',
    description:
      'A compact open model from Hugging Face focused on efficient deployment with strong long-context reasoning.',
    websiteUrl: 'https://huggingface.co/blog/smollm3',
    logoPath: '/logos/sources/Huggingface.svg',
  },
];
