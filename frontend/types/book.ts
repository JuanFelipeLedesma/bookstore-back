// frontend/types/book.ts
export interface Book {
  id: string | number;
  title: string;
  authorId?: string | number;
  author?: { id?: string | number; name?: string };
}