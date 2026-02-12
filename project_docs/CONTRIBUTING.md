# Contributing to jxpush

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to jxpush. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 🛠️ Local Development Workflow

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR-USERNAME/jxpush.git
   cd jxpush
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run Tests**
   Ensure everything is working before you start.
   ```bash
   npm run test
   ```

4. **Create a Branch**
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

5. **Code & Test**
   - Write your code in `src/`
   - Add tests in `tests/`
   - Run `npm run test:watch` to test while you code

6. **Lint & Format**
   ```bash
   npm run lint
   npm run format
   ```

## 📏 Commit Style

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

- `feat: add scheduling support`
- `fix: resolve retry timeout issue`
- `docs: update README examples`
- `refactor: simplify queue logic`
- `test: add integration tests for expo`

## ✅ PR Checklist

- [ ] Tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] New features have new tests
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow Conventional Commits

## 💡 Feature Proposals

1. Open an issue with the **Feature Request** template.
2. Discuss the implementation details.
3. Once approved, start coding!

## 🐞 Reporting Bugs

1. Check if the issue already exists.
2. Open a new issue with the **Bug Report** template.
3. Provide a minimal reproduction example.
