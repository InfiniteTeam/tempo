import { readdirSync, statSync } from 'fs'

// https://gist.github.com/kethinov/6658166
export const readAllFiles = (dirPath: string, fileList: string[] = []) => {
  const files = readdirSync(dirPath)
  for (const file of files) {
    const filePath = dirPath + '/' + file
    const stat = statSync(filePath)

    if (stat.isFile()) fileList.push(filePath)
    else fileList = readAllFiles(filePath, fileList)
  }

  return fileList
}

export const formatSeconds = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secondsLeft = seconds % 60
  if (hours === 0 && minutes === 0) return `${secondsLeft}초`
  if (hours === 0) return `${minutes}분 ${secondsLeft}초`
  return `${hours}시간 ${minutes}분 ${secondsLeft}초`
}
