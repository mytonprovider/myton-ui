// Names and numbers as the coordinator declares them in internal/constants/constants.go
export const REASON = {
  ValidStorageProof: 0,
  IPNotFound: 101,
  NotFound: 102,
  UnavailableProvider: 103,
  CantCreatePeer: 104,
  UnknownPeer: 105,
  PingFailed: 201,
  InvalidBagID: 202,
  FailedInitialPing: 203,
  GetInfoFailed: 301,
  InvalidHeader: 302,
  CantGetPiece: 401,
  CantParseBoC: 402,
  ProofCheckFailed: 403,
} as const

export type CheckKind = "stored" | "unavailable" | "unchecked" | "noBagInfo" | "noProof" | "unknown"

// 102, 104, 105 and 202 are set when the checker itself fails before the provider is asked,
// so they say nothing about the provider. 3xx fail on the bag info, 4xx on the piece and its proof.
const KIND_OF_CODE: Record<number, CheckKind | undefined> = {
  [REASON.ValidStorageProof]: "stored",
  [REASON.IPNotFound]: "unavailable",
  [REASON.NotFound]: "unchecked",
  [REASON.UnavailableProvider]: "unavailable",
  [REASON.CantCreatePeer]: "unchecked",
  [REASON.UnknownPeer]: "unchecked",
  [REASON.PingFailed]: "unavailable",
  [REASON.InvalidBagID]: "unchecked",
  [REASON.FailedInitialPing]: "unavailable",
  [REASON.GetInfoFailed]: "noBagInfo",
  [REASON.InvalidHeader]: "noBagInfo",
  [REASON.CantGetPiece]: "noProof",
  [REASON.CantParseBoC]: "noProof",
  [REASON.ProofCheckFailed]: "noProof",
}

export const checkKind = (code: number | null | undefined): CheckKind | null =>
  code == null ? null : (KIND_OF_CODE[code] ?? "unknown")
