export interface KeywordCounts {
  [keyword: string]: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: {
    name: string;
    url: string;
    type: 'twitter' | 'news' | 'github' | 'reddit';
    author?: string;
    authorAvatar?: string;
  };
  keywords: string[];
  timestamp: string; // ISO date
  metrics?: {
    likes?: number;
    retweets?: number;
    views?: string;
  };
}

export const mockData: NewsItem[] = [
  {
    id: "1",
    title: "OpenAI releases GPT-5 architecture overview, multimodal reasoning leaps forward",
    summary: "OpenAI just published the technical overview for GPT-5. The new architecture deeply integrates native multimodal understanding, achieving unprecedented accuracy not just in text, but in vision and audio processing. The model shows almost no attention loss in ultra-long contexts, with latency reduced by 40%.",
    source: {
      name: "Twitter",
      url: "https://twitter.com/OpenAI/status/gpt-5-announcement",
      type: "twitter",
      author: "@sama",
      authorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    keywords: ["GPT-5", "Multimodal", "OpenAI", "LLM"],
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    metrics: { likes: 145000, retweets: 32000, views: "4.5M" }
  },
  {
    id: "2",
    title: "Sora 2.0 Upgrade: Interactive physical world simulation & real-time editing",
    summary: "The latest video generation model Sora 2 now includes physics engine simulation capabilities. Users can adjust lighting, gravity, and object collision parameters in real-time within generated videos. This tech may completely revolutionize pre-production in game dev and the film industry.",
    source: {
      name: "TechCrunch",
      url: "https://techcrunch.com/2026/04/13/sora-2-physics-engine",
      type: "news",
      author: "Sarah Perez",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    keywords: ["Sora", "Video Generation", "Physics Simulation", "OpenAI"],
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    metrics: { likes: 2100 }
  },
  {
    id: "3",
    title: "Claude 4 Opus debuts, auto-regressive reasoning stuns developer community",
    summary: "Anthropic has released the new Claude 4 Opus. Its most notable feature is a built-in 'slow thinking' mode that uses a Tree of Thoughts for self-reflection, surpassing all existing benchmarks in complex math and coding tasks. Code generation accuracy nearly doubled.",
    source: {
      name: "Twitter",
      url: "https://twitter.com/AnthropicAI/status/claude-4",
      type: "twitter",
      author: "@DarioAmodei",
      authorAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    keywords: ["Claude 4", "Anthropic", "LLM", "Code Generation"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    metrics: { likes: 89000, retweets: 15000, views: "2.1M" }
  },
  {
    id: "4",
    title: "Meta open-sources Llama 4 Mobile, 7B model hits 50 token/s on smartphones",
    summary: "Continuing its open-source strategy, Meta dropped Llama 4 Mobile weights optimized specifically for edge devices. Through extreme 2-bit quantization and neural architecture search, it runs natively on the latest iPhone and Android flagships without sacrificing much common-sense reasoning.",
    source: {
      name: "Reddit /r/MachineLearning",
      url: "https://reddit.com/r/MachineLearning/comments/llama-4-mobile",
      type: "reddit",
      author: "u/LocalAI_Enthusiast"
    },
    keywords: ["Llama 4", "Meta", "Open Source", "Edge AI"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    metrics: { likes: 4500 }
  },
  {
    id: "5",
    title: "Devin gets major update: Fully automates enterprise microservice architecture",
    summary: "AI programmer Devin released its biggest update yet. It no longer just writes simple scripts; it can now automatically construct complete microservice architectures—including Docker containers, Kubernetes configs, and CI/CD pipelines—based on architecture diagrams, with over 85% success rate.",
    source: {
      name: "Twitter",
      url: "https://twitter.com/cognition_labs",
      type: "twitter",
      author: "@cognition_labs",
      authorAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    keywords: ["Devin", "AI Agent", "Auto-coding", "Microservices"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    metrics: { likes: 56000, retweets: 11000, views: "1.2M" }
  },
  {
    id: "6",
    title: "HuggingFace launches Agents Framework 2.0, lowering multi-agent dev barrier",
    summary: "Hugging Face released the next generation of its Agents framework. It provides a standardized API specification, allowing LLM agents from different vendors (like OpenAI, Anthropic, Cohere) to seamlessly communicate and collaborate on complex tasks.",
    source: {
      name: "GitHub",
      url: "https://github.com/huggingface/agents-2",
      type: "github",
      author: "huggingface"
    },
    keywords: ["HuggingFace", "AI Agent", "Multi-agent", "Open Source"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    metrics: { likes: 12000 }
  },
  {
    id: "7",
    title: "Study: LLM hallucination in multimodal tasks reduced by 60% via cross-verification",
    summary: "A new paper from the Stanford AI Lab proposes a 'Cross-Modal Verification' mechanism. When generating visual descriptions, the model simultaneously generates a reverse text-to-image prediction. By comparing the consistency of the two, hallucinations in multimodal models are significantly reduced.",
    source: {
      name: "arXiv",
      url: "https://arxiv.org/abs/2604.12345",
      type: "news",
      author: "Stanford AI Lab"
    },
    keywords: ["Research", "AI Hallucination", "Multimodal", "LLM"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    metrics: { likes: 340 }
  }
];