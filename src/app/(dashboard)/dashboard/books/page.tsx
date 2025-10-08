import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import { deleteBook, reorderBooks, upsertBook } from "@/server/actions/books";
import { listBooks } from "@/server/queries";

export default async function BooksPage() {
  const books = await listBooks();
  const session = await auth();
  const role = session?.user?.role ?? "viewer";
  const canEdit = role === "owner" || role === "editor";

  async function handleCreate(formData: FormData) {
    "use server";
    if (!canEdit) return;
    const title = formData.get("title");
    const author = formData.get("author");
    const orderIndex = Number(formData.get("orderIndex") ?? 0);
    if (typeof title === "string" && typeof author === "string") {
      await upsertBook({ title, author, orderIndex });
    }
  }

  async function handleDelete(formData: FormData) {
    "use server";
    if (!canEdit) return;
    const id = formData.get("id");
    if (typeof id === "string") {
      await deleteBook(id);
    }
  }

  async function move(bookId: string, direction: "up" | "down") {
    "use server";
    if (!canEdit) return;
    const current = await listBooks();
    const index = current.findIndex((book) => book.id === bookId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    const newOrder = [...current];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    await reorderBooks({ orderedIds: newOrder.map((book) => book.id) });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add book</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input id="author" name="author" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderIndex">Order</Label>
                <Input id="orderIndex" name="orderIndex" type="number" defaultValue={books.length} />
              </div>
              <Button type="submit">Save</Button>
            </form>
          ) : (
            <p className="text-sm text-[hsl(var(--fg-muted))]">View-only access.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bookshelf</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {books.map((book) => (
            <div key={book.id} className="space-y-2 rounded-lg border border-[hsl(var(--border))] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{book.title}</div>
                  <div className="text-sm text-[hsl(var(--fg-muted))]">{book.author}</div>
                </div>
                <div className="flex gap-2">
                  {canEdit ? (
                    <>
                      <form action={handleDelete}>
                        <input type="hidden" name="id" value={book.id} />
                        <Button variant="destructive" size="sm" type="submit">
                          Delete
                        </Button>
                      </form>
                      <form action={move.bind(null, book.id, "up")}>
                        <Button variant="outline" size="sm" type="submit">
                          ↑
                        </Button>
                      </form>
                      <form action={move.bind(null, book.id, "down")}>
                        <Button variant="outline" size="sm" type="submit">
                          ↓
                        </Button>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>
              {book.description ? <p className="text-sm text-[hsl(var(--fg-muted))]">{book.description}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
