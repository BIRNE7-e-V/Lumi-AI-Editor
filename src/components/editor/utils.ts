import type { Content } from '@state/lumi-editor/types';

export function getOrderedContent(contentMap: Record<string, Content>, structure: string[]) {
  return structure.map((id) => contentMap[id]).filter(Boolean);
}

export function hasMeaningfulContent(title: string, content: Content[]) {
  if (title.trim()) {
    return true;
  }

  return content.some((item) => {
    switch (item.type) {
      case 'text':
        return item.text.trim().length > 0;
      case 'multiple-choice':
        return (
          item.question.trim().length > 0 ||
          item.answers.some((answer) => answer.text.trim().length > 0)
        );
      case 'fill-in-the-blanks':
        return item.text.trim().length > 0;
      case 'freetext':
        return item.task.trim().length > 0;
      default:
        return false;
    }
  });
}

export function parseMessage(content: string): { text: string; suggestions: string[] } {
  // Strip [WORKSHEET_UPDATE:...] block — system prompt puts it at the end of every reply.
  const updateIdx = content.indexOf('[WORKSHEET_UPDATE:');
  const cleaned = updateIdx === -1 ? content : content.slice(0, updateIdx).trim();

  const match = cleaned.match(/\[VORSCHLÄGE:\s*(.+?)\]/s);
  if (!match) {
    return { text: cleaned.trim(), suggestions: [] };
  }

  return {
    text: cleaned.replace(match[0], '').trim(),
    suggestions: match[1]
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean),
  };
}
