# CONFIGURATION-STATION
> a lazily-made prompt-based "front-end" for configstore, so cli users don't have to screw around with .env or whatever

![](logo.jpg)
## Example

```import confomobile from "./confomobile.js"
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
```