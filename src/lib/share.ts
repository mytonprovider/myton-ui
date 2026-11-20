// A link shared the way the place allows: the app's own step first when it has one (Telegram's chat picker in a mini
// app), else the system's share sheet, else a copy that the caller's copied mark confirms.
export const shareLink = (url: string, copy: (value: string) => unknown, first?: (url: string) => boolean): void => {
  if (first?.(url)) return
  if (typeof navigator.share === "function") {
    void navigator.share({ url }).catch(() => undefined)
    return
  }
  void copy(url)
}

// A mini app shares itself: its bot's deep link opens the app on the given start parameter.
export const startAppLink = (bot: string, param: string): string => `https://t.me/${bot}?startapp=${param}`
