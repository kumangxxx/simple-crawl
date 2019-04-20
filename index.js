'use strict'

const Request = require('request')
const $ = require('cheerio')

let App = require('express')()
let bp = require('body-parser')

App.use(bp.json())

let key = 'kumang'
let crypto = require('crypto')

let fetchData = (url) => new Promise((s, r) => {
    Request.get(url, {
        rejectUnauthorized: false
    }, (err, resp, body) => {
        if (err) return r(err)
        else s(body)
    })
})

let crawl = (url, selector) => {
    return fetchData(url)
    .then(html => {
        let page = $(html)
        let obj = page.find(selector)

        let length = obj.length
        console.log('[crawl] object length', length)
        if (length < 1) return {
            ok: false,
            crawldata: null
        }


        let name = obj.get(0).name
        if (name === 'table') {
            let rows = obj.find('tr')
            console.log('[crawl] rows', rows.length)
            let tabledata = []
            let keys = []

            rows.each(function(ridx, row) {
                if (ridx === 0) {
                    let cols = $(row).find('td')
                    console.log('[crawl]', cols.length, ' columns')
                    cols.each(function(cidx, col) {
                        let key = $(col).text()
                        keys.push(key)
                    })
                    console.log('[crawl] keys', keys)
                } else {
                    let datas = $(row).find('td')
                    let data = {}
                    datas.each(function(didx, rowdata) {
                        let k = keys[didx]
                        data[k] = $(rowdata).text()
                    })
                    tabledata.push(data)
                }
            })
            
            return {
                ok: true,
                crawldata: tabledata
            }
        } else {
            return {
                ok: false,
                crawldata: null
            }
        }
    })
}

App.post('/check', (req, res) => {
    let url = req.body.url
    let selector = req.body.selector

    crawl(url, selector)
    .then(result => {
        let data = result.crawldata
        let datastring = JSON.stringify(data)
        let shasum = crypto.createHash('sha1')
        shasum.update(datastring)
        let id = shasum.digest('hex')
        result.id = id
        res.json(result)
    })
    .catch(err => {
        console.log(err)
        res.json({
            ok: false,
            crawldata: null
        })
    })
})


App.listen(3000, () => {
    console.log('[app] server up')
    // crawl('https://www.plnbatam.com/informasi-pemadaman/', '.table-bright')
    // .then(console.log)
    // .catch(console.log)
})