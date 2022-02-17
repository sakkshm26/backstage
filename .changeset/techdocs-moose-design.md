---
'@backstage/plugin-techdocs': minor
---

Adjust the Tech Docs page theme as a side effect of the `mkdocs-material` theme update.
If you don't use `techdocs-cli` with docker, you have to install the mkdocs-techdocs-core plugin version 0.2.3 (which under the hood installs `mkdocs-material 8.1.11`).

**Breaking**: The `PyMdown` extensions have also been updated and some syntax may have changed, so it is recommended that you check the extension's documentation if something stops working.
For example, the syntax of tags below was deprecated in `PyMdown` extensions `v.7.0` and in `v.8.0.0` it has been removed. This means that the old syntax specified below no longer works.

````markdown
```markdown tab="tab"
This is some markdown
```

```markdown tab="tab 2"
This is some markdown in tab 2
```
````
