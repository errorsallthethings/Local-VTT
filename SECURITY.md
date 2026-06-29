# Security Policy

## Supported Versions

Local VTT is currently pre-1.0. Security fixes are provided for the latest released version only.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
| < 0.1   | No        |

If you are using an older release, please update to the latest available version before reporting an issue.

## Reporting a Vulnerability

Please do not report security vulnerabilities in public GitHub issues.

To report a vulnerability, use GitHub's private vulnerability reporting feature for this repository:

https://github.com/errorsallthethings/Local-VTT/security/advisories/new

Please include as much detail as you can, including:

- A description of the vulnerability
- Steps to reproduce it
- The affected version or commit
- Any relevant files, logs, screenshots, or proof-of-concept details
- Whether the issue affects saved local data, imported map/image files, Electron behavior, or system access

## Response Expectations

I will make a best effort to acknowledge valid reports within 7 days.

After reviewing the report, I may:

- Accept the vulnerability and work on a fix
- Ask for more information
- Decline the report if it is not reproducible, not security-related, or does not affect a supported version

If a vulnerability is accepted, I will aim to provide updates as meaningful progress is made and release a fix as soon as practical.

## Scope

Security issues may include, but are not limited to:

- Unsafe handling of local files
- Path traversal or unintended file access
- Electron security issues
- Cross-site scripting or script injection inside the app UI
- Unsafe dependency behavior
- Vulnerabilities that could affect user-created campaign, map, or session data

Out of scope:

- Issues requiring already-compromised local system access
- Denial-of-service issues with no practical security impact
- Reports against unsupported versions
- General bugs, feature requests, or usability issues

## Disclosure

Please allow time for the vulnerability to be reviewed and fixed before publicly disclosing details. Coordinated disclosure helps protect users while a fix is prepared.
