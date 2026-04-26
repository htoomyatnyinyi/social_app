import { api } from "./api";

/**
 * RTK Query slice for calling MCP tools.
 * This bridges the standard mobile app API with the MCP toolset.
 */
export const mcpApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Call an MCP tool by name with arguments.
     * @example
     * const [callTool] = useCallMcpToolMutation();
     * const result = await callTool({ tool: "get_system_stats" }).unwrap();
     */
    callMcpTool: builder.mutation<any, { tool: string; arguments?: any }>({
      query: (body) => ({
        url: "/mcp/call",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useCallMcpToolMutation } = mcpApi;
