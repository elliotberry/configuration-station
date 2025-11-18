import ConfigurationStation from "./index.js"
const test = async () => {
  let config = new ConfigurationStation({
    appName: "assman",
    config: {
      api_key: "string",
      api_secret: "password",
      dads: "number"
    }
  })
  await config.askAll()
}
test()