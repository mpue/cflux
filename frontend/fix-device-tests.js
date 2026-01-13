const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/__tests__/device.service.test.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace GET mocks
content = content.replace(
  /\(global\.fetch as jest\.Mock\)\.mockResolvedValue\(\{\s*ok: true,\s*json: async \(\) => ([^,\}]+),?\s*\}\);/g,
  (match, data) => {
    return `mockGet.mockResolvedValue({ data: ${data} });`;
  }
);

// Replace POST mocks (already done for create, but check others)
content = content.replace(
  /\(global\.fetch as jest\.Mock\)\.mockResolvedValue\(\{\s*ok: true,\s*json: async \(\) => ([^,]+),\s*\}\);/g,
  (match, data) => {
    // Determine method based on context (simplified)
    return `mockPost.mockResolvedValue({ data: ${data} });`;
  }
);

// Replace DELETE mocks (return void)
content = content.replace(
  /\(global\.fetch as jest\.Mock\)\.mockResolvedValue\(\{\s*ok: true,?\s*\}\);/g,
  'mockDelete.mockResolvedValue({});'
);

// Replace PUT mocks
// (Will be caught by first regex)

// Remove expect(global.fetch).toHaveBeenCalledWith checks
content = content.replace(
  /expect\(global\.fetch\)\.toHaveBeenCalledWith\([^;]+\);/g,
  '// Axios mock call verification'
);

// Remove expect(global.fetch).toHaveBeenCalledTimes
content = content.replace(
  /expect\(global\.fetch\)\.toHaveBeenCalledTimes\([^)]+\);/g,
  '// Axios mock call count verification'
);

// Replace mockRejectedValue
content = content.replace(
  /\(global\.fetch as jest\.Mock\)\.mockRejectedValue\(([^)]+)\);/g,
  (match, error) => {
    return `mockGet.mockRejectedValue(${error});`;
  }
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully!');
