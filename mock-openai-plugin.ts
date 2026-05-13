// Mock OpenAI server — use during development to avoid spending real tokens.
//
// Set the API endpoint in the app settings to:
//   http://localhost:3000/mock/v1/chat/completions
//
// Speech transcription fallback (Whisper) is mocked at:
//   http://localhost:3000/mock/v1/audio/transcriptions  (derived automatically)

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

type OAIMessage = { role: string; content: string };

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function buildMockContent(messages: OAIMessage[]): string {
  const system = messages.find((m) => m.role === 'system')?.content ?? '';
  const lastUser =
    [...messages].reverse().find((m: OAIMessage) => m.role === 'user')?.content ?? '';

  // generateMultipleChoice — expects a raw JSON object back
  if (lastUser.includes('JSON-Objekt') || lastUser.includes('multiple-choice')) {
    return JSON.stringify({
      question: 'Was ist die Hauptaussage dieses Textes? (Mock)',
      answers: [
        { text: 'Antwort A (falsch)', correct: false },
        { text: 'Antwort B (richtig)', correct: true },
        { text: 'Antwort C (falsch)', correct: false },
      ],
    });
  }

  // generateText — expects plain text back
  if (lastUser.includes('NUR mit dem Text')) {
    return 'Dies ist ein Mock-Beispieltext für das Arbeitsblatt. Er dient als Platzhalter während der Entwicklung und enthält keine echten Inhalte.';
  }

  // sendChatMessage (guided creation) — expects a WORKSHEET_UPDATE block
  if (system.includes('WORKSHEET_UPDATE')) {
    return (
      'Hier ist ein erster Entwurf für dein Arbeitsblatt:\n\n' +
      '[WORKSHEET_UPDATE: {"title":"Mock-Arbeitsblatt","content":[' +
      '{"type":"text","text":"Dies ist ein Beispieltext für das Arbeitsblatt. Er wurde vom Mock-Server generiert."},' +
      '{"type":"multiple-choice","question":"Was ist 2 + 2?","answers":[' +
      '{"text":"3","correct":false},{"text":"4","correct":true},{"text":"5","correct":false}]}' +
      ']}]\n\n[VORSCHLÄGE: Füge weitere Fragen hinzu | Vereinfache den Text | Ändere das Thema]'
    );
  }

  // Regular chat message
  const snippet = lastUser.slice(0, 80).replace(/"/g, "'");
  return `[Mock] Ich habe deine Nachricht erhalten: "${snippet}"\n\nDies ist eine Antwort vom lokalen Mock-Server.\n\n[VORSCHLÄGE: Erstelle eine Frage | Vereinfache den Text | Füge Beispiele hinzu]`;
}

export function mockOpenAIPlugin(): Plugin {
  return {
    name: 'mock-openai',
    configureServer(server) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.method !== 'POST' || !req.url?.startsWith('/mock/')) {
            next();
            return;
          }

          // Simulate network latency so loading states are visible
          await new Promise((r) => setTimeout(r, 700));

          if (req.url === '/mock/v1/chat/completions') {
            const raw = (await readBody(req)).toString('utf-8');
            const body = JSON.parse(raw) as { messages?: OAIMessage[] };
            const messages = body.messages ?? [];
            const content = buildMockContent(messages);

            console.log(
              `[mock-openai] chat/completions ← "${([...messages].reverse().find((m: OAIMessage) => m.role === 'user')?.content ?? '').slice(0, 60)}"`
            );

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                id: `mock-${Date.now()}`,
                object: 'chat.completion',
                choices: [
                  { index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' },
                ],
              })
            );
            return;
          }

          if (req.url === '/mock/v1/audio/transcriptions') {
            console.log('[mock-openai] audio/transcriptions (mock)');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ text: 'Das ist eine Mock-Transkription.' }));
            return;
          }

          next();
        }
      );
    },
  };
}
