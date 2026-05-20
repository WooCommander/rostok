import fs from 'fs';
import path from 'path';

const backupDir = path.join(process.cwd(), 'backups', `db_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`);

const filesToBackup = [
  'src/modules/products/data/productsData.ts',
  'src/modules/quiz/data/quizQuestions.ts',
  'src/modules/tips/data/tipsData.ts',
  'src/data/changelog.ts',
  'src/data/plants.ts' // if exists
];

fs.mkdirSync(backupDir, { recursive: true });

filesToBackup.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const fileName = path.basename(filePath);
    fs.copyFileSync(fullPath, path.join(backupDir, fileName));
    console.log(`✅ Copied ${fileName}`);
  } else {
    console.log(`⚠️  File not found, skipping: ${filePath}`);
  }
});

console.log(`\n🎉 Backup created successfully at: ${backupDir}`);
