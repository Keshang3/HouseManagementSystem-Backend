/**
 * Generates a consistent conversation ID between two users.
 * Sorts IDs to ensure that generateConversationId(A, B) === generateConversationId(B, A).
 */
export const generateConversationId = (id1, id2) => {
    const sortedIds = [id1.toString(), id2.toString()].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
};
