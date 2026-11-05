# Roadmap
- [ ] Correct immediate authenticated signup, simple passwords, sign-in, sign-out and recovery; verify hosted settings and real flows.
- [x] Hero performance: smooth parallax, lighter images
- [x] Lovable Cloud + auth (signup, login, logout, password reset), protected editor, navbar session state
- [x] Stripe plans checkout, free trial (1 video per account), paywall after download
- [x] Test Kiwify approval, renewal, cancellation and refund handler; correct processing failures (automated signed requests).
- [ ] Verify actual Kiwify product mapping and payment readback: blocked on real Product / Subscription.plan payloads; all public links show DARKCUT, isolated test-account administration returned 403.
- [x] Simplify signup form to accept eight characters and fix managed Google sign-in initiation; 33 tests pass.
- [ ] Align hosted password requirements: user must set minimum 8 and remove required character classes in More → Users → Auth settings → Email; agent cannot change these settings.
- [ ] Complete Google account sign-in: provider initiation verified; requires real Google authorization.
