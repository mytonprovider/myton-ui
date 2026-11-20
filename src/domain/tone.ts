export type Tone = "green" | "yellow" | "orange" | "red" | "gray" | "accent"

export type StatusTone = Exclude<Tone, "accent">
