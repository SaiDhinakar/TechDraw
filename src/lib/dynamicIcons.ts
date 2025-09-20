// Dynamic icon loading service - reads icons folder directly

export interface PublicIcon {
  id: string;
  name: string;
  fileName: string;
  path: string;
  category?: string;
}

class PublicIconService {
  private icons: PublicIcon[] = [];
  private loaded = false;

  async getAllIcons(): Promise<PublicIcon[]> {
    if (!this.loaded) {
      await this.loadIcons();
    }
    return this.icons;
  }

  async searchIcons(query: string): Promise<PublicIcon[]> {
    const allIcons = await this.getAllIcons();
    if (!query.trim()) {
      return allIcons;
    }
    
    const searchTerm = query.toLowerCase();
    return allIcons.filter(icon =>
      icon.name.toLowerCase().includes(searchTerm) ||
      icon.fileName.toLowerCase().includes(searchTerm)
    );
  }

  async getIconByName(name: string): Promise<PublicIcon | null> {
    const allIcons = await this.getAllIcons();
    return allIcons.find(icon => 
      icon.name.toLowerCase() === name.toLowerCase() ||
      icon.fileName.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  private async loadIcons(): Promise<void> {
    try {
      // Smart approach: discover icons by scanning the actual folder
      const iconFiles = await this.discoverIconsByScanning();
      
      if (iconFiles.length === 0) {
        console.warn('❌ No icons found in /icons folder. Please add icon files (.png, .svg, .jpg, .jpeg) to the public/icons directory.');
        this.icons = [];
      } else {
        this.icons = iconFiles.map((fileName: string, index: number) => {
          const nameWithoutExt = fileName.replace(/\.(png|svg|jpg|jpeg)$/i, '');
          
          return {
            id: `icon-${index + 1}`,
            name: this.formatIconName(nameWithoutExt),
            fileName,
            path: `/icons/${fileName}`,
            category: this.categorizeIcon(nameWithoutExt)
          };
        });
        
        console.log(`✅ Successfully loaded ${this.icons.length} icons from /icons folder`);
        console.log(`📋 Icon categories:`, [...new Set(this.icons.map(icon => icon.category))]);
      }
      
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load icons:', error);
      this.icons = [];
      this.loaded = true;
    }
  }

  private async discoverIconsByScanning(): Promise<string[]> {
    console.log('🔍 Discovering icons from the actual /icons folder...');
    
    try {
      // Method 1: Try to fetch the generated manifest (most efficient)
      const icons = await this.loadFromManifest();
      if (icons.length > 0) {
        console.log(`✅ Found ${icons.length} icons via manifest file`);
        return icons;
      }
    } catch (error) {
      console.log('📄 Manifest not available, trying directory listing...');
    }

    try {
      // Method 2: Try to fetch the directory listing (works with some dev servers)
      const icons = await this.tryDirectoryListing();
      if (icons.length > 0) {
        console.log(`✅ Found ${icons.length} icons via directory listing`);
        return icons;
      }
    } catch (error) {
      console.log('📂 Directory listing not available, falling back to smart scanning...');
    }

    // Method 3: Smart scanning - try common patterns and file extensions
    return await this.smartIconScanning();
  }

  private async loadFromManifest(): Promise<string[]> {
    try {
      const response = await fetch('/icon-manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        console.log(`📋 Loaded manifest with ${manifest.totalIcons} icons (generated: ${manifest.generated})`);
        return manifest.icons || [];
      }
    } catch (error) {
      console.log('📄 Failed to load manifest:', error);
    }
    return [];
  }

  private async tryDirectoryListing(): Promise<string[]> {
    // Try to fetch a directory listing (works in some development environments)
    try {
      const response = await fetch('/icons/');
      if (response.ok) {
        const text = await response.text();
        
        // Parse HTML directory listing (common format)
        const iconRegex = /href="([^"]+\.(png|svg|jpg|jpeg))"/gi;
        const matches = Array.from(text.matchAll(iconRegex));
        
        if (matches.length > 0) {
          return matches.map(match => match[1]);
        }
      }
    } catch (error) {
      // Directory listing not supported
    }
    return [];
  }

  private async smartIconScanning(): Promise<string[]> {
    console.log('🔍 Starting smart icon scanning...');
    
    // Generate potential icon names based on common patterns
    const commonIcons = this.generateCommonIconPatterns();
    const validIcons: string[] = [];
    
    const batchSize = 30;
    let processed = 0;

    for (let i = 0; i < commonIcons.length; i += batchSize) {
      const batch = commonIcons.slice(i, i + batchSize);
      processed += batch.length;
      
      const progressPercent = Math.round((processed / commonIcons.length) * 100);
      console.log(`🔍 Scanning progress: ${progressPercent}% (${validIcons.length} found)`);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (fileName) => {
          try {
            const response = await fetch(`/icons/${fileName}`, { 
              method: 'HEAD',
              cache: 'force-cache'
            });
            return response.ok ? fileName : null;
          } catch {
            return null;
          }
        })
      );
      
      const foundIcons = batchResults
        .filter((result): result is PromiseFulfilledResult<string> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);
        
      validIcons.push(...foundIcons);
      
      // Small delay to prevent overwhelming the server
      if (i + batchSize < commonIcons.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`✅ Smart scanning complete: found ${validIcons.length} icons`);
    return validIcons;
  }

  private generateCommonIconPatterns(): string[] {
    // Generate patterns based on common tech icon naming conventions
    const technologies = [
      'React', 'Vue', 'Angular', 'Node', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google', 'Firebase', 'MongoDB', 'PostgreSQL', 'MySQL',
      'Redis', 'Git', 'GitHub', 'GitLab', 'VSCode', 'IntelliJ', 'Eclipse', 'Chrome', 'Firefox', 'Safari',
      'Linux', 'Ubuntu', 'Debian', 'CentOS', 'Windows', 'Apple', 'Android', 'iOS', 'Flutter', 'Dart',
      'PHP', 'Laravel', 'Symfony', 'Django', 'Flask', 'Rails', 'Spring', 'Express', 'Nginx', 'Apache',
      'Webpack', 'Vite', 'Rollup', 'Babel', 'ESLint', 'Prettier', 'Jest', 'Cypress', 'Selenium',
      'Figma', 'Sketch', 'Adobe', 'Photoshop', 'Illustrator', 'Canva', 'Blender', 'Unity', 'Unreal',
      'Slack', 'Discord', 'Zoom', 'Teams', 'Notion', 'Trello', 'Jira', 'Confluence', 'Asana'
    ];

    const extensions = ['.png', '.svg', '.jpg', '.jpeg'];
    const patterns = [];

    // Generate different naming patterns
    technologies.forEach(tech => {
      extensions.forEach(ext => {
        patterns.push(tech + ext);
        patterns.push(tech.toLowerCase() + ext);
        patterns.push(tech + '-Logo' + ext);
        patterns.push(tech + '-Icon' + ext);
        patterns.push(tech.replace(/\s+/g, '-') + ext);
        patterns.push(tech.replace(/\s+/g, '_') + ext);
      });
    });

    // Add common file naming patterns found in icon libraries
    const commonPatterns = [
      'C.png', 'C++.png', 'C#.png', 'HTML5.png', 'CSS3.png', 'jQuery.png', 'npm.png', 'yarn.png',
      'VS-Code.png', 'Visual-Studio-Code.png', 'NextJS.png', 'Next.js.png', 'NuxtJS.png', 'Nuxt.js.png',
      'VueJS.png', 'Vue.js.png', 'ReactJS.png', 'AngularJS.png', 'NodeJS.png', 'Node.js.png'
    ];

    patterns.push(...commonPatterns);
    
    // Remove duplicates and return
    return [...new Set(patterns)];
  }

  private formatIconName(fileName: string): string {
    // Preserve original case to avoid image loading issues
    return fileName
      .replace(/[-_()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private categorizeIcon(fileName: string): string {
    const name = fileName.toLowerCase();
    
    // Programming Languages
    if (name.match(/\b(java|python|javascript|typescript|c\+\+|c#|php|ruby|go|rust|swift|kotlin|scala|dart)\b/)) {
      return 'Programming Languages';
    }
    
    // Frameworks & Libraries
    if (name.match(/\b(react|vue|angular|django|flask|spring|laravel|rails|express|fastapi)\b/)) {
      return 'Frameworks';
    }
    
    // Databases
    if (name.match(/\b(mysql|postgresql|mongodb|redis|elasticsearch|cassandra|sqlite|oracle)\b/)) {
      return 'Databases';
    }
    
    // Cloud & DevOps
    if (name.match(/\b(aws|azure|google|docker|kubernetes|jenkins|terraform|ansible|gitlab)\b/)) {
      return 'Cloud & DevOps';
    }
    
    // Design Tools
    if (name.match(/\b(photoshop|illustrator|figma|sketch|adobe|canva|blender)\b/)) {
      return 'Design Tools';
    }
    
    // Operating Systems
    if (name.match(/\b(linux|windows|macos|ubuntu|debian|centos|arch)\b/)) {
      return 'Operating Systems';
    }
    
    // Development Tools
    if (name.match(/\b(vscode|intellij|eclipse|git|github|npm|yarn|webpack|babel)\b/)) {
      return 'Development Tools';
    }
    
    return 'Other';
  }

  // Method to refresh icons (useful for development)
  async refreshIcons(): Promise<void> {
    this.loaded = false;
    this.icons = [];
    await this.loadIcons();
  }
}

export const publicIconService = new PublicIconService();
export default publicIconService;