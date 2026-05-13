import { createFileRoute } from '@tanstack/react-router';

import { LegalPage } from '@components/layout/legal-page';
import { buildTitle } from '@lib/app-config';

export const Route = createFileRoute('/impressum')({
  head: () => ({
    meta: [
      {
        title: buildTitle('Impressum'),
      },
    ],
  }),
  component: ImpressumRoute,
});

// eslint-disable-next-line react-refresh/only-export-components
function ImpressumRoute() {
  return <LegalPage title="Impressum" description=""></LegalPage>;
}
