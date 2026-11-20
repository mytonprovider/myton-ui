export interface TonAddress {
  workchain: number
  hash: Uint8Array
  bounceable: boolean
  testnet: boolean
}

// User-friendly layout: tag byte, workchain byte, 32-byte hash, CRC16-XMODEM over the first 34 bytes
const ADDRESS_BYTES = 36
const HASH_AT = 2
const CHECKSUM_AT = 34
const TAG_BOUNCEABLE = 0x11
const TAG_NON_BOUNCEABLE = 0x51
const TAG_TESTNET = 0x80
const CRC_POLYNOMIAL = 0x1021

const RAW_FORM = /^(-?\d+):([0-9a-fA-F]{64})$/
// Both base64 alphabets: wallets hand out the url-safe one, some explorers and older tools the standard one
const FRIENDLY_FORM = /^[A-Za-z0-9_+/-]{48}$/

const crc16 = (data: Uint8Array): number => {
  let crc = 0
  for (const byte of data) {
    crc ^= byte << 8
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ CRC_POLYNOMIAL) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc
}

const fromRaw = (workchain: string, hex: string): TonAddress | null => {
  // The friendly form keeps the workchain in one signed byte
  const wc = Number(workchain) || 0
  if (wc < -128 || wc > 127) return null
  const hash = Uint8Array.from({ length: 32 }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16))
  return { workchain: wc, hash, bounceable: true, testnet: false }
}

const decode = (text: string): Uint8Array | null => {
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"))
    return binary.length === ADDRESS_BYTES ? Uint8Array.from(binary, (char) => char.charCodeAt(0)) : null
  } catch {
    return null
  }
}

const fromFriendly = (text: string): TonAddress | null => {
  const bytes = decode(text)
  if (bytes === null) return null
  const tag = bytes[0] & ~TAG_TESTNET
  if (tag !== TAG_BOUNCEABLE && tag !== TAG_NON_BOUNCEABLE) return null
  if (crc16(bytes.subarray(0, CHECKSUM_AT)) !== ((bytes[CHECKSUM_AT] << 8) | bytes[CHECKSUM_AT + 1])) return null
  return {
    workchain: bytes[1] < 128 ? bytes[1] : bytes[1] - 256,
    hash: bytes.slice(HASH_AT, CHECKSUM_AT),
    bounceable: tag === TAG_BOUNCEABLE,
    testnet: (bytes[0] & TAG_TESTNET) !== 0,
  }
}

export const parseAddress = (input: string | null | undefined): TonAddress | null => {
  if (!input) return null
  const raw = RAW_FORM.exec(input)
  if (raw) return fromRaw(raw[1], raw[2])
  return FRIENDLY_FORM.test(input) ? fromFriendly(input) : null
}

export const toRaw = (input: string | null | undefined): string | null => {
  const address = parseAddress(input)
  if (address === null) return null
  const hex = Array.from(address.hash, (byte) => byte.toString(16).padStart(2, "0")).join("")
  return `${address.workchain}:${hex}`
}

export const toFriendly = (input: string, opts: { bounceable?: boolean } = {}): string | null => {
  const address = parseAddress(input)
  if (address === null) return null
  const bytes = new Uint8Array(ADDRESS_BYTES)
  bytes[0] = (opts.bounceable ? TAG_BOUNCEABLE : TAG_NON_BOUNCEABLE) | (address.testnet ? TAG_TESTNET : 0)
  bytes[1] = address.workchain & 0xff
  bytes.set(address.hash, HASH_AT)
  const checksum = crc16(bytes.subarray(0, CHECKSUM_AT))
  bytes[CHECKSUM_AT] = checksum >> 8
  bytes[CHECKSUM_AT + 1] = checksum & 0xff
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

export type Explorer = "tonscan" | "tonviewer"

// The address sits in the path, and its raw form carries a colon.
export const explorerUrl = (address: string, explorer: Explorer = "tonscan"): string => {
  const path = encodeURIComponent(address)
  return explorer === "tonviewer" ? `https://tonviewer.com/${path}` : `https://tonscan.org/address/${path}`
}
