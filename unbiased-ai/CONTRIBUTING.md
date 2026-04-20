# Contributing to Unbiased AI

First off, thank you for considering contributing to Unbiased AI! It's people like you that make Unbiased AI such a great tool.

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

---

## How Can I Contribute?

### Reporting Bugs
Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps which reproduce the problem** in as much detail as possible
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior
- **Explain which behavior you expected to see instead and why**
- **Include screenshots and animated GIFs if possible**
- **Include your environment details** (OS, browser, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement** in as much detail as possible
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior** and **the suggested behavior**
- **Explain why this enhancement would be useful**

### Pull Requests

- Fill in the required template
- Follow the styleguides (see below)
- End all files with a newline
- Avoid platform-dependent code

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Firebase account
- Supabase account

### Local Development

1. **Fork and clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/unbiased-ai.git
cd unbiased-ai
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Set up environment variables**
```bash
# Create .env.local in frontend/
REACT_APP_FIREBASE_API_KEY=your_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_BACKEND_URL=http://localhost:54321/functions/v1
```

4. **Start the development server**
```bash
npm start
```

The app will be available at `http://localhost:3000`

5. **Run tests**
```bash
npm test
```

6. **Run linting**
```bash
npm run lint
```

---

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - 🎨 when improving the format/structure of the code
  - 🐛 when fixing a bug
  - ✨ when adding a feature
  - 📚 when writing docs
  - 🧪 when adding tests
  - ⚡ when improving performance
  - 🔒 when dealing with security
  - 🚀 when deploying

Example:
```
✨ Add web scanning feature for URLs

- Implement web-scan function
- Add URL extraction logic
- Cache results for 24 hours
- Add tests for edge cases

Closes #123
```

### JavaScript Styleguide

We use ESLint to enforce code style. Make sure your code passes linting:

```bash
npm run lint
```

Key guidelines:
- Use ES6 features (const/let, arrow functions, template literals)
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions small and focused
- Avoid nested callbacks (use async/await)
- Use consistent indentation (2 spaces)

Example:
```javascript
/**
 * Detects bias in provided content
 * @param {string} content - The text to analyze
 * @param {string} type - Type of content (text, email, social)
 * @returns {Promise<Object>} Bias analysis result
 * @throws {Error} If API call fails
 */
async function detectBias(content, type = 'text') {
  if (!content || content.length === 0) {
    throw new Error('Content cannot be empty')
  }

  const token = await getAuthToken()
  const response = await fetch(`${API_URL}/detect-bias`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, type })
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}
```

### React Component Styleguide

- Use functional components with hooks
- Use custom hooks to share logic
- Keep components focused and single-purpose
- Use PropTypes for type checking
- Write descriptive prop names

Example:
```javascript
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Button, Spinner } from '../components/library'

/**
 * BiasAnalyzer - Main component for bias analysis
 */
function BiasAnalyzer({ onAnalysisComplete }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await api.detectBias(content)
      onAnalysisComplete(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste content to analyze..."
        className="w-full p-2 border rounded"
      />

      <Button
        onClick={handleAnalyze}
        loading={loading}
        disabled={!content.trim()}
      >
        Analyze for Bias
      </Button>

      {error && <Alert message={error} type="error" />}
      {loading && <Spinner />}
    </div>
  )
}

BiasAnalyzer.propTypes = {
  onAnalysisComplete: PropTypes.func.isRequired
}

export default BiasAnalyzer
```

---

## Testing

### Writing Tests

- Write tests for new features
- Maintain >80% code coverage
- Use descriptive test names
- Group tests with describe blocks

Example:
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import BiasAnalyzer from '../BiasAnalyzer'

describe('BiasAnalyzer Component', () => {
  it('renders textarea for input', () => {
    render(<BiasAnalyzer onAnalysisComplete={jest.fn()} />)
    expect(screen.getByPlaceholderText(/Paste content/i)).toBeInTheDocument()
  })

  it('analyzes content when button is clicked', async () => {
    const onComplete = jest.fn()
    render(<BiasAnalyzer onAnalysisComplete={onComplete} />)

    fireEvent.change(screen.getByPlaceholderText(/Paste content/i), {
      target: { value: 'Test content' }
    })

    fireEvent.click(screen.getByText(/Analyze for Bias/i))

    // Wait for API call to complete
    await screen.findByText(/Loading/i)
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test BiasAnalyzer
```

---

## Documentation

### Writing Documentation

- Use clear, concise language
- Include code examples
- Add screenshots where helpful
- Keep docs up-to-date with code changes

### Updating README

If you're adding a new feature, please update the README to include:
- What the feature does
- How to use it
- Example code if applicable
- Any new environment variables needed

---

## Submitting Changes

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
- Write code
- Add tests
- Update documentation

3. **Run checks**
```bash
npm run lint      # Check code style
npm test          # Run tests
npm run build     # Build for production
```

4. **Commit and push**
```bash
git add .
git commit -m "✨ Add your feature description"
git push origin feature/your-feature-name
```

5. **Create Pull Request**
- Go to GitHub and create a PR
- Fill out the PR template
- Link any related issues
- Wait for reviews

### PR Review Process

- At least one maintainer review required
- All CI checks must pass
- Code coverage should not decrease
- No merge conflicts

---

## Release Process

Releases are handled by maintainers. Here's the process:

1. Merge PRs into main branch
2. Update version in package.json
3. Create git tag: `git tag v1.0.0`
4. Push tags: `git push --tags`
5. GitHub Actions automatically deploys to production

---

## Additional Notes

### Project Structure
```
unbiased-ai/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── library/       # Reusable components
│   │   │   ├── pages/         # Page components
│   │   │   └── ...
│   │   ├── __tests__/         # Test files
│   │   ├── styles/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
├── supabase/
│   ├── functions/             # Edge functions
│   └── migrations/            # Database migrations
├── .github/
│   └── workflows/             # CI/CD pipelines
└── README.md
```

### Common Commands
```bash
# Development
npm start                 # Start dev server
npm test                  # Run tests
npm run build            # Build for production

# Deployment
npm run deploy           # Deploy to Firebase
supabase functions deploy # Deploy Supabase functions

# Code Quality
npm run lint             # Lint code
npm run format           # Format code
npm test -- --coverage   # Check coverage
```

### Debugging

Use React DevTools browser extension for React debugging:
- https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi

Set breakpoints in DevTools Sources tab and use console.log() sparingly.

---

## Getting Help

- **Documentation**: Check [docs/](./docs/) folder
- **Issues**: Search [GitHub Issues](https://github.com/KR-007J/unbiased-ai/issues)
- **Discussions**: Start a [GitHub Discussion](https://github.com/KR-007J/unbiased-ai/discussions)
- **Email**: support@unbiased-ai.dev

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to Unbiased AI! 🎉
