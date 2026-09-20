# Test & Scratch File Cleanup Rule

## Immediate Cleanup Policy
- **No Lingering Scratch / Test Files**: Any temporary test scripts, verification scripts (`.mjs`, `.js`), scratch runners, or exploratory files created to test or verify functionality MUST be deleted immediately after their execution and verification are completed.
- **Clean Repository**: Do not leave temporary test files or scratch files in the repository.
- **Ephemeral Verification**: Verification can be executed on-the-fly, but test files, temporary scripts, and scratch data files must be removed so the codebase only contains production application code.
