// The {{name}} placeholders of i18next, for the fronts and the package that print a template without it;
// a name with no value stays as it is, so a missing variable shows on the screen instead of vanishing
export const fill = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
