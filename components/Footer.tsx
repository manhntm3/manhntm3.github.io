export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--color-border)] mt-24">
      <div className="max-w-3xl mx-auto px-5 py-8 flex flex-wrap gap-4 items-center justify-between mono text-xs text-[var(--color-dim)]">
        <span>© {year} Martin Nguyen</span>
        <span className="flex gap-4">
          <a href="https://github.com/manhntm3">github</a>
          <a href="https://www.linkedin.com/in/manhntm3/">linkedin</a>
          <a href="mailto:manhntm3@gmail.com">email</a>
        </span>
      </div>
    </footer>
  );
}
