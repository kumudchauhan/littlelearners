import { books } from "../data/books";

interface Props {
  onSelect: (bookId: string) => void;
}

export default function Library({ onSelect }: Props) {
  return (
    <div className="library">
      <header className="library-header">
        <h1 className="library-title">📚 LittleReaders</h1>
        <p className="library-sub">Tap a book to start reading!</p>
      </header>
      <div className="bookshelf">
        {books.filter((b) => !b.hidden).map((book) => (
          <button
            key={book.id}
            className="book-card"
            style={{ background: book.color }}
            onPointerDown={() => onSelect(book.id)}
          >
            <span className="book-cover-emoji">{book.cover}</span>
            <span className="book-card-title">{book.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
