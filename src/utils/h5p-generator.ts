import { strToU8, unzipSync, zipSync } from 'fflate';

import type { Content, MultipleChoiceContent } from '@state/lumi-editor/types';

function uuid(): string {
  return crypto.randomUUID();
}

function makeAdvancedTextItem(text: string) {
  return {
    content: {
      params: { text: `<p>${text}</p>` },
      library: 'H5P.AdvancedText 1.1',
      metadata: {
        contentType: 'Text',
        license: 'U',
        title: text.slice(0, 40) || 'Text',
        authors: [],
        changes: [],
      },
      subContentId: uuid(),
    },
    useSeparator: 'auto',
  };
}

function makeMultiChoiceItem(item: MultipleChoiceContent) {
  return {
    content: {
      params: {
        question: `<p>${item.question}</p>`,
        answers: item.answers.map((answer) => ({
          correct: answer.correct,
          tipsAndFeedback: { tip: '', chosenFeedback: '', notChosenFeedback: '' },
          text: `<div>${answer.text}</div>`,
        })),
        overallFeedback: [{ from: 0, to: 100 }],
        behaviour: {
          enableRetry: true,
          enableSolutionsButton: true,
          enableCheckButton: true,
          type: 'auto',
          singlePoint: false,
          randomAnswers: false,
          showSolutionsRequiresInput: true,
          confirmCheckDialog: false,
          confirmRetryDialog: false,
          autoCheck: false,
          passPercentage: 100,
          showScorePoints: true,
        },
        UI: {
          checkAnswerButton: 'Überprüfen',
          submitAnswerButton: 'Absenden',
          showSolutionButton: 'Lösung anzeigen',
          tryAgainButton: 'Wiederholen',
          tipsLabel: 'Hinweis anzeigen',
          scoreBarLabel: 'Du hast :num von :total Punkten erreicht.',
          tipAvailable: 'Hinweis verfügbar',
          feedbackAvailable: 'Rückmeldung verfügbar',
          readFeedback: 'Rückmeldung vorlesen',
          wrongAnswer: 'Falsche Antwort',
          correctAnswer: 'Richtige Antwort',
          shouldCheck: 'Hätte gewählt werden müssen',
          shouldNotCheck: 'Hätte nicht gewählt werden sollen',
          noInput: 'Bitte antworte, bevor du die Lösung ansiehst',
          a11yCheck:
            'Die Antworten überprüfen. Die Auswahlen werden als richtig, falsch oder fehlend markiert.',
          a11yShowSolution:
            'Die Lösung anzeigen. Die richtigen Lösungen werden in der Aufgabe angezeigt.',
          a11yRetry:
            'Die Aufgabe wiederholen. Alle Versuche werden zurückgesetzt und die Aufgabe wird erneut gestartet.',
        },
        confirmCheck: {
          header: 'Beenden?',
          body: 'Ganz sicher beenden?',
          cancelLabel: 'Abbrechen',
          confirmLabel: 'Beenden',
        },
        confirmRetry: {
          header: 'Wiederholen?',
          body: 'Ganz sicher wiederholen?',
          cancelLabel: 'Abbrechen',
          confirmLabel: 'Bestätigen',
        },
      },
      library: 'H5P.MultiChoice 1.16',
      metadata: {
        contentType: 'Multiple Choice',
        license: 'U',
        title: item.question.slice(0, 40) || 'Multiple Choice',
        authors: [],
        changes: [],
        extraTitle: item.question.slice(0, 40) || 'Multiple Choice',
      },
      subContentId: uuid(),
    },
    useSeparator: 'auto',
  };
}

function contentItemToH5P(item: Content) {
  switch (item.type) {
    case 'text':
      return makeAdvancedTextItem(item.text);
    case 'multiple-choice':
      return makeMultiChoiceItem(item);
    case 'fill-in-the-blanks':
      return makeAdvancedTextItem(item.text);
    case 'freetext':
      return makeAdvancedTextItem(item.task);
  }
}

function buildContentJson(title: string, content: Content[]) {
  const chapterTitle = title.trim() || 'Seite 1';

  return {
    showCoverPage: false,
    bookCover: { coverDescription: '<p style="text-align:center"></p>' },
    chapters: [
      {
        params: {
          content: content.map(contentItemToH5P),
        },
        library: 'H5P.Column 1.18',
        subContentId: uuid(),
        metadata: {
          contentType: 'Column',
          license: 'U',
          title: chapterTitle,
          authors: [],
          changes: [],
          extraTitle: chapterTitle,
        },
      },
    ],
    behaviour: {
      baseColor: '#1768c4',
      defaultTableOfContents: true,
      progressIndicators: true,
      progressAuto: true,
      displaySummary: true,
      enableRetry: true,
    },
    read: 'Öffnen',
    displayTOC: 'Inhaltsverzeichnis anzeigen',
    hideTOC: 'Inhaltsverzeichnis ausblenden',
    nextPage: 'Nächste Seite',
    previousPage: 'Vorherige Seite',
    chapterCompleted: 'Seite abgeschlossen!',
    partCompleted: '@pages von @total Seiten abgeschlossen',
    incompleteChapter: 'Unvollständige Seite',
    navigateToTop: 'Nach oben springen',
    markAsFinished: 'Ich habe diese Seite abgeschlossen',
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild beenden',
    bookProgressSubtext: '@count von @total Seiten',
    interactionsProgressSubtext: '@count von @total Interaktionen',
    submitReport: 'Report absenden',
    restartLabel: 'Neustart',
    summaryHeader: 'Zusammenfassung',
    allInteractions: 'Alle Interaktionen',
    unansweredInteractions: 'Unbeantwortete Interaktionen',
    scoreText: '@score / @maxscore',
    leftOutOfTotalCompleted: '@left von @max Interaktionen abgeschlossen',
    noInteractions: 'Keine Interaktionen',
    score: 'Punkte',
    summaryAndSubmit: 'Zusammenfassung und Einsenden',
    noChapterInteractionBoldText: 'Du hast noch keine Seiten bearbeitet.',
    noChapterInteractionText:
      'Du musst wenigstens eine Seite bearbeiten, um die Zusammenfassung zu sehen.',
    yourAnswersAreSubmittedForReview: 'Deine Antworten wurden zur Begutachtung versendet!',
    bookProgress: 'Buchfortschritt',
    interactionsProgress: 'Interaktionsfortschritt',
    totalScoreLabel: 'Gesamtpunktzahl',
    a11y: {
      progress: 'Seite @page von @total.',
      menu: 'Inhaltsverzeichnis ein- bzw. ausschalten',
    },
  };
}

function buildH5PJson(title: string) {
  return {
    defaultLanguage: 'de',
    embedTypes: ['iframe'],
    language: 'de',
    license: 'U',
    mainLibrary: 'H5P.InteractiveBook',
    preloadedDependencies: [
      { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
      { machineName: 'H5P.MultiChoice', majorVersion: 1, minorVersion: 16 },
      { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
      { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
      { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
      { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
      { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
      { machineName: 'H5P.Column', majorVersion: 1, minorVersion: 18 },
      { machineName: 'H5P.InteractiveBook', majorVersion: 1, minorVersion: 11 },
    ],
    title: title.trim() || 'Interaktives Buch',
    extraTitle: title.trim() || 'Interaktives Buch',
  };
}

let libraryFilesCache: ReturnType<typeof unzipSync> | null = null;

async function getLibraryFiles(): Promise<ReturnType<typeof unzipSync>> {
  if (!libraryFilesCache) {
    const response = await fetch(`${import.meta.env.BASE_URL}h5p/interactive-book-libraries.zip`);
    if (!response.ok) {
      throw new Error(`Bibliotheks-Paket konnte nicht geladen werden (${response.status})`);
    }
    libraryFilesCache = unzipSync(new Uint8Array(await response.arrayBuffer()));
  }
  return libraryFilesCache;
}

export async function generateH5PPackage(title: string, content: Content[]): Promise<Blob> {
  const files = { ...(await getLibraryFiles()) };

  files['content/content.json'] = strToU8(JSON.stringify(buildContentJson(title, content)));
  files['h5p.json'] = strToU8(JSON.stringify(buildH5PJson(title)));

  const zipped = zipSync(files, { level: 6 });
  const zipBytes = new Uint8Array(zipped.byteLength);
  zipBytes.set(zipped);
  return new Blob([zipBytes.buffer], { type: 'application/zip' });
}

export function downloadH5PPackage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${filename}.h5p`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
