import { ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import { memo, useDeferredValue, useMemo, useRef } from 'react';

import { useEditorState } from '@state';
import type { Content } from '@state/lumi-editor/types';
import { getOrderedContent, hasMeaningfulContent } from '@components/editor/utils';

type PdfModules = {
  pdf: typeof import('@react-pdf/renderer').pdf;
  WorksheetPDF: typeof import('../editor/worksheet-pdf').WorksheetPDF;
};

function getDownloadFilename(title: string) {
  const normalized = title
    .trim()
    .replace(/[^\p{L}\p{N}_\s-]/gu, '')
    .replace(/\s+/g, '-');
  return `${normalized || 'arbeitsblatt'}.pdf`;
}

const EmptyPreview = memo(function EmptyPreview() {
  return (
    <div className="rounded-box bg-base-200/80 text-base-content/70 flex h-full items-center justify-center p-6 text-center text-sm leading-6">
      Noch kein Inhalt vorhanden. Nutze den Editor oder den KI-Assistenten, um das Arbeitsblatt
      aufzubauen.
    </div>
  );
});

function SectionHeading({ heading }: { heading?: string }) {
  if (!heading) return null;
  return <h2 className="text-base-content font-[Barlow] text-base font-bold">{heading}</h2>;
}

function ExerciseHeader({ heading, label }: { heading?: string; label: string }) {
  return (
    <div className="border-b border-accent/20 pb-2 mb-1 space-y-1">
      {heading ? (
        <h2 className="text-base-content font-[Barlow] text-base font-bold">{heading}</h2>
      ) : null}
      <span className="badge badge-accent text-xs font-semibold uppercase tracking-wide">
        Übung · {label}
      </span>
    </div>
  );
}

const PreviewItem = memo(function PreviewItem({ item }: { item: Content }) {
  if (item.type === 'text') {
    return (
      <section className="rounded-box border-base-300 bg-base-100 space-y-2 border p-4">
        <SectionHeading heading={item.heading} />
        <p className="text-base-content/80 leading-7 whitespace-pre-wrap">
          {item.text || '(Kein Text)'}
        </p>
      </section>
    );
  }

  if (item.type === 'multiple-choice') {
    return (
      <section className="rounded-box border-accent/30 bg-accent/5 space-y-3 border p-4">
        <ExerciseHeader heading={item.heading} label="Multiple Choice" />
        <p className="font-semibold">{item.question || '(Keine Frage)'}</p>
        <div className="space-y-2">
          {item.answers.map((answer, index) => (
            <label key={`${item.id}-preview-${index}`} className="flex items-center gap-3 text-sm">
              <input className="checkbox checkbox-sm checkbox-accent" type="checkbox" readOnly />
              <span>{answer.text || `Antwort ${index + 1}`}</span>
            </label>
          ))}
        </div>
      </section>
    );
  }

  if (item.type === 'fill-in-the-blanks') {
    return (
      <section className="rounded-box border-accent/30 bg-accent/5 space-y-3 border p-4">
        <ExerciseHeader heading={item.heading} label="Lückentext" />
        <p className="text-base-content/80 leading-7 whitespace-pre-wrap">
          {item.text || '(Lückentext folgt)'}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-box border-accent/30 bg-accent/5 space-y-4 border p-4">
      <ExerciseHeader heading={item.heading} label="Freitext" />
      <p className="text-base-content/80 leading-7">{item.task || '(Freitextaufgabe folgt)'}</p>
      <div className="space-y-2 pt-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`${item.id}-line-${index}`} className="bg-base-300/70 h-4 rounded-full" />
        ))}
      </div>
    </section>
  );
});

export const PreviewSidebar = memo(function PreviewSidebar() {
  const editor = useEditorState();
  const pdfModulesRef = useRef<PdfModules | null>(null);
  const orderedContent = useMemo(
    () => getOrderedContent(editor.content, editor.structure),
    [editor.content, editor.structure]
  );
  const deferredTitle = useDeferredValue(editor.title);
  const deferredContent = useDeferredValue(orderedContent);
  const hasContent = hasMeaningfulContent(deferredTitle, deferredContent);

  const preloadPdf = () => {
    if (pdfModulesRef.current) {
      return;
    }

    void Promise.all([import('@react-pdf/renderer'), import('../editor/worksheet-pdf')]).then(
      ([{ pdf }, { WorksheetPDF }]) => {
        pdfModulesRef.current = { pdf, WorksheetPDF };
      }
    );
  };

  const loadPdfModules = async (): Promise<PdfModules> => {
    if (pdfModulesRef.current) {
      return pdfModulesRef.current;
    }

    const [{ pdf }, { WorksheetPDF }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../editor/worksheet-pdf'),
    ]);
    pdfModulesRef.current = { pdf, WorksheetPDF };
    return pdfModulesRef.current;
  };

  const handlePdfDownload = async () => {
    if (!hasContent) {
      return;
    }

    try {
      const { pdf, WorksheetPDF } = await loadPdfModules();
      const blob = await pdf(
        <WorksheetPDF content={orderedContent} title={editor.title} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = getDownloadFilename(editor.title);
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF-Download fehlgeschlagen:', error);
    }
  };

  return (
    <aside className="bg-base-100 flex h-full min-h-0 flex-col overflow-hidden shadow-sm">
      <header className="border-base-300 border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-box bg-accent/10 text-accent p-2">
            <EyeIcon className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Vorschau</h2>
            <p className="text-base-content/60 text-xs">Schnelle Lesefassung und PDF-Export.</p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {!hasContent ? (
          <EmptyPreview />
        ) : (
          <div className="rounded-box bg-base-200/80 space-y-4 p-4">
            {deferredTitle ? (
              <div className="rounded-box border-base-300 bg-base-100 border px-5 py-4">
                <h1 className="text-base-content font-[Barlow] text-2xl font-bold">
                  {deferredTitle}
                </h1>
              </div>
            ) : null}
            {deferredContent.map((item) => (
              <PreviewItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <div className="border-base-300 shrink-0 border-t px-5 py-4">
        <button
          className="btn btn-primary btn-lg w-full gap-2"
          disabled={!hasContent}
          type="button"
          onClick={() => {
            void handlePdfDownload();
          }}
          onMouseEnter={preloadPdf}
        >
          <ArrowDownTrayIcon className="size-4" />
          {'Als PDF herunterladen'}
        </button>
      </div>
    </aside>
  );
});
