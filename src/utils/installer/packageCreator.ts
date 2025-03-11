
import { 
  createInstallerPHP, 
  createReadme, 
  createIndexPHP, 
  createHtaccess, 
  createTestPHP, 
  createConfigPHP, 
  createHtaccessReadme,
  createReactIndexHTML,
  createReactAppJS,
  createReactStyles,
  createFrontendHtaccess
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
    { path: 'api', content: '', directory: true },
    { path: 'api/index.php', content: createIndexPHP() },
    { path: 'api/.htaccess', content: createHtaccess() },
    { path: 'api/test.php', content: createTestPHP() },
    { path: 'api/config.php', content: createConfigPHP() },
    { path: 'api/htaccess_readme.md', content: createHtaccessReadme() },
    
    // API data directory
    { path: 'api/data', content: '', directory: true },
    { path: 'api/data/.gitkeep', content: '' },
    
    // Frontend files (for single-page React app)
    { path: 'frontend', content: '', directory: true },
    { path: 'frontend/index.html', content: createReactIndexHTML() },
    { path: 'frontend/.htaccess', content: createFrontendHtaccess() },
    
    // Frontend assets directory
    { path: 'frontend/assets', content: '', directory: true },
    { path: 'frontend/assets/app.js', content: createReactAppJS() },
    { path: 'frontend/assets/styles.css', content: createReactStyles() },
    
    // Include a sample favicon
    { path: 'frontend/favicon.ico', content: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAC8vLwAvLy8A7y8vAa8vLwGvLy8Bry8vAa8vLwGvLy8Bry8vAO8vLwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvLy8ALy8vA+8vLxKvLy8bLy8vGy8vLxsvLy8bLy8vEq8vLwPvLy8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALy8vAC8vLwfvLy8bryZXP+8mVz/vJlc/7yZXP+8vLxuvLy8H7y8vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACXV0sAm15RAJtfUZ+XVUn/l1VJ/5dVSf+XVUn/m19Rn5xgUgCYWEwAAAAAAAAAAAAAAAAAAAAAAAAAAACZW08AmV1RAJleUpebXlH/7ubf/+7m3//bxbn/mV5SlpldUACZXVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAK6CagCqfWWUz66c//////////////////TKrf+qfWWPqXxkAKh6YQAAAAAAAAAAAAAAAAAAAAAAvLy8ALy8vA28vLxkvJpd//Lo4P////////////////+4jGj/vLy8ZLy8vA28vLwAAAAAAAAAAACofWUApnthAKd8Y1q7kW7/1bSk/+3l3v/l2NH/5LqP////////////toVh/6d8Y1mnfWUAp31lAAAAAACXVUkAl1VJAJZUSJ+ufWb/1bSk/9fIvf/07+z/9fDt////////////uYpk/5dVSZ+WVEgAllRIAAAAAACbX1EAm2BSAJtgUpamaFf/8Ozn///////////////////////07+z/m2BSl5tgUgCbYFIAAAAAAAAAAAAAAAAAm2BSAJtgUo6teGH/+/n3///////////////////////07+z/m2BSj5tgUgCbYFIAAAAAAAAAAAAAAAAAAAAAAJtgUgCbYFJ5n1pM/+nZzv///////////+nZzv+fWkz/m2BSepxiVACcYlQAAAAAAAAAAAAAAAAAAAAAAJtgUgCbYFIAm2BScZtgUpGbYFKRm2BSf5tgUnGbYFJxm2BSRJtgUgCbYFIAAAAAAAAAAAAAAAAAAAAAAAAAAACbYFIAm2BSAJtgUgCbYFIAm2BSAJtgUgCbYFIAm2BSAJtgUgCbYFIAAAAAAAAAAAAAAAAA8A8AAOAHAADgBwAAwAMAAMADAACAAQAAgAEAAIABAACAAQAAgAEAAIABAACAAQAAwAMAAMADAADgBwAA8A8AAA==' },
  ];
  
  return files;
};
