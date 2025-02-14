import http from 'http'

export class AutoSyncService {
  private static instance: AutoSyncService
  private interval: NodeJS.Timeout | null = null
  
  private constructor() {}

  static getInstance(): AutoSyncService {
    if (!AutoSyncService.instance) {
      AutoSyncService.instance = new AutoSyncService()
    }
    return AutoSyncService.instance
  }

  start(): void {
    const minutes = 30
    if (!this.interval) {
      this.interval = setInterval(this.callLightsApi, minutes * 60 * 1000)
      console.log(`Lights auto-sync service started - will call API every ${minutes} minutes`)
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
      console.log('Lights auto-sync service stopped')
    }
  }

  private callLightsApi(): void {
    const options = {
      hostname: '192.168.18.4',
      port: 3000,
      path: '/api/lights',
      method: 'GET'
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        console.log('Scheduled lights API call completed:', data)
      })
    })

    req.on('error', (error) => {
      console.error('Error in scheduled lights API call:', error)
    })

    req.end()
  }
}

// Start the auto-sync service when the module is imported
AutoSyncService.getInstance().start()

// Handle cleanup on process termination
process.on("SIGINT", () => {
  AutoSyncService.getInstance().stop()
})

process.on("SIGTERM", () => {
  AutoSyncService.getInstance().stop()
})
