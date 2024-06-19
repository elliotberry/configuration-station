import Configstore from "configstore"
import readline from "readline"
import inquirer from "inquirer"

class Confomobile {
  constructor(appName = "", schema) {
   
    this.schema = schema
    this.appName = appName
    let emptySchema = Object.keys(schema).reduce((acc, key) => {
      acc[key] = undefined
      return acc
    }, {})

    this.config = new Configstore(appName, emptySchema)
  }
  translateType(type) {
    switch (type) {
      case "string":
        return "input"
      case "number":
        return "number"
      case "boolean":
        return "confirm"
      case "password":
        return "password"
      default:
        return "input"
    }
  }
  async ask(key, keyName = key) {
    let messageStart = "Enter"
    let existingVal = undefined
    if (this.get(key)) {
      messageStart = "Update"
      existingVal = this.get(key)
    }
    let opts = {
      type: this.translateType(this.schema[key]),
      name: key,
      message: `${messageStart} ${keyName}:`
    }
    if (existingVal) {
      opts.default = existingVal
    }

    const answer = await inquirer.prompt(opts)
    this.config.set(key, answer)
    return answer[key]
  }

  async askAll(schema = this.schema) {
    for await (const key of Object.keys(schema)) {
      let keyName = key
      if (schema[key].name) {
        keyName = schema[key].name
      }
      const answer = await this.ask(key, keyName)
      this.config.set(key, answer)
    }
  }
  async askForMissing() {
    for await (const key of Object.keys(this.schema)) {
      if (this.get(key) === undefined) {
        await this.ask(key)
      }
    }
  }
  get(key) {
    return this.config.get(key)
  }

  getAll() {
    return this.config.all
  }

  set(key, value) {
    this.config.set(key, value)
  }
}

const confomobile = ({ appName, config }) => {
  const confo = new Confomobile(appName, config)
  const set = confo.set.bind(confo)
  const get = confo.get.bind(confo)
  const ask = confo.ask.bind(confo)
  const askAll = confo.askAll.bind(confo)
  const getAll = confo.getAll.bind(confo)
const askForMissing = confo.askForMissing.bind(confo)
  return { set, get, ask, getAll, askAll, askForMissing }
}
export default confomobile
