import Configstore from "configstore"
import inquirer from "inquirer"

/**
 * ConfigurationStation - A robust configuration management system with user prompting
 * 
 * @class ConfigurationStation
 * @param {Object} options - Configuration options
 * @param {string} options.appName - Application name for config storage
 * @param {Object} options.config - Schema definition for configuration keys
 * @param {Object} [options.options] - Additional options for Configstore
 */
class ConfigurationStation {
  constructor({ appName = "", config, options = {} }) {
    // Input validation
    if (!appName || typeof appName !== "string") {
      throw new Error("appName must be a non-empty string")
    }
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      throw new Error("config must be a non-null object")
    }

    this.schema = this._validateAndNormalizeSchema(config)
    this.appName = appName
    this._cache = new Map() // Performance optimization: cache for frequently accessed values
    
    try {
      const emptySchema = Object.fromEntries(
        Object.keys(this.schema).map((key) => [key, undefined])
      )
      this.config = new Configstore(appName, emptySchema, options)
    } catch (error) {
      throw new Error(`Failed to initialize configuration store: ${error.message}`)
    }
    
    return this
  }

  /**
   * Validates and normalizes the schema configuration
   * @private
   * @param {Object} schema - Raw schema object
   * @returns {Object} Normalized schema
   */
  _validateAndNormalizeSchema(schema) {
    const normalized = {}
    const validTypes = ["string", "number", "boolean", "password"]
    
    for (const [key, value] of Object.entries(schema)) {
      if (typeof key !== "string" || key.trim() === "") {
        throw new Error(`Invalid schema key: "${key}". Keys must be non-empty strings.`)
      }
      
      if (typeof value === "string") {
        // Legacy format: { key: "type" }
        if (!validTypes.includes(value)) {
          throw new Error(`Invalid type "${value}" for key "${key}". Valid types: ${validTypes.join(", ")}`)
        }
        normalized[key] = { type: value, name: key }
      } else if (typeof value === "object" && value !== null) {
        // Enhanced format: { key: { type: "string", name: "Display Name", description: "...", validate: fn } }
        if (!value.type || !validTypes.includes(value.type)) {
          throw new Error(`Invalid or missing type for key "${key}". Valid types: ${validTypes.join(", ")}`)
        }
        normalized[key] = {
          type: value.type,
          name: value.name || key,
          description: value.description || "",
          validate: typeof value.validate === "function" ? value.validate : null,
          default: value.default
        }
      } else {
        throw new Error(`Invalid schema definition for key "${key}". Expected string type or object with type property.`)
      }
    }
    
    return normalized
  }

  /**
   * Prompts user for a configuration value
   * @param {string} key - Configuration key
   * @param {string} [keyName] - Display name for the prompt (defaults to key)
   * @returns {Promise<any>} The user's input value
   */
  async ask(key, keyName = key) {
    if (!key || typeof key !== "string") {
      throw new Error("Key must be a non-empty string")
    }
    
    if (!this.schema[key]) {
      throw new Error(`Key "${key}" is not defined in the schema`)
    }

    const schemaItem = this.schema[key]
    const existingValue = this.get(key)
    const messageStart = existingValue !== undefined ? "Update" : "Enter"
    const displayName = keyName || schemaItem.name || key

    const options = {
      default: existingValue !== undefined ? existingValue : schemaItem.default,
      message: `${messageStart} ${displayName}:`,
      name: key,
      type: this.translateType(schemaItem.type),
      validate: schemaItem.validate ? (input) => this._validateInput(input, schemaItem.validate, key) : undefined
    }

    // Add description if available
    if (schemaItem.description) {
      options.message += `\n${schemaItem.description}`
    }

    try {
      const answer = await inquirer.prompt(options)
      const value = answer[key]
      
      // Clear cache for this key
      this._cache.delete(key)
      
      this.config.set(key, value)
      return value
    } catch (error) {
      if (error.isTtyError) {
        throw new Error("Interactive prompts are not supported in this environment")
      }
      throw new Error(`Failed to prompt for "${key}": ${error.message}`)
    }
  }

  /**
   * Validates user input using schema validation function
   * @private
   * @param {any} input - User input to validate
   * @param {Function} validator - Validation function
   * @param {string} key - Configuration key
   * @returns {boolean|string} True if valid, error message if invalid
   */
  _validateInput(input, validator, key) {
    try {
      const result = validator(input)
      if (typeof result === "boolean") {
        return result || `Invalid value for ${key}`
      }
      if (typeof result === "string") {
        return result.length === 0 || result
      }
      return true
    } catch (error) {
      return `Validation error for ${key}: ${error.message}`
    }
  }
  /**
   * Deletes a configuration key
   * @param {string} key - Configuration key to delete
   * @returns {Promise<void>}
   */
  async delete(key) {
    if (!key || typeof key !== "string") {
      throw new Error("Key must be a non-empty string")
    }
    
    try {
      this.config.delete(key)
      this._cache.delete(key) // Clear from cache
    } catch (error) {
      throw new Error(`Failed to delete key "${key}": ${error.message}`)
    }
  }

  /**
   * Deletes all configuration data
   * @returns {Promise<void>}
   */
  async deleteAll() {
    try {
      this.config.clear()
      this._cache.clear() // Clear entire cache
    } catch (error) {
      throw new Error(`Failed to clear configuration: ${error.message}`)
    }
  }

  /**
   * Prompts user for all configuration values
   * @param {Object} [schema] - Schema to use (defaults to instance schema)
   * @param {Object} [options] - Options for prompting
   * @param {boolean} [options.skipExisting=false] - Skip keys that already have values
   * @param {string[]} [options.only] - Only prompt for these keys
   * @param {string[]} [options.exclude] - Exclude these keys from prompting
   * @returns {Promise<Object>} All configuration values
   */
  async askAll(schema = this.schema, options = {}) {
    const { skipExisting = false, only = null, exclude = [] } = options
    const keysToProcess = only || Object.keys(schema)
    const filteredKeys = keysToProcess.filter(key => !exclude.includes(key))
    
    const results = {}
    
    for (const key of filteredKeys) {
      if (!schema[key]) {
        console.warn(`Warning: Key "${key}" not found in schema, skipping`)
        continue
      }
      
      const existingValue = this.get(key)
      if (skipExisting && existingValue !== undefined) {
        results[key] = existingValue
        continue
      }
      
      const keyName = schema[key].name || key
      try {
        results[key] = await this.ask(key, keyName)
      } catch (error) {
        console.error(`Failed to prompt for "${key}": ${error.message}`)
        if (existingValue !== undefined) {
          results[key] = existingValue
        }
      }
    }
    
    return results
  }

  /**
   * Gets a configuration value with caching for performance
   * @param {string} key - Configuration key
   * @returns {any} Configuration value
   */
  get(key) {
    if (!key || typeof key !== "string") {
      throw new Error("Key must be a non-empty string")
    }
    
    // Check cache first for performance
    if (this._cache.has(key)) {
      return this._cache.get(key)
    }
    
    try {
      const value = this.config.get(key)
      this._cache.set(key, value) // Cache the result
      return value
    } catch (error) {
      throw new Error(`Failed to get key "${key}": ${error.message}`)
    }
  }

  /**
   * Gets all configuration values
   * @returns {Object} All configuration values
   */
  getAll() {
    try {
      return this.config.all
    } catch (error) {
      throw new Error(`Failed to get all configuration: ${error.message}`)
    }
  }

  /**
   * Sets a configuration value
   * @param {string} key - Configuration key
   * @param {any} value - Value to set
   * @returns {void}
   */
  set(key, value) {
    if (!key || typeof key !== "string") {
      throw new Error("Key must be a non-empty string")
    }
    
    if (!this.schema[key]) {
      throw new Error(`Key "${key}" is not defined in the schema`)
    }
    
    // Validate value if validator exists
    const schemaItem = this.schema[key]
    if (schemaItem.validate) {
      const validation = this._validateInput(value, schemaItem.validate, key)
      if (validation !== true) {
        throw new Error(validation)
      }
    }
    
    try {
      this.config.set(key, value)
      this._cache.set(key, value) // Update cache
    } catch (error) {
      throw new Error(`Failed to set key "${key}": ${error.message}`)
    }
  }

  /**
   * Translates schema type to inquirer prompt type
   * @param {string} type - Schema type
   * @returns {string} Inquirer prompt type
   */
  translateType(type) {
    const typeMap = {
      boolean: "confirm",
      number: "number",
      password: "password",
      string: "input"
    }
    return typeMap[type] || "input"
  }

  /**
   * Gets values or prompts for missing ones
   * @param {Object} [options] - Options for the operation
   * @param {boolean} [options.silent=false] - Don't prompt, just return existing values
   * @returns {Promise<Object>} All configuration values
   */
  async valuesOrPrompts(options = {}) {
    const { silent = false } = options
    
    if (silent) {
      return this.getAll()
    }
    
    for (const key of Object.keys(this.schema)) {
      if (this.get(key) === undefined) {
        try {
          await this.ask(key)
        } catch (error) {
          console.error(`Failed to prompt for "${key}": ${error.message}`)
        }
      }
    }
    return this.getAll()
  }

  /**
   * Validates all current configuration values against their schemas
   * @returns {Object} Validation results
   */
  validateAll() {
    const results = {
      valid: true,
      errors: {},
      warnings: {}
    }
    
    for (const [key, schemaItem] of Object.entries(this.schema)) {
      const value = this.get(key)
      
      if (value === undefined && schemaItem.default === undefined) {
        results.warnings[key] = "No value set and no default provided"
        continue
      }
      
      if (schemaItem.validate && value !== undefined) {
        const validation = this._validateInput(value, schemaItem.validate, key)
        if (validation !== true) {
          results.valid = false
          results.errors[key] = validation
        }
      }
    }
    
    return results
  }

  /**
   * Bulk set multiple configuration values
   * @param {Object} values - Object of key-value pairs to set
   * @param {boolean} [validate=true] - Whether to validate values
   * @returns {Object} Results of the operation
   */
  setBulk(values, validate = true) {
    if (!values || typeof values !== "object" || Array.isArray(values)) {
      throw new Error("Values must be a non-null object")
    }
    
    const results = {
      success: {},
      errors: {}
    }
    
    for (const [key, value] of Object.entries(values)) {
      try {
        if (validate) {
          this.set(key, value)
        } else {
          this.config.set(key, value)
          this._cache.set(key, value)
        }
        results.success[key] = value
      } catch (error) {
        results.errors[key] = error.message
      }
    }
    
    return results
  }

  /**
   * Gets configuration metadata
   * @returns {Object} Metadata about the configuration
   */
  getMetadata() {
    return {
      appName: this.appName,
      schemaKeys: Object.keys(this.schema),
      totalKeys: Object.keys(this.schema).length,
      configuredKeys: Object.keys(this.getAll()).filter(key => this.get(key) !== undefined),
      cacheSize: this._cache.size
    }
  }

  /**
   * Resets configuration to defaults (if defined in schema)
   * @returns {Object} Results of the reset operation
   */
  resetToDefaults() {
    const results = {
      reset: {},
      errors: {}
    }
    
    for (const [key, schemaItem] of Object.entries(this.schema)) {
      if (schemaItem.default !== undefined) {
        try {
          this.set(key, schemaItem.default)
          results.reset[key] = schemaItem.default
        } catch (error) {
          results.errors[key] = error.message
        }
      }
    }
    
    return results
  }

  /**
   * Exports configuration to a plain object
   * @param {Object} [options] - Export options
   * @param {boolean} [options.includeUndefined=false] - Include undefined values
   * @param {string[]} [options.only] - Only export these keys
   * @param {string[]} [options.exclude] - Exclude these keys
   * @returns {Object} Exported configuration
   */
  export(options = {}) {
    const { includeUndefined = false, only = null, exclude = [] } = options
    const allValues = this.getAll()
    const keysToExport = only || Object.keys(allValues)
    const filteredKeys = keysToExport.filter(key => !exclude.includes(key))
    
    const exported = {}
    for (const key of filteredKeys) {
      const value = allValues[key]
      if (includeUndefined || value !== undefined) {
        exported[key] = value
      }
    }
    
    return exported
  }

  /**
   * Imports configuration from a plain object
   * @param {Object} config - Configuration object to import
   * @param {boolean} [validate=true] - Whether to validate imported values
   * @returns {Object} Results of the import operation
   */
  import(config, validate = true) {
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      throw new Error("Config must be a non-null object")
    }
    
    return this.setBulk(config, validate)
  }
}

export default ConfigurationStation
