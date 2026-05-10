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

function DatenschutzRoute() {
  return (
    <LegalPage
      title="Datenschutzerklärung für den KI-Chatbot"
      description="Die Datenschutzseite ist auf die neue App-Struktur umgezogen und kann jetzt inhaltlich weiter ausgebaut werden."
    >
      <div className="mt-8 rounded-box border border-dashed border-base-300 bg-base-200 p-5 text-sm leading-7 text-base-content/70">
        Als nächster Schritt kann der finale Rechtstext übernommen werden, ohne die alte
        React-Router- oder MUI-Struktur weiter mitschleppen zu müssen.
      </div>
    </LegalPage>
  );
}
