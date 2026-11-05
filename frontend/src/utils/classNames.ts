export const classNames = (...names: (string | false | null | undefined)[]) =>
  names.filter(Boolean).join(' ')
