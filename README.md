# CONFIGURATION-STATION
> A robust, high-performance configuration management system with interactive prompting, validation, and advanced features

![](logo.jpg)

## Features

- 🚀 **High Performance**: Built-in caching and optimized data structures
- 🛡️ **Robust Error Handling**: Comprehensive validation and error recovery
- 📝 **Enhanced Schema Support**: Validation rules, descriptions, and defaults
- 🔄 **Backward Compatible**: Works with existing simple schema format
- 📦 **Bulk Operations**: Efficient batch processing of configuration values
- 🔍 **Validation**: Built-in validation with custom validators
- 📊 **Metadata & Analytics**: Configuration insights and monitoring
- 💾 **Import/Export**: Easy configuration backup and migration
- 🎯 **Type Safety**: Strong typing with comprehensive input validation

## Quick Start

### Basic Usage (Legacy Format)

```javascript
import ConfigurationStation from "configuration-station"

const config = new ConfigurationStation({
  appName: "myapp",
  config: {
    api_key: "string",
    api_secret: "password",
    port: "number",
  }
})

// Prompt for all values
await config.askAll()

// Get all values
console.log(await config.getAll())
```

### Enhanced Usage (New Format)

```javascript
import ConfigurationStation from "configuration-station"

const config = new ConfigurationStation({
  appName: "myapp",
  config: {
    api_key: {
      type: "string",
      name: "API Key",
      description: "Your application's API key",
      validate: (value) => value.length >= 10 || "API key must be at least 10 characters"
    },
    api_secret: {
      type: "password",
      name: "API Secret",
      description: "Your secret key (hidden when typing)"
    },
    port: {
      type: "number",
      name: "Server Port",
      default: 3000,
      validate: (value) => value > 0 && value < 65536 || "Port must be between 1 and 65535"
    },
    debug_mode: {
      type: "boolean",
      name: "Debug Mode",
      default: false
    }
  }
})

// Get values or prompt for missing ones
const values = await config.valuesOrPrompts()

// Validate all configuration
const validation = config.validateAll()
if (!validation.valid) {
  console.error("Configuration errors:", validation.errors)
}
```

## API Reference

### Constructor

```javascript
new ConfigurationStation({ appName, config, options })
```

- `appName` (string): Application name for config storage
- `config` (object): Schema definition for configuration keys
- `options` (object, optional): Additional options for Configstore

### Schema Format

#### Legacy Format (Backward Compatible)
```javascript
{
  key_name: "type" // "string", "number", "boolean", "password"
}
```

#### Enhanced Format
```javascript
{
  key_name: {
    type: "string" | "number" | "boolean" | "password",
    name: "Display Name", // Optional, defaults to key
    description: "Help text", // Optional
    default: "default_value", // Optional
    validate: (value) => boolean | string // Optional validation function
  }
}
```

### Methods

#### Core Methods
- `ask(key, keyName?)` - Prompt user for a specific key
- `askAll(schema?, options?)` - Prompt for all keys with advanced options
- `get(key)` - Get a configuration value (cached for performance)
- `set(key, value)` - Set a configuration value with validation
- `getAll()` - Get all configuration values
- `delete(key)` - Delete a configuration key
- `deleteAll()` - Clear all configuration

#### Advanced Methods
- `valuesOrPrompts(options?)` - Get values or prompt for missing ones
- `validateAll()` - Validate all current values against schema
- `setBulk(values, validate?)` - Set multiple values efficiently
- `export(options?)` - Export configuration to object
- `import(config, validate?)` - Import configuration from object
- `resetToDefaults()` - Reset to schema-defined defaults
- `getMetadata()` - Get configuration metadata and statistics

#### Options

**askAll options:**
- `skipExisting` - Skip keys that already have values
- `only` - Array of keys to prompt for
- `exclude` - Array of keys to exclude

**export options:**
- `includeUndefined` - Include undefined values
- `only` - Array of keys to export
- `exclude` - Array of keys to exclude

## Examples

### Validation Example

```javascript
const config = new ConfigurationStation({
  appName: "validation-example",
  config: {
    email: {
      type: "string",
      name: "Email Address",
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value) || "Please enter a valid email address"
      }
    },
    age: {
      type: "number",
      name: "Age",
      validate: (value) => value >= 18 || "You must be at least 18 years old"
    }
  }
})

// This will validate input in real-time during prompting
await config.askAll()
```

### Bulk Operations Example

```javascript
// Set multiple values at once
const result = config.setBulk({
  api_key: "new-key-12345",
  debug_mode: true,
  port: 8080
})

console.log("Success:", result.success)
console.log("Errors:", result.errors)
```

### Import/Export Example

```javascript
// Export current configuration
const exported = config.export({ exclude: ["api_secret"] })

// Save to file or send to another system
fs.writeFileSync("config-backup.json", JSON.stringify(exported, null, 2))

// Import configuration
const imported = JSON.parse(fs.readFileSync("config-backup.json", "utf8"))
const importResult = config.import(imported)
```

## Performance Features

- **Intelligent Caching**: Frequently accessed values are cached for faster retrieval
- **Bulk Operations**: Efficient batch processing for multiple values
- **Lazy Loading**: Values are loaded only when needed
- **Optimized Storage**: Efficient data structures and storage patterns

## Error Handling

The module provides comprehensive error handling:

- Input validation for all parameters
- Schema validation with detailed error messages
- Graceful handling of file system errors
- TTY detection for non-interactive environments
- Detailed error messages with context

## Migration from Legacy

Existing code using the simple schema format will continue to work without changes. To take advantage of new features, gradually migrate to the enhanced schema format:

```javascript
// Before
config: {
  api_key: "string"
}

// After
config: {
  api_key: {
    type: "string",
    name: "API Key",
    description: "Your application's API key",
    validate: (value) => value.length >= 10 || "API key too short"
  }
}
```