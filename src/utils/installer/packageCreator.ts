
import { 
  createInstallerPHP, 
  createReadme, 
  createIndexPHP, 
  createHtaccess, 
  createTestPHP, 
  createConfigPHP, 
  createHtaccessReadme 
} from './templates';

export interface PackageFile {
  path: string;
  content: string;
  directory?: boolean;
}

/**
 * Creates all the files needed for the installation package
 */
export const createPackageFiles = (): PackageFile[] => {
  const files: PackageFile[] = [
    // Root files
    { path: 'install.php', content: createInstallerPHP() },
    { path: 'README.md', content: createReadme() },
    
    // API directory 
    { path: 'api', directory: true },
    { path: 'api/index.php', content: createIndexPHP() },
    { path: 'api/.htaccess', content: createHtaccess() },
    { path: 'api/test.php', content: createTestPHP() },
    { path: 'api/config.php', content: createConfigPHP() },
    { path: 'api/htaccess_readme.md', content: createHtaccessReadme() },
    
    // Data directory
    { path: 'api/data', directory: true },
    { path: 'api/data/.gitkeep', content: '' },
  ];
  
  return files;
};
