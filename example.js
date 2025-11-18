//a module that creates a config and also returns functions to prompt the user for config things
//the config is stored in a file in the user's home directory
//the config is a json object
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

//example2 of a config file: 
const config2 = new ConfigurationStation({
    appName: "dscimg",
    config: {
        cloudflareAIToken: "string",
        cloudflareEndpoint: "string",
    },
})

//export default config2
test()
