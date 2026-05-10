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

function ImpressumRoute() {
  return (
    <LegalPage
      title="Impressum"
      description="Die rechtlichen Informationen werden im neuen Routing- und Layout-System vorbereitet."
    >
      <div className="mt-8 rounded-box border border-dashed border-base-300 bg-base-200 p-5 text-sm leading-7 text-base-content/70">
        Diese Route ist bereits auf TanStack Router, Tailwind CSS und daisyUI umgestellt. Der
        eigentliche Seiteninhalt kann jetzt ohne MUI-Abhangigkeiten vervollstandigt werden.
      </div>
    </LegalPage>
  );
}
