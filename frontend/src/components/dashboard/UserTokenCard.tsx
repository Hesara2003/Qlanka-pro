import { useState } from 'react';
import type { UserToken } from '../../api/tokenApi';

interface Props {
    token: UserToken;
    onCancel?: (tokenId: number) => Promise<void>;
}

export function UserTokenCard({ token, onCancel }: Props) {
    const [confirming, setConfirming] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Waiting':   return '#f59e0b'; // Amber
            case 'Serving':   return '#3b82f6'; // Blue
            case 'Completed': return '#10b981'; // Green
            case 'Cancelled': return '#ef4444'; // Red
            case 'Skipped':   return '#6b7280'; // Gray
            case 'NoShow':    return '#9333ea'; // Purple
            default:          return '#1a1a2e';
        }
    };

    const handleCancelConfirm = async () => {
        if (!onCancel) return;
        setCancelling(true);
        setCancelError(null);
        try {
            await onCancel(token.tokenId);
            setConfirming(false);
        } catch (err) {
            setCancelError(err instanceof Error ? err.message : 'Failed to cancel token.');
        } finally {
            setCancelling(false);
        }
    };

    const isCancellable = token.status === 'Waiting' && !!onCancel;

    return (
        <div
            style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                width: '100%',
                maxWidth: '400px',
                position: 'relative',
                overflow: 'hidden',
                opacity: cancelling ? 0.7 : 1,
                transition: 'opacity 0.2s',
            }}
        >
            {/* Decorative top border based on status */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '6px',
                    background: getStatusColor(token.status),
                }}
            />

            {/* Header: Center Name & Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#111827', fontSize: '1.1rem', fontWeight: 600 }}>
                    {token.centerName}
                </h3>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    {formatDate(token.issuedDate)}
                </span>
            </div>

            {/* Big Token Number */}
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Token Number
                </p>
                <h2
                    style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '2.5rem',
                        color: '#111827',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                    }}
                >
                    {token.tokenNumber}
                </h2>
                <div style={{ marginTop: '0.5rem' }}>
                    <span
                        style={{
                            display: 'inline-block',
                            background: `${getStatusColor(token.status)}20`,
                            color: getStatusColor(token.status),
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                        }}
                    >
                        • {token.status}
                    </span>
                </div>
            </div>

            {/* Queue Info (only when Waiting or Serving) */}
            {(token.queuePosition !== null || token.eta) && token.status !== 'Cancelled' && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        background: '#f9fafb',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #f3f4f6',
                    }}
                >
                    {token.queuePosition !== null && (
                        <div>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>Queue Position</p>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#111827', fontSize: '1.25rem', fontWeight: 700 }}>
                                {token.queuePosition === 0 ? "It's your turn!" : `#${token.queuePosition}`}
                            </p>
                        </div>
                    )}
                    {token.eta && (
                        <div>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>Estimated Time</p>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#111827', fontSize: '1.25rem', fontWeight: 700 }}>
                                {formatTime(token.eta)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Cancelled notice */}
            {token.status === 'Cancelled' && (
                <div
                    style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                        <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600 }}>Token Cancelled</p>
                        {token.cancelledAt && (
                            <p style={{ margin: '0.15rem 0 0 0', color: '#ef4444', fontSize: '0.78rem' }}>
                                at {formatTime(token.cancelledAt)} on {formatDate(token.cancelledAt)}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Footer Details */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    borderTop: '1px dashed #e5e7eb',
                    paddingTop: '1rem',
                }}
            >
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>Issued at</p>
                    <p style={{ margin: '0.1rem 0 0 0', color: '#4b5563', fontSize: '0.85rem', fontWeight: 500 }}>
                        {formatTime(token.issuedTime)}
                    </p>
                </div>
                {token.servedTime && (
                    <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid #e5e7eb' }}>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>Served at</p>
                        <p style={{ margin: '0.1rem 0 0 0', color: '#4b5563', fontSize: '0.85rem', fontWeight: 500 }}>
                            {formatTime(token.servedTime)}
                        </p>
                    </div>
                )}
                {token.completedTime && (
                    <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid #e5e7eb' }}>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>Completed at</p>
                        <p style={{ margin: '0.1rem 0 0 0', color: '#4b5563', fontSize: '0.85rem', fontWeight: 500 }}>
                            {formatTime(token.completedTime)}
                        </p>
                    </div>
                )}
            </div>

            {/* Cancel section — only for Waiting tokens */}
            {isCancellable && (
                <div style={{ marginTop: '0.25rem' }}>
                    {/* Inline cancel error */}
                    {cancelError && (
                        <div
                            style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                padding: '0.6rem 0.75rem',
                                color: '#b91c1c',
                                fontSize: '0.82rem',
                                marginBottom: '0.75rem',
                            }}
                        >
                            {cancelError}
                        </div>
                    )}

                    {confirming ? (
                        /* Confirmation row */
                        <div
                            style={{
                                background: '#fff7ed',
                                border: '1px solid #fed7aa',
                                borderRadius: '8px',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                            }}
                        >
                            <p style={{ margin: 0, color: '#92400e', fontSize: '0.88rem', fontWeight: 600 }}>
                                Cancel this token?
                            </p>
                            <p style={{ margin: 0, color: '#b45309', fontSize: '0.8rem' }}>
                                This action cannot be undone. Your queue spot will be released.
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <button
                                    onClick={handleCancelConfirm}
                                    disabled={cancelling}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        background: cancelling ? '#fca5a5' : '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: cancelling ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.4rem',
                                    }}
                                >
                                    {cancelling && (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: '12px',
                                                height: '12px',
                                                border: '2px solid rgba(255,255,255,0.4)',
                                                borderTopColor: '#fff',
                                                borderRadius: '50%',
                                                animation: 'spin 0.7s linear infinite',
                                            }}
                                        />
                                    )}
                                    {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                                </button>
                                <button
                                    onClick={() => { setConfirming(false); setCancelError(null); }}
                                    disabled={cancelling}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        background: '#f3f4f6',
                                        color: '#374151',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        cursor: cancelling ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    Keep Token
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Initial cancel trigger */
                        <button
                            onClick={() => setConfirming(true)}
                            style={{
                                width: '100%',
                                padding: '0.55rem',
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                transition: 'background 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = '#fecaca';
                            }}
                        >
                            Cancel Token
                        </button>
                    )}
                </div>
            )}

            {/* Spin keyframe — injected once per card; harmless duplication */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
