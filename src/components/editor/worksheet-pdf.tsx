import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';

import type { Content } from '@state/lumi-editor/types';

const BRAND_BLUE = '#1e3a6e';

const styles = StyleSheet.create({
  page: {
    paddingTop: 110,
    paddingBottom: 44,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    position: 'absolute',
    top: 24,
    left: 56,
    right: 56,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  headerBrand: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  headerDate: {
    fontSize: 9,
    color: '#6b7280',
  },
  headerDisclaimer: {
    fontSize: 8,
    fontFamily: 'Helvetica-Oblique',
    color: '#6b7280',
    marginBottom: 6,
  },
  headerRule: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 5,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    color: BRAND_BLUE,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginBottom: 6,
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

function PageHeader({ date }: { date: string }) {
  return (
    <View fixed style={styles.header}>
      <View style={styles.headerRow}>
        <Text style={styles.headerBrand}>Lern-Kurs von Lumio</Text>
        <Text style={styles.headerDate}>Erstellt am {date}</Text>
      </View>
      <Text style={styles.headerDisclaimer}>
        Hinweis: Dieser Kurs wurde mit Hilfe von Künstlicher Intelligenz (KI) erstellt. Die Inhalte
        können Fehler enthalten.
      </Text>
      <View style={styles.headerRule} />
    </View>
  );
}

function PageFooter() {
  return (
    <View fixed style={styles.footer}>
      <Text style={styles.footerText}>Lern-Kurs von Lumio – Der inklusive Lern-Assistent</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`}
      />
    </View>
  );
}

function SectionHeading({ heading }: { heading?: string }) {
  if (!heading) return null;
  return <Text style={styles.sectionHeading}>{heading}</Text>;
}

function TextItem({ heading, text }: { heading?: string; text: string }) {
  return (
    <View style={styles.section}>
      <SectionHeading heading={heading} />
      <Text style={styles.bodyText}>{text || '(Kein Text)'}</Text>
    </View>
  );
}

function MCQItem({ heading, question, answers }: { heading?: string; question: string; answers: { text: string }[] }) {
  return (
    <View style={styles.section}>
      <SectionHeading heading={heading} />
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

function FillInTheBlanksItem({ heading, text }: { heading?: string; text: string }) {
  return (
    <View style={styles.section}>
      <SectionHeading heading={heading} />
      <Text style={styles.badge}>Lückentext</Text>
      <Text style={styles.bodyText}>{text || '(Lückentext folgt)'}</Text>
    </View>
  );
}

function FreetextItem({ heading, task }: { heading?: string; task: string }) {
  return (
    <View style={styles.section}>
      <SectionHeading heading={heading} />
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
      <TextItem heading={item.heading} text={item.text} />
    ) : item.type === 'multiple-choice' ? (
      <MCQItem answers={item.answers} heading={item.heading} question={item.question} />
    ) : item.type === 'fill-in-the-blanks' ? (
      <FillInTheBlanksItem heading={item.heading} text={item.text} />
    ) : (
      <FreetextItem heading={item.heading} task={item.task} />
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
  date: string;
};

// fallow-ignore-next-line unused-export
export function WorksheetPDF({ title, content, date }: WorksheetPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PageHeader date={date} />
        {title && <Text style={styles.title}>{title}</Text>}
        {title && content.length > 0 && <View style={styles.divider} />}
        {content.map((item, index) => (
          <ContentSection key={item.id} isLast={index === content.length - 1} item={item} />
        ))}
        <PageFooter />
      </Page>
    </Document>
  );
}
