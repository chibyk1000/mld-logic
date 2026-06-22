import { useEffect, useState } from 'react'
import { Button } from './ui/button'

export function UpdateManager() {
  const [status, setStatus] = useState<string>('')
  const [hasUpdate, setHasUpdate] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false)

  useEffect(() => {
    // text is inferred as string
    window.api.onUpdateStatus((text) => setStatus(text))

    // error is inferred as string
    window.api.onUpdateError((err) => setStatus(`Error: ${err}`))

    // info is strictly typed as UpdateInfo (has autocomplete for info.version, info.releaseNotes, etc.)
    window.api.onUpdateAvailable((info) => {
      setStatus(`New version ${info.version} available!`)
      setHasUpdate(true)
    })

    // percent is inferred as number
    window.api.onUpdateProgress((percent) => {
      setProgress(Math.round(percent))
    })

    window.api.onUpdateDownloaded(() => {
      setIsDownloaded(true)
      setStatus('Download complete. Ready to install!')
    })
  }, [])

  return (
    <div className="update-container py-2">
     

      {!hasUpdate && (
        <Button variant={"link"} onClick={() => window.api.checkForUpdate()} className=''>Check for Updates</Button>
      )}

      {hasUpdate && !isDownloaded && progress === 0 && (
        <Button onClick={() => window.api.startDownload()}>Download Update</Button>
      )}

      {progress > 0 && !isDownloaded && <div>Downloading: {progress}%</div>}

      {isDownloaded && (
        <Button onClick={() => window.api.quitAndInstall()}>Restart & Install</Button>
      )}
    </div>
  )
}
