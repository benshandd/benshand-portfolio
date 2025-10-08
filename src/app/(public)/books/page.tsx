import Image from "next/image";

import { listBooks } from "@/server/queries";

export const revalidate = 60;

export default async function BooksPage() {
  const books = await listBooks();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Bookshelf</h1>
        <p className="text-sm text-[hsl(var(--fg-muted))]">
          A curated list of books that shaped my thinking across neuroscience, engineering, and leadership.
        </p>
      </header>
      <ol className="grid gap-6">
        {books.map((book) => (
          <li key={book.id} className="rounded-xl border border-[hsl(var(--border))] p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{book.title}</h2>
                <p className="text-sm text-[hsl(var(--fg-muted))]">{book.author}</p>
              </div>
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={`Cover of ${book.title}`}
                  width={192}
                  height={256}
                  className="h-32 w-auto rounded-md border border-[hsl(var(--border))] object-cover"
                />
              ) : null}
            </div>
            {book.description ? <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">{book.description}</p> : null}
            {book.review ? (
              <blockquote className="mt-4 rounded-lg bg-[hsl(var(--bg-muted))] p-4 text-sm">
                {book.review}
              </blockquote>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
