import { createFileRoute } from "@tanstack/react-router";
import { handleKiwifyWebhook } from "@/lib/kiwify-webhook";

export const Route = createFileRoute("/api/public/kiwify-webhook")({
  server: {
    handlers: {
      POST: ({ request }) => handleKiwifyWebhook(request),
    },
  },
});
