import { ingest } from "/lib/AIngest";
import exaSearch from "./exa-search.remote";

type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
};

type Tool<T = any> = ((params: T) => string | Promise<string>) & {
  definition: ToolDefinition;
};

const eval_code = ((params) => {
  let expression = params.expression;

  if (expression.includes("console.log")) {
    return "You aren't supposed to log data, you're supposed to return data.";
  }

  if (!expression.includes("return")) {
    return "You MUST explicitly return data.";
  }

  try {
    const result = new Function(expression)();
    if (typeof result == "object") {
      return `That equals ${JSON.stringify(result)}`;
    }
    if (result == undefined) {
      return "That returned nothing, are you remembering to return data?";
    }
    return `That equals ${result}`;
  } catch (e) {
    return `That expression has an error: ${e instanceof Error ? e.message : e}`;
  }
}) as Tool<{ expression: string }>;

eval_code.definition = {
  type: "function",
  function: {
    name: "eval_code",
    description:
      "Use JS as an internal step to help with math, puzzles, and data analysis. This won't automatically show the user the code you used.",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            "Write JS here. You must use `return` at the top level to return your answer.",
        },
      },
      required: ["expression"],
    },
  },
};

const web_search = (async (params) => {
  const desiredResults = params.numResults || 3;
  const bufferSize = Math.ceil(desiredResults * 0.5);

  const searchResults = await exaSearch({
    query: params.query,
    numResults: desiredResults + bufferSize,
    category: params.category,
  });

  if (searchResults.length == 0) {
    return "No results found for this query.";
  }

  const maxTokens = params.maxTokens || 20000;
  const charsPerResult = Math.floor((maxTokens * 4) / desiredResults);

  const ingestions = searchResults.map(async (result) => {
    let url = result.url;

    // Convert arXiv abstract URLs to PDF URLs
    if (url.startsWith("https://arxiv.org/abs/")) {
      url = url.replace("https://arxiv.org/abs/", "https://arxiv.org/pdf/") + ".pdf";
    }

    try {
      const { text } = await ingest(url, result.title, "exa");
      const preview = text.slice(0, charsPerResult);
      return {
        status: "fulfilled" as const,
        result,
        content: preview,
        truncated: text.length > charsPerResult,
      };
    } catch (error) {
      return {
        status: "rejected" as const,
        result,
        reason: error,
      };
    }
  });

  const outcomes = [];
  for await (const outcome of ingestions) {
    outcomes.push(outcome);
    const successCount = outcomes.filter((o) => o.status === "fulfilled").length;
    if (successCount >= desiredResults) break;
  }

  return outcomes
    .map((outcome, i) => {
      const parts = [
        `## Result ${i + 1}: ${outcome.result.title}`,
        `**URL:** ${outcome.result.url}`,
      ];

      if (outcome.status == "rejected") {
        const error = outcome.reason;
        parts.push(`**Error:** ${error instanceof Error ? error.message : String(error)}`);
      } else {
        if (outcome.truncated) {
          parts.push(
            `**Note:** Content truncated (total budget: ${maxTokens} tokens across ${desiredResults} results)`,
          );
        }
        parts.push("", outcome.content);
      }

      return parts.join("\n");
    })
    .join("\n\n---\n\n");
}) as Tool<{
  query: string;
  numResults?: number;
  maxTokens?: number;
  category?: string;
}>;

web_search.definition = {
  type: "function",
  function: {
    name: "web_search",
    description:
      "Search the web using Exa and retrieve full content from each result. Returns results with title, URL, and ingested content.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant web pages.",
        },
        numResults: {
          type: "number",
          description: "Number of results to return (1-25). Defaults to 3.",
        },
        maxTokens: {
          type: "number",
          description:
            "Total token budget for all results combined. The budget is divided evenly across all results. Defaults to 20000 tokens.",
        },
        category: {
          type: "string",
          description:
            "Optional category to filter results ('company', 'research paper', 'news', 'github', 'tweet', 'movie', 'song', 'personal site', 'pdf').",
        },
      },
      required: ["query"],
    },
  },
};

export const tools: Record<string, Tool> = {
  eval_code,
  web_search,
};

export const toolDefinitions = Object.values(tools).map((tool) => tool.definition);
