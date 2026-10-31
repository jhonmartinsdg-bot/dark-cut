import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

describe("Auth routing", () => {
  it("puts the editor behind the sign-in gate", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const ids = router.matchRoutes("/editor").map((m) => m.routeId);
    expect(ids).toContain("/_authenticated");
  });
});
