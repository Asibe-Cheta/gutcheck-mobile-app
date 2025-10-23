#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const podspecPath = path.join('node_modules', 'expo-router', 'ios', 'ExpoHead.podspec');

if (fs.existsSync(podspecPath)) {
  let content = fs.readFileSync(podspecPath, 'utf8');
  
  // Replace the problematic line with a guarded version
  const originalLine = 'add_dependency(s, "RNScreens")';
  const patchedLine = `begin
  add_dependency(s, "RNScreens")
rescue => e
  # RNScreens dependency failed, continuing without it
  puts "Warning: Could not add RNScreens dependency: \#{e.message}"
end`;
  
  if (content.includes(originalLine)) {
    content = content.replace(originalLine, patchedLine);
    fs.writeFileSync(podspecPath, content);
    console.log('✅ Successfully patched ExpoHead.podspec');
  } else {
    console.log('ℹ️  ExpoHead.podspec already patched or line not found');
  }
} else {
  console.log('⚠️  ExpoHead.podspec not found at expected path');
}
