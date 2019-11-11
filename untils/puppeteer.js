const puppeteer = require('puppeteer');
var fs = require('fs');
var chalk = require('chalk');
const log = console.log;
const TOTAL_PAGE = 50 // 定义需要爬取的网页数量，对应页面下部的跳转链接
async function main() {
    // 首先通过Puppeteer启动一个浏览器环境
    const browser = await puppeteer.launch()
    log(chalk.green('服务正常启动'))
    // 使用 try catch 捕获异步中的错误进行统一的错误处理
    try {
        // 打开一个新的页面
        const page = await browser.newPage()
        // 监听页面内部的console消息
        page.on('console', msg => {
            if (typeof msg === 'object') {
                console.dir(msg)
            } else {
                log(chalk.blue(msg))
            }
        })

        await page.goto('https://www.baidu.com')
        log(chalk.yellow('页面初次加载完毕'))

        const submit = await page.$('#su');
        // 模拟输入要跳转的页数
        await page.type('#kw', 'World', { delay: 100 }); // 输入变慢，像一个用户
        // 模拟点击跳转
        await submit.click()
        await page.waitFor(2500)
        // 清除当前的控制台信息
        // console.clear()
        // 打印当前的爬取进度
        log(chalk.yellow('页面数据加载完毕'))
        // 处理数据，这个函数的实现在下面
        await handleData()
        // 一个页面爬取完毕以后稍微歇歇，不然太快淘宝会把你当成机器人弹出验证码（虽然我们本来就是机器人）
        await page.waitFor(2500)


        // 所有的数据爬取完毕后关闭浏览器
        await browser.close()
        log(chalk.green('服务正常结束'))

        // 这是一个在内部声明的函数，之所以在内部声明而不是外部，是因为在内部可以获取相关的上下文信息，如果在外部声明我还要传入 page 这个对象
        async function handleData() {
            // 现在我们进入浏览器内部搞些事情，通过page.evaluate方法，该方法的参数是一个函数，这个函数将会在页面内部运行，这个函数的返回的数据将会以Promise的形式返回到外部 
            const list = await page.evaluate(() => {

                // 先声明一个用于存储爬取数据的数组
                const writeDataList = []

                let itemList = document.querySelector('.opr-toplist1-table');
                itemList = itemList.getElementsByTagName('tr');

                // 遍历每一个元素，整理需要爬取的数据
                for (let item of itemList) {
                    // 首先声明一个爬取的数据结构
                    let writeData = {
                        index: undefined,
                        title: undefined,
                        view: undefined,
                    }

                    // 找到排行的序号
                    let index = item.querySelector('.c-index')
                    writeData.index = index.innerText
                    // 找到排行的标题
                    let title = item.getElementsByTagName('a')[0]
                    writeData.title = title.innerText

                    // 找到点击量
                    let view = item.querySelector('.opr-toplist1-right')
                    writeData.view = view.innerText

                    // 将这个标签页的数据push进刚才声明的结果数组
                    writeDataList.push(writeData)
                }
                // 当前页面所有的返回给外部环境
                return writeDataList

            })
            console.log(list)

            log(chalk.yellow('写入数据库完毕'))
        }

    }
    catch (error) {
        // 出现任何错误，打印错误消息并且关闭浏览器
        console.log(error)
        log(chalk.red('服务意外终止'))
        await browser.close()
    } finally {
        // 最后要退出进程
        process.exit(0)
    }
}
main()