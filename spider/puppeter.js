const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const o = {
  headless: false,
  defaultViewport: {
    width: 1920,
    height: 840
  }
}

// 开始请求网页
const gotoPage = (option) => new Promise(async (resolve, reject) => {
  try {
    const browser = await puppeteer.launch(o)
    const page = await browser.newPage()
    page.on('response', async (response) => {
      if (response.status() !== 200) {
        resolve('')
        return
      }
      if (response.url() === option.url) {
        const data = await response.text()
        const $ = cheerio.load(data)
        const tr = $('#firm-table tbody tr')
        if (tr.length > 1) {
          const td = tr.eq(0).find('td')
          const fContent = $('div.f-content').eq(0)
          // console.log(data)
          if (!fContent) {
            console.log('获取不到设备详情')
            resolve('')
            return
          }
          if (!td.eq(1).text().replace(/\s/g, '') || !td.eq(0).text().replace(/\s/g, '')) {
            console.log(td.eq(1).text().replace(/\s/g, ''), '---', td.eq(0).text().replace(/\s/g, ''))
            resolve('')
            return
          }
          const obj = {}
          console.log('-=-=-=-', fContent.find('div.three').eq(0).find('p'))
          obj[td.eq(1).text().replace(/\s/g, '')] = {
            device_name: td.eq(0).text().replace(/\s/g, ''),
            ram: fContent.find('div.three').eq(0).find('p').eq(0).text().replace(/\s/g, ''),
            size: fContent.find('div.one').eq(0).find('p').eq(0).text().replace(/\s/g, ''),
            size_name: fContent.find('div.one').eq(0).find('h4').eq(0).text().replace(/\s/g, ''),
            weight: fContent.find('div.dw__wes').eq(0).find('p').eq(0).text().replace(/\s/g, ''),
            time: fContent.find('div.dw__dat').eq(0).find('p').eq(0).text().replace(/\s/g, ''),
            milliamp: fContent.find('div.dw__ak').eq(0).find('p').eq(0).text().replace(/\s/g, '')
          }
          resolve(obj)
        } else {
          console.log('---', tr.length)
          resolve('')
        }
      }
    })
    page.on('error', () => {
      resolve('')
    })
    await page.goto(option.url)
    await page.screenshot({path: 'example.png'})

    // await browser.close()
  } catch (e) {
    console.log('error', e.message)
    resolve('error')
  }
})

module.exports = {
  gotoPage
}
