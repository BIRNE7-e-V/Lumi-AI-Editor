import { createFileRoute } from '@tanstack/react-router';

import { LegalPage } from '@components/layout/legal-page';
import { buildTitle } from '@lib/app-config';

export const Route = createFileRoute('/datenschutz')({
  head: () => ({
    meta: [
      {
        title: buildTitle('Datenschutz'),
      },
    ],
  }),
  component: DatenschutzRoute,
});

// eslint-disable-next-line react-refresh/only-export-components
function DatenschutzRoute() {
  return <LegalPage title="Datenschutzerklärung für den KI-Chatbot" description=""></LegalPage>;
}
