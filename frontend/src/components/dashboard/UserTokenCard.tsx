import { useState } from 'react';
import { CancelTokenError } from '../../api/tokenApi';
import type { UserToken } from '../../api/tokenApi';
import { Loader2, Calendar, Clock, MapPin, XCircle } from 'lucide-react';

interface Props {
    token: UserToken;
    onCancel?: (tokenId: number) => Promise<void>;
}

export function UserTokenCard({ token, onCancel }: Props) {
    const [confirming, setConfirming] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<{ message: string; isNetwork: boolean } | null>(null);

    function getCancelErrorDetails(err: unknown): { message: string; isNetwork: boolean } {
        if (err instanceof CancelTokenError) {
            switch (err.code) {
                case 'TOKEN_ALREADY_CANCELLED':
                    return { message: 'This token was already cancelled (possibly from another session). Refreshing your list...', isNetwork: false };
                case 'TOKEN_NOT_CANCELLABLE':
                    return { message: 'This token can no longer be cancelled — it is currently being served, completed, or marked as a no-show.', isNetwork: false };
                case 'TOKEN_NOT_FOUND':
                    return { message: 'We could not find this token on your account. Please refresh your tokens list.', isNetwork: false };
                case 'AUTH_ERROR':
                    return { message: 'Your session has expired. Please sign out and sign in again to continue.', isNetwork: false };
                case 'NETWORK_ERROR':
                    return { message: "Couldn't reach the server. Please check your connection and try again.", isNetwork: true };
                default:
                    return { message: err.message, isNetwork: false };
            }
        }
        return { message: err instanceof Error ? err.message : 'An unexpected error occurred.', isNetwork: false };
    }

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString(undefined, {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        });

    const formatTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColorClass = (status: string) => {
        switch (status) {
            case 'Waiting': return 'bg-amber-400 text-black';
            case 'Serving': return 'bg-blue-500 text-white';
            case 'Completed': return 'bg-emerald-500 text-white';
            case 'Cancelled': return 'bg-red-500 text-white';
            case 'Skipped': return 'bg-gray-500 text-white';
            case 'NoShow': return 'bg-purple-600 text-white';
            default: return 'bg-gray-800 text-white';
        }
    };

    const handleCancelConfirm = async () => {
        if (!onCancel) return;
        setCancelling(true);
        setCancelError(null);
        try {
            await onCancel(token.tokenId);
        } catch (err) {
            setCancelError(getCancelErrorDetails(err));
            setCancelling(false);
            setConfirming(false);
        }
    };

    const isCancellable = token.status === 'Waiting' && !!onCancel;

    return (
        <div className="bg-[#1a1c23] border border-gray-800 rounded-[2rem] p-6 flex flex-col gap-4 w-full relative overflow-hidden transition-opacity">

            {/* Top accent bar based on status */}
            <div className={`absolute top-0 left-0 right-0 h-[5px] rounded-t-[2rem] ${getStatusColorClass(token.status)}`} />

            {/* Header row */}
            <div className="flex justify-between items-start pt-1">
                <h3 className="text-white text-base font-bold flex items-center gap-2 leading-snug">
                    <MapPin className="w-4 h-4 text-[#78d64b] shrink-0" />
                    {token.centerName}
                </h3>
                <span className="text-gray-500 text-xs flex items-center gap-1 shrink-0 ml-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(token.issuedDate)}
                </span>
            </div>

            {/* Token number + status */}
            <div className="text-center my-2">
                <p className="text-[#78d64b] text-xs uppercase tracking-widest font-bold mb-1">Token Number</p>
                <h2 className="text-5xl text-white font-extrabold font-mono tracking-tight">
                    {token.tokenNumber}
                </h2>
                <div className="mt-3">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColorClass(token.status)}`}>
                        {token.status}
                    </span>
                </div>
            </div>

            {/* Queue position + ETA (only for active tokens) */}
            {(token.queuePosition !== null || token.eta) && token.status !== 'Cancelled' && (
                <div className="grid grid-cols-2 gap-4 bg-black/40 p-4 rounded-2xl border border-gray-800">
                    {token.queuePosition !== null && (
                        <div>
                            <p className="text-gray-400 text-xs font-semibold">Queue Position</p>
                            <p className="mt-1 text-[#78d64b] text-2xl font-bold">
                                {token.queuePosition === 0 ? "It's your turn!" : `#${token.queuePosition}`}
                            </p>
                        </div>
                    )}
                    {token.eta && (
                        <div>
                            <p className="text-gray-400 text-xs font-semibold">Estimated Time</p>
                            <p className="mt-1 text-white text-2xl font-bold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[#78d64b]" />
                                {formatTime(token.eta)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Cancelled notice */}
            {token.status === 'Cancelled' && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                        <p className="text-red-400 text-sm font-bold">Token Cancelled</p>
                        {token.cancelledAt && (
                            <p className="mt-0.5 text-red-500/70 text-xs">
                                at {formatTime(token.cancelledAt)} on {formatDate(token.cancelledAt)}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Time footer */}
            <div className="flex justify-between border-t border-gray-800 pt-4">
                <div className="text-center flex-1">
                    <p className="text-gray-500 text-xs font-semibold">Issued</p>
                    <p className="mt-1 text-gray-300 text-sm font-medium">{formatTime(token.issuedTime)}</p>
                </div>
                {token.servedTime && (
                    <div className="text-center flex-1 border-l border-gray-800">
                        <p className="text-gray-500 text-xs font-semibold">Served</p>
                        <p className="mt-1 text-gray-300 text-sm font-medium">{formatTime(token.servedTime)}</p>
                    </div>
                )}
                {token.completedTime && (
                    <div className="text-center flex-1 border-l border-gray-800">
                        <p className="text-gray-500 text-xs font-semibold">Completed</p>
                        <p className="mt-1 text-gray-300 text-sm font-medium">{formatTime(token.completedTime)}</p>
                    </div>
                )}
            </div>

            {/* Live Queue button */}
            <div>
                <a
                    href={`/queue/${token.centerId}`}
                    className="flex flex-row items-center justify-center gap-2 w-full py-3.5 bg-[#78d64b] text-black rounded-full font-bold text-sm no-underline transition-all hover:bg-[#65b83f] hover:scale-[0.98] active:scale-95"
                >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Live Queue
                </a>
            </div>

            {/* Cancel section (Waiting tokens only) */}
            {isCancellable && (
                <div>
                    {cancelError && (
                        <div className={`rounded-2xl p-4 text-sm mb-3 flex flex-col gap-2 ${cancelError.isNetwork ? 'bg-blue-900/20 border border-blue-500/30 text-blue-300' : 'bg-red-900/20 border border-red-500/30 text-red-300'}`}>
                            <span>{cancelError.message}</span>
                            {cancelError.isNetwork && (
                                <button
                                    onClick={() => { setCancelError(null); setConfirming(true); }}
                                    className="self-start px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Try again
                                </button>
                            )}
                        </div>
                    )}

                    {confirming ? (
                        <div className="border border-red-500/30 bg-red-900/10 rounded-2xl p-4 flex flex-col gap-2">
                            <p className="text-red-400 text-sm font-bold">Cancel this token?</p>
                            <p className="text-red-500/70 text-xs">This action cannot be undone. Your queue spot will be released.</p>
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleCancelConfirm}
                                    disabled={cancelling}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                                >
                                    {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                                </button>
                                <button
                                    onClick={() => { setConfirming(false); setCancelError(null); }}
                                    disabled={cancelling}
                                    className="flex-1 py-2.5 bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-full font-bold text-sm transition-colors"
                                >
                                    Keep Token
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirming(true)}
                            className="w-full py-2.5 bg-transparent text-gray-500 border border-gray-800 hover:border-red-500/50 hover:text-red-400 rounded-full font-bold text-sm transition-all"
                        >
                            Cancel Token
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
