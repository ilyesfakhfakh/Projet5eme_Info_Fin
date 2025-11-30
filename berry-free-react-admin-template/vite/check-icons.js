const fs = require('fs');
const path = require('path');

// Liste des icônes Material-UI valides (extrait partiel)
const VALID_ICONS = [
  'Add', 'Edit', 'Delete', 'Save', 'Cancel', 'Refresh', 'Search',
  'FilterList', 'Sort', 'MoreVert', 'MoreHoriz', 'Check', 'CheckCircle',
  'Error', 'Warning', 'Info', 'Help', 'Lock', 'LockOpen', 'Security',
  'Shield', 'Person', 'PersonAdd', 'Group', 'AccountCircle', 'Download',
  'Upload', 'FileDownload', 'FileUpload', 'Email', 'Phone', 'Message',
  'Notifications', 'Visibility', 'VisibilityOff', 'Settings', 'Dashboard',
  'Analytics', 'TrendingUp', 'TrendingDown', 'ChevronLeft', 'ChevronRight',
  'ExpandMore', 'ExpandLess', 'Circle', 'Schedule', 'TableChart', 'BarChart',
  'PieChart', 'Timeline', 'History', 'Tune', 'Build', 'Code', 'BugReport',
  'Menu', 'Close', 'ArrowBack', 'ArrowForward', 'Home'
];

// Icônes incorrectes courantes
const ICON_CORRECTIONS = {
  'Unlock': 'LockOpen',
  'UnlockAlt': 'LockOpen',
  'UnlockOutlined': 'LockOpen',
  'UnlockRounded': 'LockOpen',
  'UnlockTwoTone': 'LockOpen',
  'UnlockSharp': 'LockOpen',
  'UnlockFilled': 'LockOpen'
};

function checkIconsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const iconImports = content.match(/import.*from '@mui\/icons-material'/g) || [];
    
    const issues = [];
    
    iconImports.forEach(importLine => {
      // Extraire les icônes de la ligne d'import
      const iconMatches = importLine.match(/(\w+)\s+as\s+(\w+)/g) || [];
      
      iconMatches.forEach(match => {
        const [, iconName, alias] = match.match(/(\w+)\s+as\s+(\w+)/);
        
        if (ICON_CORRECTIONS[iconName]) {
          issues.push({
            file: filePath,
            line: importLine,
            issue: `❌ Icône incorrecte: '${iconName}'`,
            suggestion: `✅ Utiliser: '${ICON_CORRECTIONS[iconName]}'`
          });
        } else if (!VALID_ICONS.includes(iconName)) {
          issues.push({
            file: filePath,
            line: importLine,
            issue: `⚠️  Icône potentiellement incorrecte: '${iconName}'`,
            suggestion: `Vérifier dans la documentation Material-UI`
          });
        }
      });
    });
    
    return issues;
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${filePath}:`, error.message);
    return [];
  }
}

function checkAllFiles() {
  const srcDir = path.join(__dirname, 'src');
  const allIssues = [];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
        const issues = checkIconsInFile(filePath);
        allIssues.push(...issues);
      }
    });
  }
  
  walkDir(srcDir);
  return allIssues;
}

// Exécuter la vérification
console.log('🔍 Vérification des icônes Material-UI...\n');

const issues = checkAllFiles();

if (issues.length === 0) {
  console.log('✅ Aucun problème d\'icône détecté !');
} else {
  console.log(`❌ ${issues.length} problème(s) détecté(s):\n`);
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file}`);
    console.log(`   ${issue.issue}`);
    console.log(`   ${issue.suggestion}`);
    console.log(`   Ligne: ${issue.line}\n`);
  });
  
  console.log('\n📚 Référence des icônes correctes:');
  console.log('https://mui.com/material-ui/material-icons/');
}

module.exports = { checkIconsInFile, checkAllFiles };
