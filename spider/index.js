
const { modelInit } = require('./openFile')
const path = require('path')
const request = require('request')
const cheerio = require('cheerio')

const Redis = require("ioredis")
const myredis = new Redis({
  port: 6379,
  host: '127.0.0.1',
  family: 4,
  password: 'auth',
  db: 2
})

// myredis.set("foo", 1212121)

// const { gotoPage } = require('./puppeter')

// 将读取到的数据转化成数组
async function getPhoneModel () {
  try {
    const phoneModel = await modelInit(path.resolve(__dirname, '../test/phone.txt'))
    const phones = phoneModel.replace(/[\n]/g, ',').split(',')
    console.log('----- 型号读取完成 -----')
    return phones
  } catch (e) {
    console.log('获取失败', e.messgae)
    return []
  }
}

// 开始请求
const req = (option) => new Promise((resolve, reject) => {
  request.get(option, async (error, response, body) => {
    const data = {
      data: body,
      status: response.statusCode,
      error
    }
    if (error) {
      reject(data)
      return
    }
    if (response.statusCode !== 200) {
      reject(data)
      return
    }
    resolve(data)
  })
})

// 开始按照当前的型号数组爬取对应的设备名称
const spiderPhoneName = (phone) => new Promise(async (resolve, reject) => {
  const option = {
    // url: `https://www.sxrom.com/samsung/${phone}/`,
    url: `https://samsung-firmware.org/zh/model/${phone}/page/1/`,
    headers: {
      'Upgrade-Insecure-Requests': 1,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'
    }
    // url: `http://sxrom.com/samsung/${phone}/`
  }
  try {
    // const data = await gotoPage(option)
    // resolve(data)
    const { data } = await req(option)
    // console.log('--------', data)
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
  } catch (e) {
    console.log('-0=-=--', e.message)
    reject(e)
  }
})

// 开始运行
async function run () {
  const phones = await getPhoneModel()
  // const arr = []
  let i = 800
  const asc = async () => {
    if (i >= 1044) {
      console.log('数据完成')
      return
    }
    try {
      const data = await spiderPhoneName(phones[i])
      console.log(i, '-=-=-=', data)
      if (data) {
        if (data === 'error') {
          myredis.lpush('phoneModelError', phones[i])
        } else {
          if (!data[phones[i]].ram) {
            myredis.lpush('phoneModel', JSON.stringify(data))
          } else {
            myredis.lpush('phoneModel1', JSON.stringify(data))
          }
        }
      } else {
        myredis.lpush('errorModel', phones[i])
      }
      // arr.push(data)
    } catch (e) {
      console.log('获取设备名称失败', e.message)
      console.log(`--- ${phones[i]} ---`)
      // return
      myredis.lpush('errorModel', phones[i])
    }
    i ++
    setTimeout(async () => {
      await asc()
    }, 10)
  }
  asc()
}

run()
