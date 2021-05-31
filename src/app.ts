import Browser from './browser'

const browser = new Browser(true)

async function initialise(): Promise<void> {
  await browser.start()
  await browser.schoolThread()
  browser.output()
}

void initialise()
