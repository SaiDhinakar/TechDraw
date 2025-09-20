# Contributing to TechDraw

First off, thank you for considering contributing to TechDraw! 🎉 

TechDraw is an open-source AI-powered diagramming tool, and we welcome contributions from the community. Whether you're fixing bugs, adding new features, improving documentation, or contributing technology icons, every contribution helps make TechDraw better.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Contributing Icons](#contributing-icons)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Community](#community)

## 🤝 Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and help them learn
- **Be constructive**: Focus on helping and improving the project
- **Be patient**: Remember that everyone has different skill levels

## 🚀 Getting Started

### Prerequisites

Before contributing, make sure you have:

- **Node.js 18+** installed
- **Git** for version control
- A **GitHub account**
- Basic knowledge of **React**, **TypeScript**, and **modern JavaScript**

### First Steps

1. **Fork the repository** on GitHub
2. **Star the project** ⭐ (it helps!)
3. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/techdraw.git
   cd techdraw
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🛠️ How to Contribute

### Types of Contributions We Welcome

#### 🐛 Bug Reports
- Found a bug? Open an issue with:
  - Clear description of the problem
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots if applicable
  - Browser/OS information

#### ✨ Feature Requests
- Have an idea? We'd love to hear it!
- Open an issue with:
  - Clear description of the feature
  - Use cases and benefits
  - Mockups or sketches if helpful

#### 🔧 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Refactoring
- Documentation updates

#### 🎨 UI/UX Improvements
- Design enhancements
- Accessibility improvements
- User experience optimizations
- Mobile responsiveness

## 🎯 Contributing Icons

One of the easiest ways to contribute is by adding new technology icons to our library!

### Icon Requirements

#### Technical Specifications
- **Format**: PNG format preferred
- **Size**: 64x64 pixels (will be automatically resized)
- **Quality**: High-resolution, crisp, and clear
- **Background**: Transparent background preferred
- **Style**: Official brand icons or high-quality representations

#### Naming Convention
- Use kebab-case: `my-technology.png`
- Be descriptive: `aws-lambda.png` not `lambda.png`
- Include version if applicable: `react-18.png`

#### Where to Place Icons
```
icons/
├── your-new-icon.png
└── ...existing icons
```

### Adding Icons Process

1. **Find or Create Icons**
   - Use official brand assets when possible
   - Ensure you have rights to use the icon
   - Check existing icons to avoid duplicates

2. **Prepare the Icon**
   ```bash
   # Recommended tools for icon preparation:
   # - GIMP (free)
   # - Photoshop 
   # - Online tools like Canva
   
   # Resize to 64x64 pixels
   # Remove background if needed
   # Optimize file size
   ```

3. **Add to Project**
   - Place PNG file in `/icons/` directory
   - The build system will automatically include it
   - Test locally: `npm run generate-icons`

4. **Submit Pull Request**
   - Include icon in your PR
   - Mention the technology it represents
   - Provide source/attribution if required

### Icon Categories We Need

#### Cloud Providers
- ✅ AWS services
- ✅ Azure services  
- ✅ Google Cloud services
- ❌ Oracle Cloud
- ❌ IBM Cloud
- ❌ DigitalOcean services

#### Programming Languages
- ✅ Popular languages (Python, Java, etc.)
- ❌ Emerging languages (Zig, V, etc.)
- ❌ Domain-specific languages

#### Databases
- ✅ SQL databases
- ✅ NoSQL databases
- ❌ Vector databases
- ❌ Time-series databases

#### DevOps Tools
- ✅ Container tools
- ✅ CI/CD platforms
- ❌ Monitoring tools
- ❌ Security tools

#### Frameworks & Libraries
- ✅ Web frameworks
- ❌ Mobile frameworks
- ❌ Game engines
- ❌ Scientific computing

**Legend**: ✅ Well covered, ❌ Needs contributions

## 💻 Development Setup

### Project Structure

```
techdraw/
├── src/
│   ├── components/     # React components
│   │   ├── nodes/     # Custom node components
│   │   ├── ContextMenu.tsx
│   │   ├── EditModal.tsx
│   │   └── AIModifyModal.tsx
│   ├── lib/           # Core libraries
│   │   ├── ai.ts      # AI provider integrations
│   │   ├── exportService.ts
│   │   └── utils.ts
│   ├── types/         # TypeScript definitions
│   ├── hooks/         # Custom React hooks
│   └── App.tsx
├── icons/             # Technology icons
├── scripts/           # Build scripts
├── public/            # Static assets
└── screenshots/       # Documentation images
```

### Key Technologies

- **React 19.1.1**: Modern React with hooks
- **TypeScript**: Type-safe development
- **React Flow**: Node-based editor
- **Tailwind CSS**: Utility-first styling
- **Vite**: Build tool and dev server
- **Vitest**: Testing framework

### Environment Setup

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Add your API keys** (optional for basic development):
   ```env
   VITE_OPENAI_API_KEY=your_key_here
   VITE_ANTHROPIC_API_KEY=your_key_here
   VITE_GOOGLE_API_KEY=your_key_here
   VITE_GROQ_API_KEY=your_key_here
   ```

3. **Start development**:
   ```bash
   npm run dev
   ```

## 🔄 Pull Request Process

### Before Submitting

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm run lint          # Check code style
   npm run type-check    # Check TypeScript
   npm run build         # Test build process
   ```

4. **Update documentation** if needed

5. **Add/update tests** for new functionality

### Submitting the PR

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub with:
   - **Clear title**: Describe what the PR does
   - **Detailed description**: Explain the changes and why
   - **Screenshots**: If UI changes are involved
   - **Testing instructions**: How to test your changes
   - **Closes #123**: Reference any related issues

3. **Respond to feedback** promptly and professionally

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Icon contribution

## Testing
- [ ] I have tested these changes locally
- [ ] I have added/updated tests as needed
- [ ] All existing tests pass

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated documentation as needed
```

## 📏 Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Use explicit types
interface CustomNodeData {
  title: string;
  content: string;
  icon: string;
}

// ✅ Good: Use meaningful names
const handleNodeDelete = (nodeId: string) => { ... }

// ❌ Bad: Avoid any types
const data: any = { ... }

// ❌ Bad: Unclear naming
const handle = (id: string) => { ... }
```

### React Best Practices

```tsx
// ✅ Good: Use hooks properly
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<string>('');
  
  const handleClick = useCallback(() => {
    // Handle click
  }, []);

  return <div onClick={handleClick}>{state}</div>;
};

// ✅ Good: Extract complex logic
const useNodeManager = () => {
  // Custom hook logic
  return { nodes, addNode, deleteNode };
};
```

### Styling Guidelines

```css
/* ✅ Good: Use Tailwind utilities */
<div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow-md">

/* ✅ Good: Custom CSS for complex styling */
.node-container {
  @apply relative border-2 border-gray-200 rounded-lg;
  transition: all 0.2s ease-in-out;
}

/* ❌ Bad: Inline styles for complex styling */
<div style={{ display: 'flex', alignItems: 'center', ... }}>
```

### File Organization

```
components/
├── ui/              # Reusable UI components
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── Input.tsx
├── features/        # Feature-specific components
│   ├── diagram/
│   ├── ai/
│   └── export/
└── layout/          # Layout components
    ├── Header.tsx
    └── Sidebar.tsx
```

## 🧪 Testing Guidelines

### Writing Tests

```typescript
// Example test structure
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomNode } from './CustomNode';

describe('CustomNode', () => {
  const defaultProps = {
    data: { title: 'Test Node', content: 'Test content', icon: 'react' }
  };

  it('should render node title and content', () => {
    render(<CustomNode {...defaultProps} />);
    
    expect(screen.getByText('Test Node')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onSelect = jest.fn();
    render(<CustomNode {...defaultProps} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Test Node'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Commands

```bash
npm test              # Run tests
npm run test:watch    # Run tests in watch mode  
npm run test:coverage # Run with coverage report
```

## 🎨 Design Guidelines

### UI Principles

- **Consistency**: Follow established patterns
- **Accessibility**: Support keyboard navigation and screen readers
- **Performance**: Optimize for smooth interactions
- **Mobile-friendly**: Ensure responsive design

### Color Palette

```css
/* Primary colors */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;

/* Semantic colors */
--success: #10b981;
--warning: #f59e0b;  
--error: #ef4444;
--info: #3b82f6;
```

## 🏆 Recognition

### Contributors Wall

All contributors will be recognized in:

- **README.md**: Contributors section
- **GitHub**: Automatic contributor list
- **Releases**: Acknowledgment in release notes

### Types of Recognition

- **🥇 Major Contributors**: Significant features or multiple contributions
- **🥈 Regular Contributors**: Bug fixes and improvements
- **🥉 First-time Contributors**: Welcome to the community!
- **🎨 Icon Contributors**: Expanding our icon library
- **📚 Documentation**: Improving docs and guides

## 📞 Community

### Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: Real-time community chat (coming soon)

### Communication Guidelines

- **Be respectful**: Treat everyone with kindness
- **Be clear**: Provide context and details
- **Be patient**: Maintainers respond as time allows
- **Search first**: Check if your question has been answered

### Maintainer Response Time

- **Critical bugs**: 24-48 hours
- **Feature requests**: 1 week
- **Pull reviews**: 3-5 days
- **General questions**: 2-3 days

## 🎯 Good First Issues

Looking for your first contribution? Look for issues labeled:

- `good first issue`: Perfect for newcomers
- `help wanted`: Community help needed
- `documentation`: Improve docs
- `icons needed`: Add new technology icons

### Beginner-Friendly Tasks

1. **Add new technology icons**
   - Find missing icons in our library
   - Follow the icon guidelines above
   - Great way to get familiar with the project

2. **Improve documentation**
   - Fix typos or unclear instructions
   - Add examples or tutorials
   - Update outdated information

3. **Write tests**
   - Add tests for existing components
   - Improve test coverage
   - Learn the codebase structure

4. **Fix small bugs**
   - Look for `bug` + `good first issue` labels
   - Usually well-defined scope
   - Good for learning debugging skills

## 📖 Additional Resources

### Learning Resources

- **React Flow Docs**: https://reactflow.dev/docs
- **React Best Practices**: https://react.dev/learn
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs

### Similar Projects

Study these for inspiration:
- Draw.io / Diagrams.net
- Lucidchart
- Whimsical
- Excalidraw

## 🙏 Thank You

Thank you for taking the time to contribute to TechDraw! Your efforts help make this tool better for developers and architects worldwide.

Questions? Feel free to reach out through GitHub Issues or Discussions.

---

**Happy Contributing!** 🚀

*Let's build something amazing together*