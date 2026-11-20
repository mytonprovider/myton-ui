// The Clipboard API is missing over plain http and refused in some webviews; the old textarea copy still works
// there. Inside an open <dialog> the textarea goes into the dialog, since a modal dialog makes the rest of the page
// inert and the selection outside it copies nothing.
const copyBySelection = (value: string): boolean => {
  const host = document.querySelector("dialog[open]") ?? document.body
  const area = document.createElement("textarea")
  area.value = value
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.opacity = "0"
  host.append(area)
  area.select()
  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    area.remove()
  }
}

export const copyText = async (value: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return copyBySelection(value)
  }
}
