type LegalPageProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function LegalPage({ title, description, children }: LegalPageProps) {
  return (
    <section className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        <article className="prose prose-slate rounded-box border-base-300 bg-base-100 w-full max-w-none border p-6 shadow-lg sm:p-8">
          <h1 className="text-base-content mb-3 font-[Barlow] text-4xl font-bold">{title}</h1>
          <p className="lead text-base-content/70">{description}</p>
          {children}
        </article>
      </div>
    </section>
  );
}
