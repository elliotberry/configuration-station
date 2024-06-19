//a module that creates a config and also returns functions to prompt the user for config things
//the config is stored in a file in the user's home directory
//the config is a json object
import confomobile from "./confomobile.js"
const test = async () => {
  let { set, get, ask, getAll, askAll } = confomobile({
    appName: "myapp",
    config: {
      api_key: "string",
      api_secret: "password",
      dads: "number",
    }
  })
 // await askAll()
  console.log(await getAll())
}
test()
