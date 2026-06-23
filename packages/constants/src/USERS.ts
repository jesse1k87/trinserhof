// The single owner account allowed to overwrite the raw database directly
// (mirrors the ".write" rule in database.rules.json).
//
// The allowed-user list and which of them are admins now live in Firebase's
// `users` collection, not in the code — see getSignedInUser in
// @trinserhof/database.
export const OWNER_EMAIL = 'jesse1k87@gmail.com';
