# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e6]:
    - heading "Welcome Back" [level=1] [ref=e8]:
      - text: Welcome
      - text: Back
    - paragraph [ref=e9]: Access your dashboard and manage your operations.
    - generic [ref=e10]:
      - generic [ref=e11]:
        - text: Username or Email
        - textbox "Username or Email" [ref=e12]:
          - /placeholder: Enter credentials
      - generic [ref=e13]:
        - text: Password
        - generic [ref=e14]:
          - textbox "Password" [ref=e15]:
            - /placeholder: Enter password
          - button [ref=e16]:
            - img [ref=e17]
      - generic [ref=e20]:
        - generic [ref=e21] [cursor=pointer]:
          - checkbox "Remember me" [ref=e22]
          - generic [ref=e23]: Remember me
        - link "Forgot Password?" [ref=e24] [cursor=pointer]:
          - /url: "#"
      - button "Login to QueueLanka" [ref=e25]
    - paragraph [ref=e26]:
      - text: Don't have an account?
      - link "Create account now" [ref=e27] [cursor=pointer]:
        - /url: /register
  - generic [ref=e28]:
    - img "Streamlined Operations" [ref=e30]
    - generic [ref=e32]:
      - generic [ref=e34]: Operations Simplified
      - heading "Manage your branch operations with unprecedented precision." [level=2] [ref=e35]
      - paragraph [ref=e36]: — QueueLanka Intelligence
```