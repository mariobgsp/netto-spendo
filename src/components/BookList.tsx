import React, { useState } from 'react';
import { Book } from '../types';

interface BookListProps {
    books: Book[];
    currentBook: Book | null;
    onSelectBook: (book: Book) => void;
    onCreateBook: (name: string) => void;
    onRenameBook: (id: string, name: string) => void;
}

export const BookList: React.FC<BookListProps> = ({
    books,
    currentBook,
    onSelectBook,
    onCreateBook,
    onRenameBook,
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newBookName, setNewBookName] = useState('');
    const [editingBookId, setEditingBookId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newBookName.trim()) {
            onCreateBook(newBookName.trim());
            setNewBookName('');
            setIsCreating(false);
        }
    };

    const startEditing = (book: Book) => {
        setEditingBookId(book.id);
        setEditName(book.name);
    };

    const handleRename = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBookId && editName.trim()) {
            onRenameBook(editingBookId, editName.trim());
            setEditingBookId(null);
            setEditName('');
        }
    };

    return (
        <div className="book-list-container">
            <div className="book-list-header">
                <h3>📚 Buku Kas</h3>
                <button
                    className="btn-icon-small"
                    onClick={() => setIsCreating(!isCreating)}
                    title="Buat Buku Baru"
                >
                    +
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="book-form-mini">
                    <input
                        type="text"
                        value={newBookName}
                        onChange={(e) => setNewBookName(e.target.value)}
                        placeholder="Nama Buku Baru..."
                        autoFocus
                    />
                    <button type="submit">✓</button>
                    <button type="button" onClick={() => setIsCreating(false)}>
                        ✕
                    </button>
                </form>
            )}

            <ul className="book-list">
                {books.map((book) => (
                    <li
                        key={book.id}
                        className={`book-item ${currentBook?.id === book.id ? 'active' : ''}`}
                    >
                        {editingBookId === book.id ? (
                            <form onSubmit={handleRename} className="book-form-mini">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit">✓</button>
                                <button type="button" onClick={() => setEditingBookId(null)}>
                                    ✕
                                </button>
                            </form>
                        ) : (
                            <div className="book-item-content" onClick={() => onSelectBook(book)}>
                                <span className="book-name">{book.name}</span>
                                <div className="book-meta">
                                    {book.end_date ? (
                                        <span className="badge-closed">Closed</span>
                                    ) : (
                                        <span className="badge-open">Active</span>
                                    )}
                                    <button
                                        className="btn-edit-small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(book);
                                        }}
                                        title="Ubah Nama"
                                    >
                                        ✎
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};
