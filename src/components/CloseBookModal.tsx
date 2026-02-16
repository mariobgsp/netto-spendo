import React, { useState } from 'react';

interface CloseBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (carryForward: boolean) => Promise<void>;
    currentBalance: number;
}

export const CloseBookModal: React.FC<CloseBookModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    currentBalance,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleAction = async (carryForward: boolean) => {
        setIsProcessing(true);
        try {
            await onConfirm(carryForward);
            onClose();
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>
                    ✕
                </button>
                <h2 className="modal-title">📦 Tutup Buku</h2>
                <p className="modal-desc">
                    Anda akan menutup buku periode ini. Semua transaksi saat ini akan diarsipkan.
                </p>

                <div className="current-balance-display">
                    <span className="balance-label">Saldo Akhir</span>
                    <span className={`balance-amount ${currentBalance >= 0 ? 'income-text' : 'expense-text'}`}>
                        {formatCurrency(currentBalance)}
                    </span>
                </div>

                <div className="modal-actions-vertical">
                    <button
                        className="btn-action primary"
                        onClick={() => handleAction(true)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Memproses...' : 'Tutup & Bawa Saldo (Lanjut)'}
                        <span className="btn-sub">Mulai periode baru dengan saldo awal ini</span>
                    </button>

                    <button
                        className="btn-action secondary"
                        onClick={() => handleAction(false)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Memproses...' : 'Tutup & Mulai dari 0'}
                        <span className="btn-sub">Mulai periode baru dengan saldo nol</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
