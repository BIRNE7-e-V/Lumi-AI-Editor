const FRIENDLY_MESSAGES: Record<number, string> = {
  401: 'Der API-Schlüssel ist ungültig oder abgelaufen. Bitte überprüfe deine KI-Einstellungen.',
  403: 'Zugriff verweigert. Der API-Schlüssel hat keine Berechtigung für diesen Endpunkt.',
  429: 'Zu viele Anfragen. Das API-Kontingent ist aufgebraucht oder das Limit wurde erreicht. Bitte warte einen Moment.',
  500: 'Der Dienst hat einen internen Fehler gemeldet. Bitte versuche es später erneut.',
  502: 'Der Dienst ist vorübergehend nicht erreichbar (Bad Gateway).',
  503: 'Der Dienst ist momentan überlastet oder in Wartung. Bitte versuche es später erneut.',
};

/** Formats a failed API response into a user-facing message with technical details. */
export function buildApiErrorMessage(status: number, technical: string): string {
  const friendly = FRIENDLY_MESSAGES[status] ?? `Unbekannter Fehler vom Dienst (Status ${status}).`;
  return `${friendly}\n\nTechnische Details (für den Support):\n${technical}`;
}

/** Extracts a technical error string from a JSON error body (OpenAI-compatible format). */
export function extractTechnicalFromJson(
  data: Record<string, unknown>,
  status: number,
  statusText: string
): string {
  return (
    ((data?.error as Record<string, unknown>)?.message as string) ??
    (data?.message as string) ??
    `HTTP ${status} ${statusText}`
  );
}

/** Extracts a technical error string from a raw text/JSON response body. */
export async function extractTechnicalFromResponse(response: Response): Promise<string> {
  try {
    const text = await response.text();
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return extractTechnicalFromJson(parsed, response.status, response.statusText);
  } catch {
    return `HTTP ${response.status} ${response.statusText}`;
  }
}
