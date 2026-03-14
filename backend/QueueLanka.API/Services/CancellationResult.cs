namespace QueueLanka.API.Services;

/// <summary>
/// Represents the distinct outcomes of a token cancellation attempt.
/// Returned by <see cref="ITokenService.CancelTokenAsync"/> so the controller
/// can map each case to the appropriate HTTP response and error code.
/// </summary>
public enum CancellationResult
{
    /// <summary>The token was successfully cancelled and the queue was compacted.</summary>
    Success,

    /// <summary>
    /// No Waiting token with the given ID was found for this user.
    /// Covers: token does not exist, token belongs to another user.
    /// (Deliberately vague to avoid leaking whether a token ID is valid.)
    /// </summary>
    TokenNotFound,

    /// <summary>The token exists and belongs to the user but is already Cancelled.</summary>
    AlreadyCancelled,

    /// <summary>
    /// The token exists and belongs to the user but is in a non-cancellable
    /// status (Serving, Completed, Skipped, NoShow).
    /// </summary>
    NotCancellable,
}
