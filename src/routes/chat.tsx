import { createFileRoute } from "@tanstack/react-router";

import { ChatPage } from "@components/chat/chat-page";
import { buildTitle } from "@lib/app-config";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      {
        title: buildTitle("Chat"),
      },
    ],
  }),
  component: ChatPage,
});
