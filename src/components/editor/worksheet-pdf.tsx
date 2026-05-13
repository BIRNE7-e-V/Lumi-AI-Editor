import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';

import type { Content } from '@state/lumi-editor/types';

const styles = StyleSheet.create({
  page: {
    paddingVertical: 48,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    color: '#111827',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginTop: 24,
    marginBottom: 0,
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 1.8,
    color: '#374151',
  },
  badge: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#4b5563',
    marginBottom: 8,
  },
  question: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  checkbox: {
    width: 13,
    height: 13,
    borderWidth: 1.5,
    borderColor: '#6b7280',
    borderRadius: 2,
    flexShrink: 0,
  },
  answerText: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
    marginTop: 10,
  },
});

function TextItem({ text }: { text: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.bodyText}>{text || '(Kein Text)'}</Text>
    </View>
  );
}

function MCQItem({ question, answers }: { question: string; answers: { text: string }[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.question}>{question || '(Keine Frage)'}</Text>
      {answers.map((answer, index) => (
        <View key={index} style={styles.answerRow}>
          <View style={styles.checkbox} />
          <Text style={styles.answerText}>{answer.text || `Antwort ${index + 1}`}</Text>
        </View>
      ))}
    </View>
  );
}

function FillInTheBlanksItem({ text }: { text: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.badge}>Lückentext</Text>
      <Text style={styles.bodyText}>{text || '(Lückentext folgt)'}</Text>
    </View>
  );
}

function FreetextItem({ task }: { task: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.badge}>Freitext</Text>
      <Text style={styles.bodyText}>{task || '(Freitextaufgabe folgt)'}</Text>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.line} />
      ))}
    </View>
  );
}

function ContentSection({ item, isLast }: { item: Content; isLast: boolean }) {
  const rendered: ReactNode =
    item.type === 'text' ? (
      <TextItem text={item.text} />
    ) : item.type === 'multiple-choice' ? (
      <MCQItem answers={item.answers} question={item.question} />
    ) : item.type === 'fill-in-the-blanks' ? (
      <FillInTheBlanksItem text={item.text} />
    ) : (
      <FreetextItem task={item.task} />
    );

  return (
    <>
      {rendered}
      {!isLast && <View style={styles.sectionDivider} />}
    </>
  );
}

type WorksheetPDFProps = {
  title: string;
  content: Content[];
};

// fallow-ignore-next-line unused-export
export function WorksheetPDF({ title, content }: WorksheetPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {title && <Text style={styles.title}>{title}</Text>}
        {title && content.length > 0 && <View style={styles.divider} />}
        {content.map((item, index) => (
          <ContentSection key={item.id} isLast={index === content.length - 1} item={item} />
        ))}
      </Page>
    </Document>
  );
}
