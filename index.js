import Configstore from "configstore"
import inquirer from "inquirer"

class ConfigurationStation {
  constructor({appName = "", config}) {
    this.schema = config
    this.appName = appName
    const emptySchema = Object.keys(this.schema).reduce((acc, key) => {
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
    const opts = {
      type: this.translateType(this.schema[key]),
      name: key,
      message: `${messageStart} ${keyName}:`
    }
    if (existingVal) {
      opts.default = existingVal
    }

    const answer = await inquirer.prompt(opts)

    this.config.set(key, answer[key])
    return answer[key]
  }

  async askAll(schema = this.schema) {
    let keyz = Object.keys(schema)
    for await (let key of keyz) {
      let keyName = key
      if (schema[key].name) {
        keyName = schema[key].name
      }
      await this.ask(key, keyName)
    }
  }
  async valuesOrPrompts() {
    for await (const key of Object.keys(this.schema)) {
      if (this.get(key) === undefined) {
        await this.ask(key)
      }
    }
    return this.getAll()
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


export default ConfigurationStation
