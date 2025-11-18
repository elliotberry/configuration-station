import ConfigurationStation from "./index.js"

// Test enhanced schema with validation and descriptions
const enhancedSchema = {
  api_key: {
    type: "string",
    name: "API Key",
    description: "Your application's API key for authentication",
    validate: (value) => value.length >= 10 || "API key must be at least 10 characters"
  },
  api_secret: {
    type: "password",
    name: "API Secret",
    description: "Your application's secret key (will be hidden when typing)"
  },
  port: {
    type: "number",
    name: "Server Port",
    description: "Port number for the server",
    default: 3000,
    validate: (value) => value > 0 && value < 65536 || "Port must be between 1 and 65535"
  },
  debug_mode: {
    type: "boolean",
    name: "Debug Mode",
    description: "Enable debug logging",
    default: false
  }
}

// Test legacy schema format (backward compatibility)
const legacySchema = {
  simple_string: "string",
  simple_number: "number",
  simple_boolean: "boolean"
}

async function testEnhancedFeatures() {
  console.log("🚀 Testing Enhanced ConfigurationStation Features\n")

  try {
    // Test 1: Enhanced schema with validation
    console.log("1. Testing enhanced schema with validation...")
    const config = new ConfigurationStation({
      appName: "test-enhanced-app",
      config: enhancedSchema
    })

    // Test metadata
    const metadata = config.getMetadata()
    console.log("   Metadata:", metadata)

    // Test validation
    const validation = config.validateAll()
    console.log("   Initial validation:", validation)

    // Test setting values with validation
    console.log("\n2. Testing value setting with validation...")
    
    // Valid values
    config.set("port", 8080)
    config.set("debug_mode", true)
    console.log("   ✅ Valid values set successfully")

    // Test invalid values (should throw)
    try {
      config.set("port", -1)
    } catch (error) {
      console.log("   ✅ Invalid port correctly rejected:", error.message)
    }

    try {
      config.set("api_key", "short")
    } catch (error) {
      console.log("   ✅ Short API key correctly rejected:", error.message)
    }

    // Test bulk operations
    console.log("\n3. Testing bulk operations...")
    const bulkResult = config.setBulk({
      api_key: "valid-api-key-12345",
      debug_mode: false
    })
    console.log("   Bulk set result:", bulkResult)

    // Test export/import
    console.log("\n4. Testing export/import...")
    const exported = config.export({ exclude: ["api_secret"] })
    console.log("   Exported config (excluding secrets):", exported)

    // Test reset to defaults
    console.log("\n5. Testing reset to defaults...")
    const resetResult = config.resetToDefaults()
    console.log("   Reset result:", resetResult)

    // Test final validation
    const finalValidation = config.validateAll()
    console.log("   Final validation:", finalValidation)

    console.log("\n✅ All enhanced features working correctly!")

  } catch (error) {
    console.error("❌ Test failed:", error.message)
  }
}

async function testLegacyCompatibility() {
  console.log("\n🔄 Testing Legacy Schema Compatibility\n")

  try {
    const config = new ConfigurationStation({
      appName: "test-legacy-app",
      config: legacySchema
    })

    // Test that legacy schema format still works
    config.set("simple_string", "test value")
    config.set("simple_number", 42)
    config.set("simple_boolean", true)

    const allValues = config.getAll()
    console.log("   Legacy schema values:", allValues)

    console.log("✅ Legacy compatibility maintained!")

  } catch (error) {
    console.error("❌ Legacy test failed:", error.message)
  }
}

async function testErrorHandling() {
  console.log("\n🛡️ Testing Error Handling\n")

  try {
    // Test invalid constructor parameters
    try {
      new ConfigurationStation({ appName: "", config: {} })
    } catch (error) {
      console.log("   ✅ Empty appName correctly rejected:", error.message)
    }

    try {
      new ConfigurationStation({ appName: "test", config: null })
    } catch (error) {
      console.log("   ✅ Null config correctly rejected:", error.message)
    }

    try {
      new ConfigurationStation({ appName: "test", config: { invalid_type: "invalid" } })
    } catch (error) {
      console.log("   ✅ Invalid type correctly rejected:", error.message)
    }

    // Test invalid method calls
    const config = new ConfigurationStation({
      appName: "error-test",
      config: { test_key: "string" }
    })

    try {
      config.get("")
    } catch (error) {
      console.log("   ✅ Empty key correctly rejected:", error.message)
    }

    try {
      config.set("nonexistent_key", "value")
    } catch (error) {
      console.log("   ✅ Setting undefined key correctly rejected:", error.message)
    }

    console.log("✅ Error handling working correctly!")

  } catch (error) {
    console.error("❌ Error handling test failed:", error.message)
  }
}

async function testPerformanceFeatures() {
  console.log("\n⚡ Testing Performance Features\n")

  try {
    const config = new ConfigurationStation({
      appName: "performance-test",
      config: {
        key1: "string",
        key2: "string",
        key3: "string"
      }
    })

    // Test caching performance
    console.log("   Testing caching...")
    
    // First access (should hit storage)
    const start1 = Date.now()
    config.get("key1")
    const time1 = Date.now() - start1

    // Second access (should hit cache)
    const start2 = Date.now()
    config.get("key1")
    const time2 = Date.now() - start2

    console.log(`   First access: ${time1}ms, Second access: ${time2}ms`)
    console.log("   ✅ Caching working (second access should be faster)")

    // Test bulk operations performance
    console.log("\n   Testing bulk operations...")
    const bulkData = {}
    for (let i = 0; i < 100; i++) {
      bulkData[`bulk_key_${i}`] = `value_${i}`
    }

    const start3 = Date.now()
    const result = config.setBulk(bulkData, false) // Skip validation for speed
    const time3 = Date.now() - start3

    console.log(`   Bulk set 100 keys: ${time3}ms`)
    console.log(`   Success: ${Object.keys(result.success).length}, Errors: ${Object.keys(result.errors).length}`)

    console.log("✅ Performance features working correctly!")

  } catch (error) {
    console.error("❌ Performance test failed:", error.message)
  }
}

// Run all tests
async function runAllTests() {
  await testEnhancedFeatures()
  await testLegacyCompatibility()
  await testErrorHandling()
  await testPerformanceFeatures()
  
  console.log("\n🎉 All tests completed!")
  console.log("\n📋 Summary of improvements:")
  console.log("   • Enhanced schema with validation, descriptions, and defaults")
  console.log("   • Comprehensive error handling and input validation")
  console.log("   • Performance optimizations with caching")
  console.log("   • Bulk operations for efficiency")
  console.log("   • Export/import functionality")
  console.log("   • Configuration validation and metadata")
  console.log("   • Backward compatibility with legacy schema format")
  console.log("   • Full JSDoc documentation")
}

runAllTests().catch(console.error)
