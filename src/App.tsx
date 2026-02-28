import { useState, useCallback } from "react";
import Library from "./components/Library";
import BookReader from "./components/BookReader";
import { books } from "./data/books";
import "./App.css";

export default function App() {
  const [activeBookId, setActiveBookId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => setActiveBookId(id), []);
  const handleBack = useCallback(() => setActiveBookId(null), []);

  const activeBook = books.find((b) => b.id === activeBookId);

  if (activeBook) {
    return <BookReader book={activeBook} onBack={handleBack} />;
  }

  return <Library onSelect={handleSelect} />;
}
