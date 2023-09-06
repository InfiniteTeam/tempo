import 'dotenv/config'
import config from './config.js'
import chalk from 'chalk'
import * as Sentry from '@sentry/node'

Sentry.init(config.sentry)

const main = async () => {
  console.log(
    chalk.cyanBright(`
                    =========================================================
  
  
                                ${config.name}@${config.BUILD_NUMBER}
                              Version : ${config.BUILD_VERSION}
  
  
                    =========================================================`)
  )

  import('./bot')
}

main()
