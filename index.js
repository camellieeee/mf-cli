const yoemanEnv = require('yeoman-environment').createEnv()
const execSync = require('child_process').execSync
const resolveFrom = require('resolve-from').silent
const requireFrom = require('import-from').silent
const minimist = require('minimist')
const inquirer = require('inquirer')
const homeDir = require('osenv').home() // 跨平台
const mkdirp = require('mkdirp') // 跨平台
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

const pkg = require('./package.json')
const Utils = require('./utils')

const tplDir = path.resolve(homeDir, '.mofei')
const args = minimist(process.argv)
const cmdDirName = 'script'

class M extends Utils {
  constructor(args) {
    super()
    this.args = args
    this.bindTools()
    this.checkTplDir()
    const cmdArr = fs.readdirSync(path.resolve(__dirname, cmdDirName)).map(item => item.split('.')[0])
    if (!cmdArr.includes(process.argv[2])) throw new Error(`没有该命令 ${process.argv[2]}，请使用以下命令 JSON.stringify(cmdArr)`)
    const cmd = require(path.resolve(__dirname, cmdDirName, process.argv[2]))
    this.checkCliUpdate()
    cmd.call(this) // script 里的命令函数可读取 this 实例
  }

  bindTools() {
    this.chalk = chalk
    this.resolveFrom = resolveFrom
    this.requireFrom = requireFrom
    this.dir = {
      home: homeDir,
      tpl: tplDir,
      cwd: process.cwd(),
    }
    this.yoemanEnv = yoemanEnv
    this.inquirer = inquirer
  }
  
  checkTplDir() {
    mkdirp(this.dir.tpl)
    const pkgFile = path.resolve(this.dir.tpl, 'package.json')
    if (!fs.existsSync(pkgFile)) {
      fs.writeFileSync(pkgFile, JSON.stringify({ name: '_', description: '_', repository: '_', license: 'MIT' }))
    }
  }

  checkCliUpdate() {
    const pkgName = pkg.name
    const version = pkg.version
    const ltsVersion = execSync(`npm view ${pkgName} version --registry=https://registry.npm.taobao.org`) + '' // 返回 buffer 转 string
    if (ltsVersion.trim() !== version) this.console(`cli 版本过旧，建议执行 npm i -g ${pkgName}@latest 升级 cli： ${version} -> ${ltsVersion} `)
  }
  
  console(data, color = 'yellow') {
    const fn = chalk[color] || chalk.yellow
    console.log(fn(data))
  }
}

module.exports = new M(args)
