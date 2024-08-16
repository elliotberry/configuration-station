import Configstore from "configstore"
import inquirer from "inquirer"

class ConfigurationStation {
  constructor({ appName = "", config }) {
    this.schema = config
    this.appName = appName
    const emptySchema = Object.fromEntries(
      Object.keys(this.schema).map((key) => [key, undefined])
    )

    this.config = new Configstore(appName, emptySchema)
  }

  async ask(key, keyName = key) {
    const existingValue = this.get(key)
    const messageStart = existingValue ? "Update" : "Enter"

    const options = {
      default: existingValue,
      message: `${messageStart} ${keyName}:`,
      name: key,
      type: this.translateType(this.schema[key])
    }

    const answer = await inquirer.prompt(options)

    this.config.set(key, answer[key])
    return answer[key]
  }
 async delete(key) {
    this.config.delete(key)
  }
  async deleteAll() {
    this.config.clear()
  }
  async askAll(schema = this.schema) {
    for (const key of Object.keys(schema)) {
      const keyName = schema[key].name || key
      await this.ask(key, keyName)
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

  translateType(type) {
    const typeMap = {
      boolean: "confirm",
      number: "number",
      password: "password",
      string: "input"
    }
    return typeMap[type] || "input"
  }

  async valuesOrPrompts() {
    for (const key of Object.keys(this.schema)) {
      if (this.get(key) === undefined) {
        await this.ask(key)
      }
    }
    return this.getAll()
  }
}

export default ConfigurationStation
