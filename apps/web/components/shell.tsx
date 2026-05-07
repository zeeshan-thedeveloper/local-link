import { Nav } from "./nav";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen md:flex">
      <Nav />
      <section className="flex-1 px-4 py-6 md:px-8">{children}</section>
    </main>
  );
}

