import React, { useState } from 'react';
import type { Label } from '../types';

interface LabelManagerProps {
    labels: Label[];
    onAdd: (name: string, color: string) => void | Promise<void>;
    onUpdate: (id: string, name: string, color: string) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
}

const PRESET_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#a1a1aa', // gray
    '#fafafa', // white
];

export const LabelManager: React.FC<LabelManagerProps> = ({ labels, onAdd, onUpdate, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(PRESET_COLORS[4]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        await onAdd(newName.trim(), newColor);
        setNewName('');
        setNewColor(PRESET_COLORS[4]);
    };

    const startEdit = (label: Label) => {
        setEditingId(label.id);
        setEditName(label.name);
        setEditColor(label.color);
    };

    const saveEdit = async () => {
        if (!editingId || !editName.trim()) return;
        await onUpdate(editingId, editName.trim(), editColor);
        setEditingId(null);
    };

    const cancelEdit = () => setEditingId(null);

    return (
        <div className="label-manager-container">
            <div className="label-manager-header">
                <h3>🏷️ Label</h3>
                <button
                    className="btn-icon-small"
                    onClick={() => setIsOpen(o => !o)}
                    title={isOpen ? 'Tutup' : 'Kelola Label'}
                >
                    {isOpen ? '−' : '+'}
                </button>
            </div>

            {/* Label badges preview when collapsed */}
            {!isOpen && labels.length > 0 && (
                <div className="label-preview-row">
                    {labels.map(l => (
                        <span key={l.id} className="label-badge" style={{ background: l.color + '28', color: l.color, borderColor: l.color + '55' }}>
                            <span className="label-dot" style={{ background: l.color }} />
                            {l.name}
                        </span>
                    ))}
                </div>
            )}
            {!isOpen && labels.length === 0 && (
                <p className="label-empty-hint">Tambah label untuk kategorikan pengeluaran.</p>
            )}

            {isOpen && (
                <div className="label-manager-body">
                    {/* Existing labels */}
                    {labels.length > 0 && (
                        <ul className="label-list">
                            {labels.map(label => (
                                <li key={label.id} className="label-item">
                                    {editingId === label.id ? (
                                        <div className="label-edit-row">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                                autoFocus
                                                className="label-name-input"
                                            />
                                            <div className="label-color-swatches">
                                                {PRESET_COLORS.map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        className={`color-swatch${editColor === c ? ' selected' : ''}`}
                                                        style={{ background: c }}
                                                        onClick={() => setEditColor(c)}
                                                        aria-label={c}
                                                    />
                                                ))}
                                            </div>
                                            <div className="label-edit-actions">
                                                <button className="btn-save" onClick={saveEdit}>✓</button>
                                                <button className="btn-cancel" onClick={cancelEdit}>✕</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="label-item-row">
                                            <span className="label-dot" style={{ background: label.color }} />
                                            <span className="label-name">{label.name}</span>
                                            <div className="label-item-actions">
                                                <button className="btn-edit" onClick={() => startEdit(label)} title="Edit">✎</button>
                                                <button className="btn-delete" onClick={() => onDelete(label.id)} title="Hapus">✕</button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Add new label form */}
                    <form className="label-add-form" onSubmit={handleAdd}>
                        <input
                            type="text"
                            placeholder="Nama label baru…"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="label-name-input"
                        />
                        <div className="label-color-swatches">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`color-swatch${newColor === c ? ' selected' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => setNewColor(c)}
                                    aria-label={c}
                                />
                            ))}
                        </div>
                        <button type="submit" className="btn-add-label" disabled={!newName.trim()}>
                            + Tambah Label
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
