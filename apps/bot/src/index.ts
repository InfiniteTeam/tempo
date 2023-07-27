import 'dotenv/config'
import config from './config.js'
import chalk from 'chalk'

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
