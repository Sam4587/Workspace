import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '../docs');
const results = {
  totalFiles: 0,
  withMetadata: 0,
  withoutMetadata: 0,
  issues: []
};

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(docsDir, filePath);
  
  results.totalFiles++;
  
  const lines = content.split('\n');
  
  if (lines[0] === '---') {
    results.withMetadata++;
    
    const endMetadata = lines.indexOf('---', 1);
    if (endMetadata === -1) {
      results.issues.push({
        file: relativePath,
        issue: '元数据未正确关闭'
      });
    }
  } else {
    results.withoutMetadata++;
    results.issues.push({
      file: relativePath,
      issue: '缺少元数据头部'
    });
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.md')) {
      checkFile(filePath);
    }
  }
}

console.log('开始验证文档标准...\n');
scanDirectory(docsDir);

console.log(`总文件数: ${results.totalFiles}`);
console.log(`有元数据: ${results.withMetadata} (${((results.withMetadata / results.totalFiles) * 100).toFixed(1)}%)`);
console.log(`无元数据: ${results.withoutMetadata} (${((results.withoutMetadata / results.totalFiles) * 100).toFixed(1)}%)`);

if (results.issues.length > 0) {
  console.log('\n发现的问题:');
  results.issues.forEach(issue => {
    console.log(`  - ${issue.file}: ${issue.issue}`);
  });
} else {
  console.log('\n✅ 所有文档都符合标准！');
}