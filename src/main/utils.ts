export const isDev = (): boolean => {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
}

export const getAssetPath = (path: string): string => {
  if (isDev()) {
    return path
  }
  return `file://${__dirname}/../renderer/${path}`
}
