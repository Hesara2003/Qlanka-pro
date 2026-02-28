import type { UserToken } from '../../api/tokenApi';

interface Props {
    token: UserToken;
}

export function UserTokenCard({ token }: Props) {
    // Format date and times
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

    // Determine status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Waiting': return '#f59e0b'; // Amber
            case 'Serving': return '#3b82f6'; // Blue
            case 'Completed': return '#10b981'; // Green
            case 'Cancelled': return '#ef4444'; // Red
            case 'Skipped': return '#6b7280'; // Gray
            default: return '#1a1a2e';
        }
    };

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
                overflow: 'hidden'
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
                    background: getStatusColor(token.status)
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
                        fontFamily: 'monospace'
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

            {/* Queue Info grid */}
            {(token.queuePosition !== null || token.eta) && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        background: '#f9fafb',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #f3f4f6'
                    }}
                >
                    {token.queuePosition !== null && (
                        <div>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>Queue Position</p>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#111827', fontSize: '1.25rem', fontWeight: 700 }}>
                                {token.queuePosition === 0 ? "It's your turn!" : token.queuePosition}
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

            {/* Footer Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', borderTop: '1px dashed #e5e7eb', paddingTop: '1rem' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>Issued at</p>
                    <p style={{ margin: '0.1rem 0 0 0', color: '#4b5563', fontSize: '0.85rem', fontWeight: 500 }}>{formatTime(token.issuedTime)}</p>
                </div>
                {token.servedTime && (
                    <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid #e5e7eb' }}>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>Served at</p>
                        <p style={{ margin: '0.1rem 0 0 0', color: '#4b5563', fontSize: '0.85rem', fontWeight: 500 }}>{formatTime(token.servedTime)}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
