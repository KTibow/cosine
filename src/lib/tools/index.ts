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

export const tools: Record<string, Tool> = {
  eval_code,
};

export const toolDefinitions = Object.values(tools).map((tool) => tool.definition);
