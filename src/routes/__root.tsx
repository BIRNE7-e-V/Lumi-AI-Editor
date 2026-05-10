import {
  HeadContent,
  Outlet,
  createRootRoute,
  redirect,
} from "@tanstack/react-router";

import { AppShell } from "@components/layout/app-shell";
import { AppStateProvider } from "@state";
import { RouteErrorScreen } from "@components/routing/error-screen";
import { NotFoundScreen } from "@components/routing/not-found-screen";
import { ThemeModeProvider } from "@components/theme/theme-mode-provider";
import { buildTitle } from "@lib/app-config";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  beforeLoad: (ctx) => {
    const params = new URLSearchParams(ctx.location.search);
    const token = params.get("apikey");
    if (token) {
      localStorage.setItem("api_token", JSON.stringify(token));
      params.delete("apikey");
      const cleanSearch = params.toString();
      throw redirect({
        to: ctx.location.pathname + (cleanSearch ? `?${cleanSearch}` : ""),
        replace: true,
      });
    }
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: buildTitle(),
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootLayout,
  errorComponent: RouteErrorScreen,
  notFoundComponent: NotFoundScreen,
});

function RootLayout() {
  return (
    <>
      <HeadContent />
      <ThemeModeProvider>
        <AppStateProvider>
          <AppShell>
            <Outlet />
          </AppShell>
        </AppStateProvider>
      </ThemeModeProvider>
    </>
  );
}
