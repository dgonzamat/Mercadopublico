import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">Error 404 · Página no encontrada</p>
      <h1 className="mt-4 text-4xl font-bold text-text">Esta entrada no existe en el corpus.</h1>
      <p className="mt-4 text-muted">Probablemente seguiste un link roto o tipeaste mal una URL.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent/90">Volver al inicio</Link>
        <Link href="/cases" className="rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-panel">Ver casos</Link>
      </div>
    </div>
  );
}
