export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col py-8 md:py-10">
      <div className="w-full max-w-2xl">{children}</div>
    </section>
  );
}
