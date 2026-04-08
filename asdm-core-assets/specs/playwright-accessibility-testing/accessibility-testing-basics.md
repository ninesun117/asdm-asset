# Accessibility Testing Basics

Fundamentals of accessibility testing and WCAG compliance.

## What is Accessibility Testing?

Accessibility testing ensures that web applications are usable by people with disabilities, including:
- Visual impairments
- Hearing impairments
- Motor disabilities
- Cognitive disabilities

## Types of Accessibility Testing

### 1. Automated Testing
- Fast and repeatable
- Catches ~30-40% of issues
- Tools: axe-core, Lighthouse, WAVE

### 2. Manual Testing
- Keyboard navigation
- Screen reader testing
- Color contrast verification

### 3. User Testing
- Testing with actual users with disabilities
- Provides real-world feedback
- Most valuable but resource-intensive

## WCAG 2.1 Overview

### Principles (POUR)

#### Perceivable
Information must be presentable in ways users can perceive.

Guidelines:
- 1.1 Text Alternatives
- 1.2 Time-based Media
- 1.3 Adaptable
- 1.4 Distinguishable

#### Operable
Users must be able to operate the interface.

Guidelines:
- 2.1 Keyboard Accessible
- 2.2 Enough Time
- 2.3 Seizures and Physical Reactions
- 2.4 Navigable
- 2.5 Input Modalities

#### Understandable
Users must understand the information and operation.

Guidelines:
- 3.1 Readable
- 3.2 Predictable
- 3.3 Input Assistance

#### Robust
Content must be robust enough for assistive technologies.

Guidelines:
- 4.1 Compatible

### Conformance Levels

#### Level A (Minimum)
- Basic accessibility requirements
- Must pass for any conformance

#### Level AA (Recommended)
- Standard accessibility requirements
- Target for most organizations
- Legal requirement in many jurisdictions

#### Level AAA (Enhanced)
- Highest level of accessibility
- Not always achievable for all content

## Common Accessibility Issues

### Images
```html
<!-- ❌ Bad: Missing alt text -->
<img src="logo.png">

<!-- ✅ Good: Descriptive alt text -->
<img src="logo.png" alt="Company Logo">

<!-- ✅ Good: Decorative image -->
<img src="decoration.png" alt="" role="presentation">
```

### Forms
```html
<!-- ❌ Bad: Missing labels -->
<input type="text" name="email">

<!-- ✅ Good: Associated label -->
<label for="email">Email Address</label>
<input type="text" id="email" name="email">
```

### Headings
```html
<!-- ❌ Bad: Skipped heading levels -->
<h1>Main Title</h1>
<h3>Subtitle</h3>  <!-- Skipped h2 -->

<!-- ✅ Good: Proper hierarchy -->
<h1>Main Title</h1>
<h2>Subtitle</h2>
<h3>Detail</h3>
```

### Links
```html
<!-- ❌ Bad: Non-descriptive link text -->
<a href="/about">Click here</a>

<!-- ✅ Good: Descriptive link text -->
<a href="/about">Learn more about our company</a>
```

### Color Contrast
- Normal text: 4.5:1 minimum ratio
- Large text: 3:1 minimum ratio
- UI components: 3:1 minimum ratio

### Keyboard Accessibility
- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- No keyboard traps

## Testing Strategies

### Shift Left
- Include accessibility in design phase
- Test during development
- Fix issues early when cheaper

### Continuous Testing
- Automate in CI/CD pipeline
- Run on every pull request
- Track accessibility debt

### Comprehensive Coverage
- Test all pages and components
- Test different states (error, loading, etc.)
- Test with multiple assistive technologies

## Assistive Technologies

### Screen Readers
- NVDA (Windows, free)
- JAWS (Windows, paid)
- VoiceOver (macOS/iOS, built-in)
- TalkBack (Android, built-in)

### Other Tools
- Screen magnifiers
- Speech recognition
- Switch devices
- High contrast modes

## Legal Requirements

### ADA (Americans with Disabilities Act)
- Applies to US organizations
- Requires accessible digital content

### Section 508
- US federal agencies
- Specific technical requirements

### EN 301 549
- European accessibility standard
- Aligns with WCAG 2.1

### AODA
- Ontario, Canada
- Web accessibility requirements

## Best Practices Summary

1. ✅ Understand WCAG principles
2. ✅ Use automated tools for quick wins
3. ✅ Test keyboard navigation manually
4. ✅ Test with screen readers
5. ✅ Verify color contrast
6. ✅ Include accessibility in definition of done
7. ✅ Test early and often
8. ✅ Document and track violations
9. ✅ Involve users with disabilities
10. ✅ Keep up with standards updates
