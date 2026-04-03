import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CancelTokenError } from '../../api/tokenApi';
import type { UserToken } from '../../api/tokenApi';
import { Loader2, Calendar, MapPin, XCircle } from 'lucide-react';

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
                    return { message: 'Already cancelled. Refreshing...', isNetwork: false };
                case 'TOKEN_NOT_CANCELLABLE':
                    return { message: 'No longer cancellable.', isNetwork: false };
                case 'TOKEN_NOT_FOUND':
                    return { message: 'Token not found. Refreshing...', isNetwork: false };
                case 'AUTH_ERROR':
                    return { message: 'Session expired. Please sign in again.', isNetwork: false };
                case 'NETWORK_ERROR':
                    return { message: "Network error. Check connection.", isNetwork: true };
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
            case 'Waiting': return 'bg-amber-100 text-amber-700';
            case 'Serving': return 'bg-emerald-100 text-emerald-700';
            case 'Completed': return 'bg-emerald-100 text-emerald-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            case 'Skipped': return 'bg-gray-100 text-gray-700';
            case 'NoShow': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
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
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 flex flex-col gap-4 w-full relative overflow-hidden transition-all hover:bg-gray-50 group shadow-sm">

            {/* Top accent bar based on status */}
            <div className={`absolute top-0 left-0 right-0 h-[5px] rounded-t-[2.5rem] ${getStatusColorClass(token.status)}`} />

            {/* Header row */}
            <div className="flex justify-between items-start pt-1">
                <h3 className="text-gray-900 text-lg font-bold flex items-center gap-2 leading-snug tracking-tight">
                    <MapPin className="w-4 h-4 text-[#78d64b] shrink-0" />
                    {token.centerName}
                </h3>
                <span className="text-gray-500 text-[10px] uppercase font-black flex items-center gap-1.5 shrink-0 ml-2 tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <Calendar className="w-3 h-3" />
                    {formatDate(token.issuedDate)}
                </span>
            </div>

            {/* Token number + status */}
            <div className="text-center my-4 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner">
                <p className="text-[#78d64b] text-[10px] uppercase tracking-[0.2em] font-black mb-2 opacity-80 italic">Token Number</p>
                <h2 className="text-6xl text-gray-900 font-black tracking-tighter leading-none">
                    {token.tokenNumber}
                </h2>
                <div className="mt-6">
                    <span className={`inline-block px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColorClass(token.status)}`}>
                        {token.status}
                    </span>
                </div>
            </div>

            {/* Queue position + ETA (only for active tokens) */}
            {(token.queuePosition !== null || token.eta) && token.status !== 'Cancelled' && (
                <div className="grid grid-cols-2 gap-4 bg-gray-100/50 p-5 rounded-[2rem] border border-gray-100">
                    {token.queuePosition !== null && (
                        <div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest italic">Position</p>
                            <p className="mt-1 text-[#78d64b] text-3xl font-black tracking-tighter">
                                {token.queuePosition === 0 ? "Now" : `#${token.queuePosition}`}
                            </p>
                        </div>
                    )}
                    {token.eta && (
                        <div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest italic">Time</p>
                            <p className="mt-1 text-gray-900 text-3xl font-black tracking-tighter flex items-center gap-2 leading-none">
                                {formatTime(token.eta)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Cancelled notice */}
            {token.status === 'Cancelled' && (
                <div className="bg-red-900/20 border border-red-500/20 rounded-[2rem] p-5 flex items-center gap-4">
                    <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                    <div>
                        <p className="text-red-400 text-sm font-black uppercase tracking-widest">Cancelled</p>
                        {token.cancelledAt && (
                            <p className="mt-0.5 text-red-500/50 text-[10px] font-bold uppercase tracking-widest leading-none">
                                at {formatTime(token.cancelledAt)}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Time footer */}
            <div className="flex justify-between border-t border-white/5 pt-6 group-hover:border-white/10 transition-colors">
                <div className="text-center flex-1">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 opacity-50">Issued</p>
                    <p className="text-gray-300 text-xs font-bold leading-none">{formatTime(token.issuedTime)}</p>
                </div>
                {token.servedTime && (
                    <div className="text-center flex-1 border-l border-white/5">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 opacity-50">Served</p>
                        <p className="text-gray-300 text-xs font-bold leading-none">{formatTime(token.servedTime)}</p>
                    </div>
                )}
                {token.completedTime && (
                    <div className="text-center flex-1 border-l border-white/5">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 opacity-50">Completed</p>
                        <p className="text-gray-300 text-xs font-bold leading-none">{formatTime(token.completedTime)}</p>
                    </div>
                )}
            </div>

            {/* Action Section */}
            <div className="mt-2 flex flex-col gap-3">
                <Link
                    to={`/queue/${token.centerId}`}
                    className="flex flex-row items-center justify-center gap-2 w-full py-4 bg-[#78d64b] text-black rounded-full font-black text-xs uppercase tracking-widest no-underline transition-all hover:bg-[#bef264] hover:scale-[0.98] active:scale-95 shadow-xl shadow-[#78d64b]/20"
                >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Live Queue
                </Link>

                {isCancellable && (
                    <div className="w-full">
                        {cancelError && (
                            <div className={`rounded-2xl p-4 text-[10px] font-bold uppercase tracking-widest mb-3 flex flex-col gap-3 ${cancelError.isNetwork ? 'bg-blue-900/20 border border-blue-500/20 text-blue-300' : 'bg-red-900/20 border border-red-500/20 text-red-300'}`}>
                                <span>{cancelError.message}</span>
                            </div>
                        )}

                        {confirming ? (
                            <div className="border border-red-500/20 bg-red-900/10 rounded-[2rem] p-5 flex flex-col gap-3">
                                <p className="text-red-400 text-xs font-black uppercase tracking-widest">Cancel token?</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancelConfirm}
                                        disabled={cancelling}
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                                    >
                                        {cancelling && <Loader2 className="w-3 h-3 animate-spin" />}
                                        {cancelling ? 'Wait...' : 'Confirm'}
                                    </button>
                                    <button
                                        onClick={() => { setConfirming(false); setCancelError(null); }}
                                        disabled={cancelling}
                                        className="flex-1 py-3 bg-transparent border border-white/10 text-gray-400 hover:bg-white/5 rounded-full font-black text-[10px] uppercase tracking-widest transition-colors"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirming(true)}
                                className="w-full py-3 bg-transparent text-gray-400 border border-gray-100 hover:border-red-500/30 hover:text-red-500/70 rounded-full font-black text-[10px] uppercase tracking-widest transition-all italic"
                            >
                                Cancel Service
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
